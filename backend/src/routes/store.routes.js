const express = require("express");
const { Op } = require("sequelize");
const { sequelize, Product, Category, Order, OrderItem, Review, User, Notification, Famille, RechargePlan } = require("../models");
const { authenticate, requireRole, loadBoutique } = require("../middleware/auth");
const { cacheMiddleware, clearCachePattern } = require("../config/cache");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../services/email.service");
const { broadcast, addClient, removeClient } = require("../utils/broadcaster");

const router = express.Router({ mergeParams: true });

function getStripeSecretKey(boutique) {
  const bKey = boutique?.stripeSecretKey;
  if (bKey && (bKey.startsWith("sk_") || bKey.startsWith("rk_"))) {
    return bKey;
  }
  return process.env.STRIPE_SECRET_KEY;
}

// GET /api/store/:slug/realtime/events - SSE Stream for real-time app updates
router.get("/:slug/realtime/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const keepAlive = setInterval(() => {
    res.write(":\n\n");
  }, 15000);

  addClient(res);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeClient(res);
  });
});

// GET /api/store/:slug/manifest.json -> Dynamic PWA Manifest with custom store name and logo
router.get("/:slug/manifest.json", loadBoutique, (req, res) => {
  const b = req.boutique;
  const name = b.nom || "Marché Vert";
  const logo = b.logoUrl || "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=512&h=512&q=80";

  res.json({
    short_name: name,
    name: `${name} - Boutique & Vente Directe`,
    icons: [
      { src: logo, sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: logo, sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ],
    start_url: "/",
    background_color: "#163424",
    theme_color: "#163424",
    display: "standalone",
    orientation: "portrait-primary",
    description: `Application e-commerce et caisse POS pour ${name}.`
  });
});

// GET /api/store/:slug  -> infos publiques de la boutique (cached 5 min)
router.get("/:slug", loadBoutique, cacheMiddleware(300), (req, res) => {
  const b = req.boutique;
  res.json({
    id: b.id, nom: b.nom, slug: b.slug, logoUrl: b.logoUrl,
    couleurPrincipale: b.couleurPrincipale, fraisLivraison: b.fraisLivraison,
    zonesLivraison: b.zonesLivraison, bannerSlides: b.bannerSlides || [],
    sideBanners: b.sideBanners || [],
    telephone: b.telephone,
    telephone2: b.telephone2,
    adresse: b.adresse,
    adresse2: b.adresse2,
    adresseRetrait: b.adresseRetrait || "",
    emailContact: b.emailContact,
    aProposText: b.aProposText,
    horairesOuverture: b.horairesOuverture || "Tous les jours de 08h30 à 23h00",
    facebookUrl: b.facebookUrl || "",
    instagramUrl: b.instagramUrl || "",
    tiktokUrl: b.tiktokUrl || "",
    whatsappNumber: b.whatsappNumber || "",
    modulesActifs: b.modulesActifs || { vente: true, ventesHistorique: true, achats: true, fournisseurs: true, unites: true, homeBanners: true, sideBanners: true, commandes: true },
    modesPaiement: b.modesPaiement || { especes: true, mvola: true, holam: true, carte: false }
  });
});

// GET /api/store/:slug/familles (cached 10 min)
router.get("/:slug/familles", loadBoutique, cacheMiddleware(600), async (req, res, next) => {
  try {
    const list = await Famille.findAll({ where: { boutiqueId: req.boutique.id } });
    if (list.length === 0) {
      const defaults = [
        { nom: "Alimentation", boutiqueId: req.boutique.id },
        { nom: "Cosmétique", boutiqueId: req.boutique.id },
        { nom: "Maison & Entretien", boutiqueId: req.boutique.id }
      ];
      await Famille.bulkCreate(defaults);
      return res.json(await Famille.findAll({ where: { boutiqueId: req.boutique.id } }));
    }
    res.json(list);
  } catch (err) { next(err); }
});

// GET /api/store/:slug/categories (cached 10 min)
router.get("/:slug/categories", loadBoutique, cacheMiddleware(600), async (req, res, next) => {
  try {
    const categories = await Category.findAll({ where: { boutiqueId: req.boutique.id } });
    res.json(categories);
  } catch (err) { next(err); }
});

// GET /api/store/:slug/products?categoryId=&famille=&search=&promo=true (cached 2 min)
router.get("/:slug/products", loadBoutique, cacheMiddleware(120), async (req, res, next) => {
  try {
    const where = { boutiqueId: req.boutique.id };
    if (req.query.categoryId) where.categoryId = req.query.categoryId;

    const stripAccents = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    if (req.query.famille) {
      const famRaw = req.query.famille.trim();
      const famClean = stripAccents(famRaw);
      const searchConditions = [
        { famille: { [Op.like]: `%${famRaw}%` } },
        { famille: { [Op.like]: `%${famClean}%` } },
        { '$Category.famille$': { [Op.like]: `%${famRaw}%` } },
        { '$Category.famille$': { [Op.like]: `%${famClean}%` } },
        { '$Category.nom$': { [Op.like]: `%${famRaw}%` } },
        { '$Category.nom$': { [Op.like]: `%${famClean}%` } },
        { nom: { [Op.like]: `%${famRaw}%` } },
        { nom: { [Op.like]: `%${famClean}%` } }
      ];
      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: searchConditions }];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    if (req.query.search) {
      const qRaw = req.query.search.trim();
      const qClean = stripAccents(qRaw);
      const searchConditions = [
        { nom: { [Op.like]: `%${qRaw}%` } },
        { nom: { [Op.like]: `%${qClean}%` } },
        { famille: { [Op.like]: `%${qRaw}%` } },
        { famille: { [Op.like]: `%${qClean}%` } },
        { '$Category.nom$': { [Op.like]: `%${qRaw}%` } },
        { '$Category.nom$': { [Op.like]: `%${qClean}%` } },
        { '$Category.famille$': { [Op.like]: `%${qRaw}%` } },
        { '$Category.famille$': { [Op.like]: `%${qClean}%` } }
      ];
      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: searchConditions }];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    if (req.query.promo === "true") where.prixPromo = { [Op.ne]: null };

    const products = await Product.findAll({
      where,
      include: [{ model: Category }, { model: Review, as: "avis", where: { statut: "publie" }, required: false }],
      order: [["createdAt", "DESC"]],
    });
    res.json(products);
  } catch (err) { next(err); }
});

