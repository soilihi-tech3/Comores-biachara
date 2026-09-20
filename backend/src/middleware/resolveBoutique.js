const { Boutique } = require('../models');
const { Op } = require('sequelize');

const MAIN_DOMAINS = ['easymarket.com', 'www.easymarket.com', 'localhost', '127.0.0.1'];

/**
 * Middleware de résolution de boutique multi-tenant (Custom Domain, Subdomain, Header, or Fallback)
 */
async function resolveBoutique(req, res, next) {
  try {
    const customHeaderDomain = req.headers['x-boutique-domain'] 
      ? req.headers['x-boutique-domain'].split(':')[0].toLowerCase() 
      : null;

    const rawHost = req.headers['x-forwarded-host'] || req.hostname || 'localhost';
    const hostname = rawHost.split(':')[0].toLowerCase();

    req.boutiqueSlug = req.headers['x-boutique-slug'] || req.headers['x-slug'] || req.query.slug || null;
    req.boutique = null;

    // Domaines à tester (avec et sans www)
    const domainsToTest = [];
    if (customHeaderDomain) {
      domainsToTest.push(customHeaderDomain);
      if (customHeaderDomain.startsWith('www.')) domainsToTest.push(customHeaderDomain.replace(/^www\./, ''));
      else domainsToTest.push(`www.${customHeaderDomain}`);
    }
    domainsToTest.push(hostname);
    if (hostname.startsWith('www.')) domainsToTest.push(hostname.replace(/^www\./, ''));
    else domainsToTest.push(`www.${hostname}`);

    // 1. Recherche prioritaire par Domaine Personnalisé (ex: comoresbiachara.site, abdou.com)
    let boutique = await Boutique.findOne({
      where: {
        customDomain: { [Op.in]: domainsToTest }
      }
    });

    // 2. Sinon, vérifier par slug depuis le sous-domaine ou le header
    if (!boutique) {
      if (!req.boutiqueSlug && !MAIN_DOMAINS.includes(hostname) && !hostname.endsWith('.onrender.com') && !hostname.endsWith('.vercel.app')) {
        const parts = hostname.split('.');
        if (parts.length >= 3 && !['www', 'app', 'api', 'admin'].includes(parts[0])) {
          req.boutiqueSlug = parts[0].toLowerCase();
        }
      }

      if (req.boutiqueSlug) {
        boutique = await Boutique.findOne({ where: { slug: req.boutiqueSlug } });
      }
    }

    // 3. Fallback sur la première boutique par défaut si aucune résolution spécifique
    if (!boutique) {
      boutique = await Boutique.findOne({ order: [['createdAt', 'ASC']] });
    }

    if (boutique) {
      req.boutique = boutique;
      req.boutiqueSlug = boutique.slug;
      res.locals.boutique = boutique;
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = resolveBoutique;
