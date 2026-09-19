const express = require("express");
const { Op } = require("sequelize");
const { sequelize, Product, Category, Order, OrderItem, Review, User, Notification, Famille } = require("../models");
const { authenticate, requireRole, loadBoutique } = require("../middleware/auth");
const { cacheMiddleware, clearCachePattern } = require("../config/cache");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../services/email.service");
const { broadcast, addClient, removeClient } = require("../utils/broadcaster");

const router = express.Router({ mergeParams: true });

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

// POST /api/store/:slug/products/:id/reviews  (client connecté)
router.post("/:slug/products/:id/reviews", loadBoutique, authenticate, requireRole("client"), async (req, res, next) => {
  try {
    const { note, commentaire } = req.body;
    if (!note || note < 1 || note > 5) return res.status(400).json({ message: "La note doit être comprise entre 1 et 5." });

    const product = await Product.findOne({ where: { id: req.params.id, boutiqueId: req.boutique.id } });
    if (!product) return res.status(404).json({ message: "Produit introuvable." });

    const review = await Review.create({ productId: product.id, userId: req.user.id, note, commentaire });
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

    const order = await Order.create({
      boutiqueId: req.boutique.id, clientId: req.user.id, statut: "en_attente",
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
    Notification.create({
      userId: req.user.id, boutiqueId: req.boutique.id, orderId: order.id,
      title: "Commande enregistrée",
      message: `Votre commande #${cmdNum} (${sousTotal + fraisLivraison} F CFA) a été enregistrée avec succès.`,
      type: "order"
    }).catch(() => {});

    Notification.create({
      userId: null, boutiqueId: req.boutique.id, orderId: order.id,
      title: "Nouvelle commande reçue !",
      message: `Nouvelle commande #${cmdNum} reçue de ${req.user.nom} (${sousTotal + fraisLivraison} F CFA).`,
      type: "order"
    }).catch(() => {});

    const { envoyerNotificationAdminNouvelleCommande, envoyerConfirmationCommande } = require("../services/emailService");
    const originUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    // Notification e-mail transactionnelle au client
    if (req.user.email) {
      envoyerConfirmationCommande(req.user.email, complete, req.boutique.nom).catch((err) => console.error("⚠️ Email confirmation client non envoyé:", err.message));
    }

    // Notification e-mail transactionnelle à l'administrateur de la boutique
    const adminEmail = req.boutique.emailContact || process.env.BREVO_SENDER_EMAIL;
    if (adminEmail) {
      envoyerNotificationAdminNouvelleCommande(adminEmail, complete, req.boutique.nom, originUrl).catch((err) => console.error("⚠️ Email notification admin non envoyé:", err.message));
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

// POST /api/store/:slug/create-payment-intent (Création d'un paiement Stripe par carte)
router.post("/:slug/create-payment-intent", loadBoutique, authenticate, async (req, res, next) => {
  try {
    const { amount, currency = "eur" } = req.body;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      // Fallback mode démonstration / test local
      return res.json({
        clientSecret: "pi_demo_secret_" + Math.random().toString(36).substring(2),
        isDemo: true,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_demo"
      });
    }

    const stripe = require("stripe")(stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // Stripe attend des centimes
      currency: currency.toLowerCase(),
      metadata: { boutiqueId: req.boutique.id, userId: req.user.id }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      isDemo: false,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
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

module.exports = router;
