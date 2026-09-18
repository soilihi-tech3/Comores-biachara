const express = require("express");
const { Op } = require("sequelize");
const { sequelize, Product, Category, Order, OrderItem, Review, User, Notification, Famille } = require("../models");
const { authenticate, requireRole, loadBoutique } = require("../middleware/auth");
const { cacheMiddleware } = require("../config/cache");

const router = express.Router({ mergeParams: true });

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
    emailContact: b.emailContact,
    aProposText: b.aProposText
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

    if (req.query.famille) {
      const fam = req.query.famille.trim();
      where[Op.or] = [
        { famille: { [Op.like]: `%${fam}%` } },
        { '$Category.famille$': { [Op.like]: `%${fam}%` } }
      ];
    }

    if (req.query.search) {
      const q = `%${req.query.search.trim()}%`;
      const searchConditions = [
        { nom: { [Op.like]: q } },
        { famille: { [Op.like]: q } },
        { '$Category.nom$': { [Op.like]: q } },
        { '$Category.famille$': { [Op.like]: q } }
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

    res.status(201).json(complete);
  } catch (err) {
    await t.rollback();
    next(err);
  }
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

module.exports = router;