// GET /api/store/:slug/products/:id
router.get("/:slug/products/:id", loadBoutique, async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, boutiqueId: req.boutique.id },
      include: [
        { model: Category },
        { model: Review, as: "avis", where: { statut: "publie" }, required: false, include: [{ model: User, as: "auteur", attributes: ["nom"] }] },
      ],
    });
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/store/:slug/products/:id/reviews  (client connecté — commande récupérée/livrée requise)
router.post("/:slug/products/:id/reviews", loadBoutique, authenticate, requireRole("client"), async (req, res, next) => {
  try {
    const { note, commentaire, orderId } = req.body;
    if (!note || note < 1 || note > 5) return res.status(400).json({ message: "La note doit être comprise entre 1 et 5." });

    const product = await Product.findOne({ where: { id: req.params.id, boutiqueId: req.boutique.id } });
    if (!product) return res.status(404).json({ message: "Produit introuvable." });

    // Vérifier que le client a une commande contenant ce produit avec le statut 'recuperee' ou 'livree'
    const orderWhere = {
      clientId: req.user.id,
      boutiqueId: req.boutique.id,
      statut: { [Op.in]: ["recuperee", "livree"] }
    };
    if (orderId) {
      orderWhere.id = orderId;
    }

    const eligibleOrder = await Order.findOne({
      where: orderWhere,
      include: [{
        model: OrderItem,
        as: "items",
        where: { productId: product.id },
        required: true
      }]
    });

    if (!eligibleOrder) {
      return res.status(403).json({
        message: "Vous ne pouvez laisser un avis que pour les produits d'une commande récupérée ou livrée."
      });
    }

    // Vérifier si un avis existe déjà pour cet utilisateur et ce produit
    const existingReview = await Review.findOne({
      where: { productId: product.id, userId: req.user.id }
    });

    let review;
    if (existingReview) {
      await existingReview.update({ note, commentaire, statut: "publie" });
      review = existingReview;
    } else {
      review = await Review.create({ productId: product.id, userId: req.user.id, note, commentaire });
    }

    broadcast("product_updated", { productId: product.id });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

// POST /api/store/:slug/orders  (client connecté) — création de commande
router.post("/:slug/orders", loadBoutique, authenticate, requireRole("client"), async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, modeLivraison, adresseLivraison, moyenPaiement } = req.body;
    if (!items || !items.length) {
      await t.rollback();
      return res.status(400).json({ message: "Le panier est vide." });
    }
    if (modeLivraison === "domicile" && !adresseLivraison) {
      await t.rollback();
      return res.status(400).json({ message: "Une adresse de livraison est requise." });
    }

    let sousTotal = 0;
    const lignesAvecPrix = [];
    for (const item of items) {
      const product = await Product.findOne({ where: { id: item.productId, boutiqueId: req.boutique.id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!product) { await t.rollback(); return res.status(404).json({ message: `Produit ${item.productId} introuvable.` }); }
      if (product.stock < item.quantite) { await t.rollback(); return res.status(409).json({ message: `Stock insuffisant pour ${product.nom}.` }); }

      const prixUnitaire = product.prixPromo || product.prix;
      sousTotal += prixUnitaire * item.quantite;
      lignesAvecPrix.push({ product, quantite: item.quantite, prixUnitaire });
    }

    const fraisLivraison = modeLivraison === "domicile" ? Number(req.boutique.fraisLivraison) : 0;
    
    // Si paiement par carte Stripe, on met en attente de paiement (attente de redirection). Pour Wero, Cash et Mvola, la commande est en_attente directe.
    const statutInit = (moyenPaiement === "carte") ? "en_attente_paiement" : "en_attente";

    if (moyenPaiement === "carte") {
      const stripeSecretKey = getStripeSecretKey(req.boutique);
      if (!stripeSecretKey || (!stripeSecretKey.startsWith("sk_") && !stripeSecretKey.startsWith("rk_"))) {
        await t.rollback();
        return res.status(400).json({ message: "Ce mode de paiement n'est pas encore configuré par la boutique. Veuillez en choisir un autre." });
      }
    }

    const order = await Order.create({
      boutiqueId: req.boutique.id, clientId: req.user.id, statut: statutInit,
      modeLivraison, adresseLivraison, moyenPaiement, sousTotal, fraisLivraison,
      total: sousTotal + fraisLivraison,
    }, { transaction: t });

    for (const ligne of lignesAvecPrix) {
      await OrderItem.create({ orderId: order.id, productId: ligne.product.id, quantite: ligne.quantite, prixUnitaire: ligne.prixUnitaire }, { transaction: t });
      await ligne.product.update({ stock: ligne.product.stock - ligne.quantite, ventesCount: ligne.product.ventesCount + ligne.quantite }, { transaction: t });
    }

    await t.commit();
    const complete = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }] });
    
    // Notifications automatiques
    const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
    const totalFormateeur = Number(sousTotal + fraisLivraison).toFixed(2);
    Notification.create({
      userId: req.user.id, boutiqueId: req.boutique.id, orderId: order.id,
      title: "Commande enregistrée",
      message: `Votre commande #${cmdNum} (${totalFormateeur} €) a été enregistrée avec succès.`,
      type: "order"
    }).catch(() => {});

    Notification.create({
      userId: null, boutiqueId: req.boutique.id, orderId: order.id,
      title: "Nouvelle commande reçue !",
      message: `Nouvelle commande #${cmdNum} reçue de ${req.user.nom} (${totalFormateeur} €).`,
      type: "order"
    }).catch(() => {});

    const { envoyerNotificationAdminNouvelleCommande, envoyerConfirmationCommande } = require("../services/emailService");
    const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    if (statutInit !== "en_attente_paiement") {
      // Notification e-mail transactionnelle au client
      if (req.user.email) {
        envoyerConfirmationCommande(req.user.email, complete, req.boutique.nom).catch((err) => console.error("⚠️ Email confirmation client non envoyé:", err.message));
      }

      // Notification e-mail transactionnelle à l'administrateur de la boutique
      const adminEmail = req.boutique.emailContact || process.env.BREVO_SENDER_EMAIL;
      if (adminEmail) {
        envoyerNotificationAdminNouvelleCommande(adminEmail, complete, req.boutique.nom, originUrl).catch((err) => console.error("⚠️ Email notification admin non envoyé:", err.message));
      }
    }

    clearCachePattern("cache:/api/store").catch(() => {});
    broadcast("order_created", { orderId: order.id, clientId: req.user.id, boutiqueId: req.boutique.id });
    broadcast("product_updated", { boutiqueId: req.boutique.id });

    res.status(201).json(complete);
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    next(err);
  }
});
// POST /api/store/:slug/orders/:id/verify-payment (Vérifier le paiement Stripe côté serveur si le webhook est en retard)
router.post("/:slug/orders/:id/verify-payment", loadBoutique, authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, boutiqueId: req.boutique.id, clientId: req.user.id },
      include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }]
    });

    if (!order) return res.status(404).json({ message: "Commande introuvable" });
    
    // Si la commande est déjà validée (ex: par le webhook), on ne fait rien.
    if (order.statut !== "en_attente_paiement") {
      return res.json({ verified: true, order });
    }

    if (!order.stripeSessionId) {
      return res.status(400).json({ message: "Pas de session Stripe associée" });
    }

    const stripeSecretKey = getStripeSecretKey(req.boutique);
    const stripe = require("stripe")(stripeSecretKey);

    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (session.payment_status === "paid") {
      let receiptUrl = null;
      try {
        if (session.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ["latest_charge"] });
          if (pi.latest_charge && pi.latest_charge.receipt_url) {
            receiptUrl = pi.latest_charge.receipt_url;
          }
        }
      } catch (e) {}

      const nextStatut = order.typeVente === "recharge_mobile" ? "recuperee" : "en_attente";
      await order.update({ 
        statut: nextStatut, 
        statutPaiement: "paye",
        receiptUrl: receiptUrl
      });

      const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
      
      if (order.typeVente === "recharge_mobile") {
        Notification.create({
          userId: order.clientId, boutiqueId: order.boutiqueId, orderId: order.id,
          title: "Recharge crédit envoyée ! 📲",
          message: `Votre paiement a été validé et la recharge #${cmdNum} est confirmée.`,
          type: "order"
        }).catch(() => {});
        Notification.create({
          userId: null, boutiqueId: order.boutiqueId, orderId: order.id,
          title: "Nouvelle Recharge Crédit Mobile",
          message: `Le paiement pour la recharge #${cmdNum} a été confirmé via Stripe.`,
          type: "order"
        }).catch(() => {});
        
        // Notification email pour l'admin
        const { envoyerNotificationAdminNouvelleCommande, envoyerConfirmationCommande } = require("../services/emailService");
        const adminEmail = req.boutique.emailContact || process.env.BREVO_SENDER_EMAIL;
        if (adminEmail) {
          const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
          envoyerNotificationAdminNouvelleCommande(adminEmail, order, req.boutique.nom, originUrl).catch((err) => console.error("⚠️ Email notification admin non envoyé (verify-payment):", err.message));
        }

        // Notification email pour le client
        if (req.user && req.user.email) {
           envoyerConfirmationCommande(req.user.email, order, req.boutique.nom).catch((err) => console.error("⚠️ Email confirmation client non envoyé:", err.message));
        }
      } else {
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
        
        // Notification email pour l'admin
        const { envoyerNotificationAdminNouvelleCommande, envoyerConfirmationCommande } = require("../services/emailService");
        const adminEmail = req.boutique.emailContact || process.env.BREVO_SENDER_EMAIL;
        const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
        if (adminEmail) {
          envoyerNotificationAdminNouvelleCommande(adminEmail, order, req.boutique.nom, originUrl).catch((err) => console.error("⚠️ Email notification admin non envoyé (verify-payment):", err.message));
        }

        // Notification email pour le client
        if (req.user && req.user.email) {
           envoyerConfirmationCommande(req.user.email, order, req.boutique.nom).catch((err) => console.error("⚠️ Email confirmation client non envoyé:", err.message));
        }
      }

      clearCachePattern("cache:/api/store").catch(() => {});
      broadcast("order_updated", { orderId: order.id, statut: nextStatut, clientId: order.clientId, boutiqueId: order.boutiqueId });
      
      return res.json({ verified: true, order });
    }

    res.json({ verified: false, order });
  } catch (err) {
    console.error("Erreur verify-payment:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH /api/store/:slug/orders/:id/switch-to-cash (Passer une commande en attente de paiement au cash)
router.patch("/:slug/orders/:id/switch-to-cash", loadBoutique, authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, boutiqueId: req.boutique.id, clientId: req.user.id }
    });

    if (!order) return res.status(404).json({ message: "Commande introuvable" });
    if (order.statut !== "en_attente_paiement") {
      return res.status(400).json({ message: "Le paiement de cette commande ne peut plus être modifié." });
    }

    await order.update({
      moyenPaiement: "cash",
      statut: "en_attente" // Repasse en attente classique
    });

    const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
    
    Notification.create({
      userId: order.clientId, boutiqueId: order.boutiqueId, orderId: order.id,
      title: "Mode de paiement modifié",
      message: `Votre commande #${cmdNum} a été modifiée en paiement à la livraison.`,
      type: "order"
    }).catch(() => {});

    Notification.create({
      userId: null, boutiqueId: order.boutiqueId, orderId: order.id,
      title: "Nouvelle commande",
      message: `La commande #${cmdNum} est passée en paiement à la livraison et attend votre confirmation.`,
      type: "order"
    }).catch(() => {});

    clearCachePattern("cache:/api/store").catch(() => {});
    broadcast("order_updated", { orderId: order.id, statut: "en_attente", clientId: order.clientId, boutiqueId: order.boutiqueId });
    
    // Si on veut envoyer l'e-mail à l'admin, on pourrait le faire ici, 
    // car il n'avait peut-être pas été averti du succès du paiement.

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/store/:slug/create-checkout-session (Redirection Stripe pour Carte & Wero)
router.post("/:slug/create-checkout-session", loadBoutique, authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "L'ID de la commande est requis." });

    const order = await Order.findOne({
      where: { id: orderId, boutiqueId: req.boutique.id, clientId: req.user.id, statut: "en_attente_paiement" },
      include: [
        { model: User, as: "client", attributes: ["email", "nom"] },
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
      ]
    });

    if (!order) return res.status(404).json({ message: "Commande introuvable ou déjà payée." });

    const userEmail = order.client?.email || req.user?.email || undefined;
    const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    if (order.moyenPaiement === "paydunya" || order.moyenPaiement === "orange" || order.moyenPaiement === "wave") {
      try {
        const paydunyaMasterKey = req.boutique.paydunyaMasterKey;
        const paydunyaPrivateKey = req.boutique.paydunyaPrivateKey;
        const paydunyaToken = req.boutique.paydunyaToken;

        if (!paydunyaMasterKey || !paydunyaPrivateKey || !paydunyaToken) {
          return res.status(400).json({ message: "Les clés PayDunya ne sont pas configurées pour cette boutique." });
        }

        const invoiceData = {
          invoice: {
            total_amount: Math.round(Number(order.total)), // Paydunya works in local currency (XOF/XAF typically, check your account settings, usually XOF)
            description: `Commande ${order.id} - ${req.boutique.nom}`
          },
          store: {
            name: req.boutique.nom,
            website_url: originUrl
          },
          actions: {
            cancel_url: `${originUrl}/confirmation/${order.id}?canceled=true`,
            return_url: `${originUrl}/confirmation/${order.id}?success=true`,
            callback_url: `${originUrl.replace('5173', '3000')}/api/store/${req.boutique.slug}/paydunya-webhook` // Optional, or point to backend URL
          }
        };

        const response = await fetch("https://app.paydunya.com/api/v1/checkout-invoice/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PAYDUNYA-MASTER-KEY": paydunyaMasterKey,
            "PAYDUNYA-PRIVATE-KEY": paydunyaPrivateKey,
            "PAYDUNYA-TOKEN": paydunyaToken
          },
          body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        
        if (data.response_code === "00") {
          // Update order with the token as session ID
          await order.update({ stripeSessionId: data.token });
          return res.json({ url: data.url });
        } else {
          return res.status(400).json({ message: "Erreur PayDunya: " + (data.response_text || "Inconnue") });
        }
      } catch (err) {
        console.error("PayDunya Error:", err);
        return res.status(500).json({ message: "Erreur lors de la création de la session PayDunya." });
      }
    }

    const stripeSecretKey = getStripeSecretKey(req.boutique);
    if (!stripeSecretKey || (!stripeSecretKey.startsWith("sk_") && !stripeSecretKey.startsWith("rk_"))) {
      return res.status(400).json({ message: "La boutique n'a pas configuré ses paiements par carte/wero." });
    }

    const stripe = require("stripe")(stripeSecretKey);

    let line_items = [];
    if (order.typeVente === "recharge_mobile") {
      line_items = [{
        price_data: {
          currency: "eur",
          product_data: { name: order.notes || "Recharge Crédit Mobile" },
          unit_amount: Math.round(Number(order.total) * 100),
        },
        quantity: 1
      }];
    } else {
      line_items = order.items.map(item => {
        const img = item.product?.imageUrl;
        const validImage = (img && typeof img === "string" && img.startsWith("http") && img.length <= 2048) ? [img] : [];
        return {
          price_data: {
            currency: "eur", // Wero / Stripe nécessite obligatoirement de l'Euro
            product_data: {
              name: item.product.nom,
              images: validImage,
            },
            unit_amount: Math.round(Number(item.prixUnitaire) * 100),
          },
          quantity: item.quantite,
        };
      });
    }

    if (Number(order.fraisLivraison) > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: Math.round(Number(order.fraisLivraison) * 100),
        },
        quantity: 1,
      });
    }

    // Paramètres Stripe Connect si un Account ID est défini
    const stripeConfig = {};
    if (req.boutique.stripeAccountId && !req.boutique.stripeSecretKey) {
      stripeConfig.stripeAccount = req.boutique.stripeAccountId;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items,
      mode: "payment",
      success_url: `${originUrl}/confirmation/${order.id}?success=true`,
      cancel_url: `${originUrl}/confirmation/${order.id}?canceled=true`,
      metadata: { boutiqueId: req.boutique.id, userId: req.user.id, orderId: order.id }
    }, stripeConfig);

    // Mettre à jour l'ID de session dans la base
    await order.update({ stripeSessionId: session.id });

    res.json({ url: session.url });
  } catch (err) { next(err); }
});

