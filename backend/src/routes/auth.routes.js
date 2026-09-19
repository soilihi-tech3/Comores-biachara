const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const { sendOtpEmail } = require("../services/email.service");

function publicUser(user) {
  return {
    id: user.id, nom: user.nom, email: user.email, telephone: user.telephone,
    adresse: user.adresse, role: user.role, boutiqueId: user.boutiqueId, permissions: user.permissions,
    isEmailVerified: user.isEmailVerified,
  };
}

// Inscription client avec génération OTP à 6 chiffres
router.post("/register", async (req, res, next) => {
  try {
    const { nom, email, telephone, motDePasse } = req.body;
    const cleanNom = nom ? String(nom).trim() : "";
    const cleanPhone = telephone ? String(telephone).trim() : "";
    const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;

    if (!cleanNom || !cleanPhone || !motDePasse) {
      return res.status(400).json({ message: "Le nom, le numéro de téléphone et le mot de passe sont requis." });
    }

    const { Op } = require("sequelize");
    const whereCond = [{ telephone: cleanPhone }];
    if (cleanEmail) whereCond.push({ email: cleanEmail });

    const existUser = await User.findOne({ where: { [Op.or]: whereCond } });

    if (existUser) {
      if (existUser.isEmailVerified) {
        return res.status(409).json({ message: "Un compte vérifié existe déjà avec ce numéro de téléphone ou cet e-mail." });
      }
      // Compte existant non vérifié : on régénère le code OTP et met à jour les données
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const motDePasseHash = await bcrypt.hash(motDePasse, 10);

      existUser.nom = cleanNom;
      existUser.email = cleanEmail;
      existUser.telephone = cleanPhone;
      existUser.motDePasseHash = motDePasseHash;
      existUser.otpCode = otpCode;
      existUser.otpExpiresAt = otpExpiresAt;
      await existUser.save();

      if (cleanEmail) {
        sendOtpEmail(cleanEmail, cleanNom, otpCode).catch(() => {});
      }

      return res.status(200).json({
        requireOtp: true,
        email: existUser.email,
        telephone: existUser.telephone,
        message: "Code de vérification à 6 chiffres renvoyé pour valider votre compte."
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    const user = await User.create({
      nom: cleanNom,
      email: cleanEmail,
      telephone: cleanPhone,
      motDePasseHash,
      role: "client",
      otpCode,
      otpExpiresAt,
      isEmailVerified: false
    });

    if (cleanEmail) {
      sendOtpEmail(cleanEmail, cleanNom, otpCode).catch(() => {});
    }

    res.status(201).json({
      requireOtp: true,
      email: user.email,
      telephone: user.telephone,
      message: "Compte créé ! Un code de vérification à 6 chiffres a été envoyé."
    });
  } catch (err) { next(err); }
});

// Vérification du code OTP à 6 chiffres
router.post("/verify-otp", async (req, res, next) => {
  try {
    const { email, telephone, otpCode } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = telephone ? String(telephone).trim() : null;
    const cleanOtp = otpCode ? String(otpCode).trim() : null;

    if (!cleanOtp) {
      return res.status(400).json({ message: "Veuillez saisir le code OTP à 6 chiffres." });
    }

    const { Op } = require("sequelize");
    const whereConditions = [];
    if (cleanEmail) whereConditions.push({ email: cleanEmail });
    if (cleanPhone) whereConditions.push({ telephone: cleanPhone });

    if (whereConditions.length === 0) {
      return res.status(400).json({ message: "Aucun identifiant fourni pour la vérification." });
    }

    const user = await User.findOne({ where: { [Op.or]: whereConditions } });
    if (!user) {
      return res.status(404).json({ message: "Compte introuvable." });
    }

    if (user.otpCode !== cleanOtp) {
      return res.status(400).json({ message: "Code OTP incorrect. Veuillez réessayer." });
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) {
      return res.status(400).json({ message: "Le code OTP a expiré. Veuillez demander un nouveau code." });
    }

    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = signToken({ id: user.id, role: user.role });
    res.json({ message: "Vérification réussie ! Vous êtes connecté.", token, user: publicUser(user) });
  } catch (err) { next(err); }
});

// Renvoi du code OTP par email / notification
router.post("/resend-otp", async (req, res, next) => {
  try {
    const { email, telephone } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = telephone ? String(telephone).trim() : null;

    const { Op } = require("sequelize");
    const whereConditions = [];
    if (cleanEmail) whereConditions.push({ email: cleanEmail });
    if (cleanPhone) whereConditions.push({ telephone: cleanPhone });

    if (whereConditions.length === 0) {
      return res.status(400).json({ message: "Identifiant requis." });
    }

    const user = await User.findOne({ where: { [Op.or]: whereConditions } });
    if (!user) return res.status(404).json({ message: "Compte introuvable." });

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = newOtp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (user.email) {
      sendOtpEmail(user.email, user.nom, newOtp).catch(() => {});
    }

    res.json({ message: "Un nouveau code OTP a été envoyé à votre e-mail." });
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
