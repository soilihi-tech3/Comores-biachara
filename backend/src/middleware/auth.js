const { verifyToken } = require("../utils/jwt");
const { User, Boutique } = require("../models");

/** Vérifie le token JWT et attache req.user */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentification requise." });

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id);
    if (!user || user.statut === "suspendu") {
      return res.status(401).json({ message: "Compte invalide ou suspendu." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

/** Autorise uniquement certains rôles */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

/** Vérifie que la boutique existe via le slug de l'URL et l'attache à req.boutique */
async function loadBoutique(req, res, next) {
  try {
    let boutique = await Boutique.findOne({ where: { slug: req.params.slug } });
    if (!boutique) {
      // Fallback sur la première boutique active si le slug a été modifié
      boutique = await Boutique.findOne({ where: { statut: "active" } });
    }
    if (!boutique) {
      boutique = await Boutique.findOne();
    }
    if (!boutique) return res.status(404).json({ message: "Aucune boutique disponible." });
    if (boutique.statut === "suspendue") {
      return res.status(403).json({ message: "Cette boutique est actuellement suspendue." });
    }
    req.boutique = boutique;
    next();
  } catch (err) {
    next(err);
  }
}

/** Pour les routes admin : s'assure que l'admin/employé agit uniquement sur SA boutique */
function requireOwnBoutique(req, res, next) {
  if (!req.user.boutiqueId) {
    return res.status(403).json({ message: "Ce compte n'est rattaché à aucune boutique." });
  }
  req.boutiqueId = req.user.boutiqueId;
  next();
}

module.exports = { authenticate, requireRole, loadBoutique, requireOwnBoutique };
