const express = require("express");
const { Order, Boutique, Product, OrderItem, Notification } = require("../models");
const { broadcast } = require("../utils/broadcaster");
const { envoyerConfirmationCommande, envoyerNotificationAdminNouvelleCommande } = require("../services/emailService");
const { clearCachePattern } = require("../config/cache");
const router = express.Router();

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  let boutique;
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Fallback pour récupérer l'event (non idéal pour webhook multi-tenant avec endpoint secret, mais on va le récupérer du payload après parsing si on ne vérifie pas la signature globale)

  // En architecture multi-tenant, chaque boutique a son propre endpointSecret
  // Si Stripe webhook endpoint_secret global n'est pas utilisé, on skip la vérification de signature ou on utilise un endpoint secret global.
  // Pour plus de sécurité, utilisez process.env.STRIPE_WEBHOOK_SECRET
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = require("stripe")(stripeSecretKey);

  if (endpointSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`❌ Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Si pas de secret configuré, on parse le JSON (req.body est un buffer via express.raw)
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      return res.status(400).send(`Webhook Parse Error: ${err.message}`);
    }
  }

  // Gérer l'événement checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Récupérer l'ID de la session Stripe
    const sessionId = session.id;

    try {
      // CAS 1: RECHARGE CRÉDIT MOBILE
      if (session.metadata?.type === "recharge_mobile") {
        const { boutiqueId, userId, phone, operatorName } = session.metadata;
        const totalEur = (session.amount_total || 0) / 100;

        let receiptUrl = null;
        try {
          if (session.payment_intent) {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ["latest_charge"] });
            if (pi.latest_charge && pi.latest_charge.receipt_url) {
              receiptUrl = pi.latest_charge.receipt_url;
            }
          }
        } catch (e) {
          console.error("Impossible de récupérer le reçu Stripe recharge:", e);
        }

        const newOrder = await Order.create({
          boutiqueId: boutiqueId ? Number(boutiqueId) : 1,
          clientId: userId ? Number(userId) : null,
          total: totalEur,
          sousTotal: totalEur,
          fraisLivraison: 0,
          statut: "recuperee",
          statutPaiement: "paye",
          typeVente: "recharge_mobile",
          moyenPaiement: "carte",
          stripeSessionId: sessionId,
          receiptUrl: receiptUrl,
          notes: `Recharge Crédit Mobile ${operatorName} pour le numéro ${phone}`
        });

        const cmdNum = "COM-B" + String(newOrder.id).padStart(3, "0");

        if (userId) {
          Notification.create({
            userId: Number(userId), boutiqueId: Number(boutiqueId), orderId: newOrder.id,
            title: "Recharge crédit envoyée ! 📲",
            message: `Votre recharge de crédit mobile (${operatorName}) a été transférée avec succès au ${phone} (#${cmdNum}).`,
            type: "order"
          }).catch(() => {});
        }

        Notification.create({
          userId: null, boutiqueId: Number(boutiqueId), orderId: newOrder.id,
          title: "Nouvelle Recharge Crédit Mobile",
          message: `Recharge de ${totalEur} € effectuée par carte pour le numéro ${phone}.`,
          type: "order"
        }).catch(() => {});

        clearCachePattern("cache:/api/store").catch(() => {});
        broadcast("order_created", { orderId: newOrder.id, statut: "recuperee", clientId: userId, boutiqueId });
        console.log(`✅ Recharge Mobile ${phone} enregistrée avec succès (#${newOrder.id})`);
      } else {
        // CAS 2: COMMANDE BOUTIQUE CLASSIQUE
        const order = await Order.findOne({ 
          where: { stripeSessionId: sessionId },
          include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }]
        });

        if (order && order.statut === "en_attente_paiement") {
          const bKey = boutique?.stripeSecretKey;
          const specificStripeSecret = (bKey && (bKey.startsWith("sk_") || bKey.startsWith("rk_"))) ? bKey : stripeSecretKey;
          const tenantStripe = require("stripe")(specificStripeSecret);

          let receiptUrl = null;
          try {
            if (session.payment_intent) {
              const pi = await tenantStripe.paymentIntents.retrieve(session.payment_intent, { expand: ["latest_charge"] });
              if (pi.latest_charge && pi.latest_charge.receipt_url) {
                receiptUrl = pi.latest_charge.receipt_url;
              }
            }
          } catch (e) {
            console.error("Impossible de récupérer le reçu Stripe:", e);
          }

          await order.update({ 
            statut: "en_attente", 
            statutPaiement: "paye",
            receiptUrl: receiptUrl
          });

          // Notifications
          const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
          Notification.create({
            userId: order.clientId, boutiqueId: order.boutiqueId, orderId: order.id,
            title: "Paiement validé",
            message: `Le paiement de votre commande #${cmdNum} a été validé avec succès.`,
            type: "order"
          }).catch(() => {});

          Notification.create({
            userId: null, boutiqueId: order.boutiqueId, orderId: order.id,
            title: "Paiement en ligne reçu",
            message: `Le paiement pour la commande #${cmdNum} a été confirmé via Stripe/Wero.`,
            type: "order"
          }).catch(() => {});

          clearCachePattern("cache:/api/store").catch(() => {});
          broadcast("order_updated", { orderId: order.id, statut: "en_attente", clientId: order.clientId, boutiqueId: order.boutiqueId });
          
          console.log(`✅ Commande ${order.id} validée suite au paiement Stripe (${sessionId})`);
        }
      }
    } catch (err) {
      console.error("❌ Erreur lors du traitement du webhook Stripe:", err);
      return res.status(500).send("Erreur interne");
    }
  }

  res.json({ received: true });
});

module.exports = router;
