const express = require("express");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Boutique, User, Order } = require("../models");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireRole("super_admin"));

// GET /api/superadmin/boutiques
router.get("/boutiques", async (req, res, next) => {
  try {
    const boutiques = await Boutique.findAll({ order: [["createdAt", "DESC"]] });
    const withStats = await Promise.all(boutiques.map(async (b) => {
      const orders = await Order.findAll({ where: { boutiqueId: b.id, statut: { [Op.ne]: "annulee" } } });
      const ca = orders.reduce((s, o) => s + Number(o.total), 0);
      return { ...b.toJSON(), chiffreAffaires: ca, nbVentes: orders.length };
    }));
    res.json(withStats);
  } catch (err) { next(err); }
});

// POST /api/superadmin/boutiques -> crée une boutique + son compte Admin
router.post("/boutiques", async (req, res, next) => {
  try {
    const { nomBoutique, slug, formuleAbonnement, nomAdmin, emailAdmin, motDePasseAdmin } = req.body;
    const existant = await Boutique.findOne({ where: { slug } });
    if (existant) return res.status(409).json({ message: "Ce slug de boutique est déjà utilisé." });

    const boutique = await Boutique.create({ nom: nomBoutique, slug, formuleAbonnement });
    const motDePasseHash = await bcrypt.hash(motDePasseAdmin || "changeme123", 10);
    const admin = await User.create({
      nom: nomAdmin, email: emailAdmin, motDePasseHash, role: "admin", boutiqueId: boutique.id,
    });
    res.status(201).json({ boutique, admin: { id: admin.id, nom: admin.nom, email: admin.email } });
  } catch (err) { next(err); }
});

// PATCH /api/superadmin/boutiques/:id/statut  (active <-> suspendue)
router.patch("/boutiques/:id/statut", async (req, res, next) => {
  try {
    const boutique = await Boutique.findByPk(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique introuvable." });
    await boutique.update({ statut: req.body.statut });
    res.json(boutique);
  } catch (err) { next(err); }
});

// PUT /api/superadmin/boutiques/:id -> Modifier nom boutique, slug, formule, et mot de passe admin
router.put("/boutiques/:id", async (req, res, next) => {
  try {
    const boutique = await Boutique.findByPk(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique introuvable." });
    
    const { nom, slug, formuleAbonnement, motDePasseAdmin, modulesActifs } = req.body;
    
    if (nom) boutique.nom = nom;
    if (slug && slug !== boutique.slug) {
      const existant = await Boutique.findOne({ where: { slug, id: { [Op.ne]: boutique.id } } });
      if (existant) return res.status(409).json({ message: "Ce slug de boutique est déjà utilisé." });
      boutique.slug = slug;
    }
    if (formuleAbonnement) boutique.formuleAbonnement = formuleAbonnement;
    if (modulesActifs) boutique.modulesActifs = modulesActifs;
    await boutique.save();

    // Mettre à jour le mot de passe admin si fourni
    if (motDePasseAdmin && motDePasseAdmin.trim()) {
      const adminUser = await User.findOne({ where: { boutiqueId: boutique.id, role: "admin" } });
      if (adminUser) {
        adminUser.motDePasseHash = await bcrypt.hash(motDePasseAdmin.trim(), 10);
        await adminUser.save();
      }
    }

    res.json({ message: "Boutique mise à jour avec succès", boutique });
  } catch (err) { next(err); }
});

// PUT /api/superadmin/boutiques/:id/modules -> Activer / Désactiver des modules pour une boutique
router.put("/boutiques/:id/modules", async (req, res, next) => {
  try {
    const boutique = await Boutique.findByPk(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique introuvable." });
    const { modulesActifs } = req.body;
    if (modulesActifs) {
      boutique.modulesActifs = modulesActifs;
      await boutique.save();
    }
    res.json({ message: "Modules de la boutique mis à jour avec succès", boutique });
  } catch (err) { next(err); }
});

// DELETE /api/superadmin/boutiques/:id -> Supprimer la boutique et ses utilisateurs
router.delete("/boutiques/:id", async (req, res, next) => {
  try {
    const boutique = await Boutique.findByPk(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique introuvable." });
    
    await User.destroy({ where: { boutiqueId: boutique.id } });
    await boutique.destroy();
    res.json({ message: "Boutique supprimée." });
  } catch (err) { next(err); }
});

// GET /api/superadmin/stats -> vue globale plateforme
router.get("/stats", async (req, res, next) => {
  try {
    const boutiques = await Boutique.findAll();
    const orders = await Order.findAll({ where: { statut: { [Op.ne]: "annulee" } } });
    const chiffreAffairesCumule = orders.reduce((s, o) => s + Number(o.total), 0);
    res.json({
      nbBoutiques: boutiques.length,
      nbBoutiquesActives: boutiques.filter((b) => b.statut === "active").length,
      chiffreAffairesCumule,
      nbVentesCumulees: orders.length,
    });
  } catch (err) { next(err); }
});

module.exports = router;