// POST /api/store/:slug/create-recharge-session (Paiement direct carte Stripe pour Recharge Crédit Mobile - Authentifié)
router.post("/:slug/create-recharge-session", loadBoutique, authenticate, async (req, res, next) => {
  try {
    const { operatorName, phone, amountEur, moyenPaiement = "carte" } = req.body;
    if (!phone || !amountEur) {
      return res.status(400).json({ message: "Numéro de téléphone et montant requis." });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith("269")) {
      return res.status(400).json({ message: "Numéro invalide. Format attendu: 7 chiffres aux Comores (ex: +2693326532)." });
    }

    const stripeSecretKey = getStripeSecretKey(req.boutique);
    if (!stripeSecretKey || (!stripeSecretKey.startsWith("sk_") && !stripeSecretKey.startsWith("rk_"))) {
      return res.status(400).json({ message: "La boutique n'a pas configuré son paiement Stripe." });
    }

    const stripe = require("stripe")(stripeSecretKey);
    const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    const order = await Order.create({
      boutiqueId: req.boutique.id,
      clientId: req.user.id,
      statut: "en_attente_paiement",
      typeVente: "recharge_mobile",
      moyenPaiement: moyenPaiement,
      total: amountEur,
      sousTotal: amountEur,
      fraisLivraison: 0,
      notes: `Recharge Crédit Mobile ${operatorName} pour le numéro +${cleanPhone}`
    });

    if (moyenPaiement === "wero" || moyenPaiement === "holam") {
      return res.json({ orderId: order.id, order });
    }

    if (moyenPaiement === "paydunya" || moyenPaiement === "orange" || moyenPaiement === "wave") {
      try {
        const paydunyaMasterKey = req.boutique.paydunyaMasterKey;
        const paydunyaPrivateKey = req.boutique.paydunyaPrivateKey;
        const paydunyaToken = req.boutique.paydunyaToken;

        if (!paydunyaMasterKey || !paydunyaPrivateKey || !paydunyaToken) {
          return res.status(400).json({ message: "Les clés PayDunya ne sont pas configurées pour cette boutique." });
        }

        const invoiceData = {
          invoice: {
            total_amount: Math.round(Number(amountEur)), // En devises de compte, ex: XOF ou EUR selon la config
            description: `Recharge Crédit Mobile ${operatorName} - ${req.boutique.nom}`
          },
          store: {
            name: req.boutique.nom,
            website_url: originUrl
          },
          actions: {
            cancel_url: `${originUrl}/recharge-mobile?status=canceled`,
            return_url: `${originUrl}/recharge-mobile?status=success&phone=${encodeURIComponent(cleanPhone.replace(/^269/, ''))}&order_id=${order.id}`,
            callback_url: `${originUrl.replace('5173', '3000')}/api/store/${req.boutique.slug}/paydunya-webhook`
          }
        };

        const response = await fetch("https://app.paydunya.com/api/v1/checkout-invoice/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PAYDUNYA-MASTER-KEY": paydunyaMasterKey,
            "PAYDUNYA-PRIVATE-KEY": paydunyaPrivateKey,
            "PAYDUNYA-TOKEN": paydunyaToken
          },
          body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        if (data.response_code === "00") {
          await order.update({ stripeSessionId: data.token });
          return res.json({ url: data.url });
        } else {
          return res.status(400).json({ message: "Erreur PayDunya: " + (data.response_text || "Inconnue") });
        }
      } catch (err) {
        console.error("PayDunya Error:", err);
        return res.status(500).json({ message: "Erreur création session PayDunya." });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: req.user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Recharge Crédit Mobile - ${operatorName || 'Comores'} (+${cleanPhone})`,
              description: `Envoi direct de crédit mobile à destination EXCLUSIVE du numéro +${cleanPhone}.`,
            },
            unit_amount: Math.round(Number(amountEur) * 100),
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${originUrl}/recharge-mobile?status=success&phone=${encodeURIComponent(cleanPhone.replace(/^269/, ''))}&order_id=${order.id}`,
      cancel_url: `${originUrl}/recharge-mobile?status=canceled`,
      metadata: { 
        boutiqueId: req.boutique.id, 
        userId: req.user ? req.user.id : null,
        type: "recharge_mobile", 
        phone: `+${cleanPhone}`, 
        operatorName,
        orderId: order.id
      }
    });

    await order.update({ stripeSessionId: session.id });

    res.json({ url: session.url });
  } catch (err) { next(err); }
});

