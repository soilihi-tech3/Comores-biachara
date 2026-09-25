const { Boutique } = require('../models');
const { Op } = require('sequelize');

const MAIN_DOMAINS = ['easymarket.com', 'www.easymarket.com', 'localhost', '127.0.0.1', 'comores-biachara.onrender.com'];

/**
 * Middleware de résolution de boutique multi-tenant (Custom Domain, Subdomain, Header, or Fallback)
 */
async function resolveBoutique(req, res, next) {
  try {
    const customHeaderDomain = req.headers['x-boutique-domain'] 
      ? req.headers['x-boutique-domain'].split(':')[0].toLowerCase().trim()
      : null;

    const rawHost = req.headers['x-forwarded-host'] || req.hostname || 'localhost';
    const hostname = rawHost.split(':')[0].toLowerCase().trim();

    req.boutiqueSlug = req.headers['x-boutique-slug'] || req.headers['x-slug'] || req.query.slug || null;
    req.boutique = null;
    req.isCustomDomainResolved = false;

    // Domaines nettoyés à tester (ex: comoresbiachara.site, www.comoresbiachara.site)
    const rawDomains = [customHeaderDomain, hostname].filter(Boolean);
    const cleanedDomains = Array.from(new Set(
      rawDomains.flatMap(d => {
        const clean = d.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').toLowerCase();
        return [clean, `www.${clean}`, `http://${clean}`, `https://${clean}`, `http://www.${clean}`, `https://www.${clean}`];
      })
    ));

    // Ne cherche par domaine personnalisé que si le domaine n'est pas un domaine principal de la plateforme
    const isMainPlatformDomain = rawDomains.some(d => MAIN_DOMAINS.some(m => d.includes(m)));

    let boutique = null;

    // 1. Recherche prioritaire par Domaine Personnalisé
    if (!isMainPlatformDomain) {
      boutique = await Boutique.findOne({
        where: {
          [Op.or]: [
            { customDomain: { [Op.in]: cleanedDomains } },
            ...cleanedDomains.map(d => ({ customDomain: { [Op.like]: `%${d}%` } }))
          ]
        }
      });
      if (boutique) {
        req.isCustomDomainResolved = true;
      }
    }

    // 2. Sinon, rechercher par slug dans l'en-tête ou le sous-domaine
    if (!boutique) {
      const potentialSlugs = [];
      if (req.boutiqueSlug) potentialSlugs.push(req.boutiqueSlug);
      
      for (const d of cleanedDomains) {
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
