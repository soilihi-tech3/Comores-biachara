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
      // Trouver la commande correspondante
      const order = await Order.findOne({ 
        where: { stripeSessionId: sessionId },
        include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }]
      });

      if (order && order.statut === "en_attente_paiement") {
        boutique = await Boutique.findByPk(order.boutiqueId);
        const specificStripeSecret = boutique.stripeSecretKey || stripeSecretKey;
        const tenantStripe = require("stripe")(specificStripeSecret);

        let receiptUrl = null;
        try {
          // Si on veut récupérer le reçu, il faut chercher le payment_intent
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

        const originUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        // Si nécessaire, envoyer e-mail de confirmation
        clearCachePattern("cache:/api/store").catch(() => {});
        broadcast("order_updated", { orderId: order.id, statut: "en_attente", clientId: order.clientId, boutiqueId: order.boutiqueId });
        
        console.log(`✅ Commande ${order.id} validée suite au paiement Stripe (${sessionId})`);
      }
    } catch (err) {
      console.error("❌ Erreur lors du traitement du webhook Stripe:", err);
      return res.status(500).send("Erreur interne");
    }
  }

  res.json({ received: true });
});

module.exports = router;
