const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id, nom: user.nom, email: user.email, telephone: user.telephone,
    adresse: user.adresse, role: user.role, boutiqueId: user.boutiqueId, permissions: user.permissions,
  };
}

// Inscription client (public)
router.post("/register", async (req, res, next) => {
  try {
    const { nom, email, telephone, motDePasse } = req.body;
    const cleanNom = nom ? String(nom).trim() : "";
    const cleanPhone = telephone ? String(telephone).trim() : "";
    const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;

    if (!cleanNom || !cleanPhone || !motDePasse) {
      return res.status(400).json({ message: "Le nom, le numéro de téléphone et le mot de passe sont requis." });
    }

    const existPhone = await User.findOne({ where: { telephone: cleanPhone } });
    if (existPhone) {
      return res.status(409).json({ message: "Un compte existe déjà avec ce numéro de téléphone." });
    }

    if (cleanEmail) {
      const existEmail = await User.findOne({ where: { email: cleanEmail } });
      if (existEmail) {
        return res.status(409).json({ message: "Un compte existe déjà avec cet e-mail." });
      }
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 10);
    const user = await User.create({
      nom: cleanNom,
      email: cleanEmail,
      telephone: cleanPhone,
      motDePasseHash,
      role: "client"
    });

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
});

// Connexion (par téléphone ou e-mail + mot de passe)
router.post("/login", async (req, res, next) => {
  try {
    const { identifiant, email, telephone, motDePasse } = req.body;
    const inputVal = (identifiant || email || telephone || "").trim();

    if (!inputVal || !motDePasse) {
      return res.status(400).json({ message: "Veuillez saisir votre numéro de téléphone ou email et votre mot de passe." });
    }

    const { Op } = require("sequelize");
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { telephone: inputVal },
          { email: inputVal.toLowerCase() }
        ]
      }
    });

    if (!user) return res.status(401).json({ message: "Identifiants ou mot de passe incorrects." });

    const ok = await bcrypt.compare(motDePasse, user.motDePasseHash);
    if (!ok) return res.status(401).json({ message: "Identifiants ou mot de passe incorrects." });
    if (user.statut === "suspendu") return res.status(403).json({ message: "Compte suspendu." });

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Mettre à jour son profil (nom, téléphone, adresse, mot de passe)
router.put("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { nom, telephone, adresse, nouveauMotDePasse, ancienMotDePasse } = req.body;

    if (nom) user.nom = nom;
    if (telephone !== undefined) user.telephone = telephone;
    if (adresse !== undefined) user.adresse = adresse;

    if (nouveauMotDePasse && nouveauMotDePasse.trim()) {
      if (ancienMotDePasse) {
        const ok = await bcrypt.compare(ancienMotDePasse, user.motDePasseHash);
        if (!ok) return res.status(400).json({ message: "L'ancien mot de passe est incorrect." });
      }
      user.motDePasseHash = await bcrypt.hash(nouveauMotDePasse.trim(), 10);
    }

    await user.save();
    res.json({ message: "Profil mis à jour avec succès", user: publicUser(user) });
  } catch (err) { next(err); }
});

module.exports = router;
