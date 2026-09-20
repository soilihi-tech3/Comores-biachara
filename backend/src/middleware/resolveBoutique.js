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

    // 2. Sinon, vérifier par slug depuis le sous-domaine, le header ou la première partie du domaine
    if (!boutique) {
      const potentialSlugs = [];
      if (req.boutiqueSlug) potentialSlugs.push(req.boutiqueSlug);
      
      for (const d of domainsToTest) {
        const firstPart = d.split('.')[0];
        if (firstPart && !['www', 'app', 'api', 'admin', 'localhost', '127'].includes(firstPart)) {
          potentialSlugs.push(firstPart);
        }
      }

      if (potentialSlugs.length > 0) {
        boutique = await Boutique.findOne({
          where: {
            slug: { [Op.in]: potentialSlugs }
          }
        });
      }
    }

    // 3. Fallback sur la première boutique active par défaut si aucune résolution spécifique
    if (!boutique) {
      boutique = await Boutique.findOne({ where: { statut: 'active' }, order: [['id', 'ASC']] });
    }

    if (!boutique) {
      boutique = await Boutique.findOne({ order: [['id', 'ASC']] });
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