// GET /api/store/:slug/orders/mine  (client connecté)
router.get("/:slug/orders/mine", loadBoutique, authenticate, requireRole("client"), async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { boutiqueId: req.boutique.id, clientId: req.user.id },
      include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) { next(err); }
});

// PATCH /api/store/:slug/orders/:id/cancel (client connecté — annuler commande si non livrée)
router.patch("/:slug/orders/:id/cancel", loadBoutique, authenticate, requireRole("client"), async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, clientId: req.user.id, boutiqueId: req.boutique.id },
      include: [{ model: OrderItem, as: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (["livree", "recuperee", "en_livraison", "annulee"].includes(order.statut)) {
      await t.rollback();
      return res.status(400).json({
        message: "Impossible d'annuler cette commande car elle est déjà en cours de livraison, livrée ou déjà annulée."
      });
    }

    await order.update({ statut: "annulee" }, { transaction: t });

    // Restituer le stock pour chaque article
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const prod = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
        if (prod) {
          await prod.update({
            stock: (prod.stock || 0) + item.quantite,
            ventesCount: Math.max(0, (prod.ventesCount || 0) - item.quantite)
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    if (req.user.email) {
      sendOrderStatusEmail(req.user.email, req.user.nom, order, "annulee", req.boutique.nom).catch(() => {});
    }

    clearCachePattern("cache:/api/store").catch(() => {});
    broadcast("order_updated", { orderId: order.id, statut: "annulee", clientId: req.user.id, boutiqueId: req.boutique.id });
    broadcast("product_updated", { boutiqueId: req.boutique.id });

    res.json({ message: "Votre commande a été annulée avec succès.", order });
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// --- RECHARGE PLANS ROUTES ---

// GET /api/store/:slug/recharge-plans
router.get("/:slug/recharge-plans", loadBoutique, async (req, res, next) => {
  try {
    const plans = await RechargePlan.findAll({
      where: { boutiqueId: req.boutique.id, active: true },
      order: [["orderIndex", "ASC"], ["eur", "ASC"]]
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

// GET /api/store/:slug/admin/recharge-plans
router.get("/:slug/admin/recharge-plans", loadBoutique, authenticate, requireRole("super_admin", "admin", "employe"), async (req, res, next) => {
  try {
    const plans = await RechargePlan.findAll({
      where: { boutiqueId: req.boutique.id },
      order: [["orderIndex", "ASC"], ["eur", "ASC"]]
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

// POST /api/store/:slug/admin/recharge-plans
router.post("/:slug/admin/recharge-plans", loadBoutique, authenticate, requireRole("super_admin", "admin", "employe"), async (req, res, next) => {
  try {
    const plan = await RechargePlan.create({
      ...req.body,
      boutiqueId: req.boutique.id
    });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

// PUT /api/store/:slug/admin/recharge-plans/:id
router.put("/:slug/admin/recharge-plans/:id", loadBoutique, authenticate, requireRole("super_admin", "admin", "employe"), async (req, res, next) => {
  try {
    const plan = await RechargePlan.findOne({ where: { id: req.params.id, boutiqueId: req.boutique.id } });
    if (!plan) return res.status(404).json({ message: "Plan non trouvé" });
    await plan.update(req.body);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/store/:slug/admin/recharge-plans/:id
router.delete("/:slug/admin/recharge-plans/:id", loadBoutique, authenticate, requireRole("super_admin", "admin", "employe"), async (req, res, next) => {
  try {
    const plan = await RechargePlan.findOne({ where: { id: req.params.id, boutiqueId: req.boutique.id } });
    if (!plan) return res.status(404).json({ message: "Plan non trouvé" });
    await plan.destroy();
    res.json({ message: "Plan supprimé" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
