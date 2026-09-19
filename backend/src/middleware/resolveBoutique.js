const { Boutique } = require('../models');

const MAIN_DOMAINS = ['mondomaine.com', 'www.mondomaine.com', 'localhost', '127.0.0.1'];

/**
 * Middleware de résolution de boutique multi-tenant (subdomain, header, or default)
 */
async function resolveBoutique(req, res, next) {
  try {
    const hostname = req.hostname ? req.hostname.split(':')[0] : 'localhost';
    req.boutiqueSlug = req.headers['x-boutique-slug'] || req.headers['x-slug'] || null;
    req.boutique = null;

    if (!req.boutiqueSlug && !MAIN_DOMAINS.includes(hostname)) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        req.boutiqueSlug = parts[0].toLowerCase();
      }
    }

    if (!req.boutiqueSlug) {
      req.boutiqueSlug = 'biachara'; // default slug
    }

    let boutique = await Boutique.findOne({ where: { slug: req.boutiqueSlug } });
    if (!boutique) {
      boutique = await Boutique.findOne({ order: [['createdAt', 'ASC']] });
    }

    if (boutique) {
      req.boutique = boutique;
      res.locals.boutique = boutique;
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = resolveBoutique;
