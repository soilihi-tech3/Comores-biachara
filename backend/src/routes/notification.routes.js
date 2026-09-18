const express = require("express");
const { Op } = require("sequelize");
const { Notification } = require("../models");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/notifications -> Liste des notifications de l'utilisateur connecté
router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === "client") {
      where.userId = req.user.id;
    } else if (req.user.role === "admin" || req.user.role === "employe") {
      where[Op.or] = [
        { userId: req.user.id },
        { boutiqueId: req.user.boutiqueId, userId: null }
      ];
    } else if (req.user.role === "super_admin") {
      where.userId = req.user.id;
    }

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 30
    });
    res.json(notifications);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read -> Marquer comme lue
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification introuvable." });
    await notif.update({ lu: true });
    res.json(notif);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all -> Tout marquer comme lu
router.patch("/read-all", async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === "client") where.userId = req.user.id;
    else if (req.user.boutiqueId) where[Op.or] = [{ userId: req.user.id }, { boutiqueId: req.user.boutiqueId, userId: null }];
    await Notification.update({ lu: true }, { where });
    res.json({ message: "Toutes les notifications marquées comme lues." });
  } catch (err) { next(err); }
});

module.exports = router;
