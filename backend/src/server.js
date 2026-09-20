require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const sequelize = require("./config/database");
require("./models"); // charge les modèles + associations

const authRoutes = require("./routes/auth.routes");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
const superadminRoutes = require("./routes/superadmin.routes");
const notificationRoutes = require("./routes/notification.routes");
const uploadRoutes = require("./routes/upload.routes");
const iconsRoutes = require("./routes/icons.routes");
const resolveBoutique = require("./middleware/resolveBoutique");
const path = require("path");
const runSeed = require("./seed");

const compression = require("compression");
const rateLimit = require("express-rate-limit");

const app = express();

// Trust reverse proxy headers on Render/Vercel for express-rate-limit
app.set("trust proxy", 1);

// High Performance Compression (GZIP/Brotli)
app.use(compression());

// CORS Configuration supporting custom domains (comoresbiachara.site, vercel.app, etc.)
const defaultAllowedOrigins = [
  "https://comoresbiachara.site",
  "https://www.comoresbiachara.site",
  "https://comores-biachara.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4000"
];

const envOrigins = (process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (
      origin.endsWith(".comoresbiachara.site") ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

    // Allow requests from all origins to prevent breaking custom tenant domains
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-boutique-slug",
    "x-slug",
    "x-boutique-domain"
  ]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(resolveBoutique);
app.use(iconsRoutes);

// Rate limiter for high traffic protection (1000 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes. Veuillez réessayer plus tard." }
});
app.use("/api/", apiLimiter);

// Serve uploaded images with ultra-fast static caching headers (1 year max-age)
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath, {
  maxAge: "1y",
  etag: true,
  setHeaders: (res, path) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
}));

// Root Endpoint Health Check
app.get("/", (req, res) => res.json({ message: "API Boutique SaaS Comores Biachara en ligne.", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Public current boutique resolver endpoint (subdomain / header multi-tenant)
app.get("/api/boutique/current", (req, res) => {
  if (!req.boutique) {
    return res.status(404).json({ message: "Boutique introuvable pour ce sous-domaine." });
  }
  const b = req.boutique.toJSON ? req.boutique.toJSON() : req.boutique;
  return res.json({
    id: b.id,
    nom: b.nom,
    slug: b.slug,
    logoUrl: b.logoUrl,
    couleurPrincipale: b.couleurPrincipale,
    formuleAbonnement: b.formuleAbonnement,
    statut: b.statut,
    fraisLivraison: b.fraisLivraison,
    zonesLivraison: b.zonesLivraison,
    telephone: b.telephone,
    telephone2: b.telephone2,
    adresse: b.adresse,
    adresse2: b.adresse2,
    adresseRetrait: b.adresseRetrait,
    emailContact: b.emailContact,
    aProposText: b.aProposText,
    horairesOuverture: b.horairesOuverture,
    facebookUrl: b.facebookUrl,
    instagramUrl: b.instagramUrl,
    tiktokUrl: b.tiktokUrl,
    whatsappNumber: b.whatsappNumber,
    bannerSlides: b.bannerSlides,
    sideBanners: b.sideBanners,
    modulesActifs: b.modulesActifs,
    modesPaiement: b.modesPaiement,
    stripeAccountId: b.stripeAccountId || null,
    stripeOnboardingComplete: b.stripeOnboardingComplete || false,
  });
});

// Dynamic PWA Manifest Route fetching custom Boutique Name & Logo directly from DB
app.get(["/manifest.json", "/api/manifest.json"], async (req, res) => {
  try {
    const { Boutique } = require("./models");
    const boutique = await Boutique.findOne({ order: [["createdAt", "ASC"]] });
    const name = boutique?.nom || "Boutique SaaS";
    const logo = boutique?.logoUrl || "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=512&h=512&q=80";

    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.json({
      short_name: name,
      name: name,
      icons: [
        { src: logo, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: logo, sizes: "512x512", type: "image/png", purpose: "any maskable" }
      ],
      start_url: "/",
      background_color: "#163424",
      theme_color: "#163424",
      display: "standalone",
      orientation: "portrait-primary",
      description: `Application officielle de ${name}.`
    });
  } catch (err) {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.json({
      short_name: "Boutique",
      name: "Boutique",
      start_url: "/",
      display: "standalone"
    });
  }
});

// Fallback Middleware: If frontend requests /store, /auth, /admin without /api prefix, auto-rewrite to /api
app.use((req, res, next) => {
  if (req.url === "/manifest.json" || req.url === "/api/manifest.json") return next();
  if (!req.url.startsWith("/api") && !req.url.startsWith("/uploads") && req.url !== "/") {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/admin", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// Gestion d'erreurs centralisée
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Erreur serveur interne." });
});

const PORT = process.env.PORT || 4000;

async function ensureColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableBoutiques = await queryInterface.describeTable("boutiques");

    const columnsToAddBoutique = [
      { name: "adresse_retrait", type: 'TEXT' },
      { name: "horaires_ouverture", type: 'VARCHAR(255) DEFAULT "Tous les jours de 08h30 à 23h00"' },
      { name: "facebook_url", type: 'VARCHAR(255) DEFAULT ""' },
      { name: "instagram_url", type: 'VARCHAR(255) DEFAULT ""' },
      { name: "tiktok_url", type: 'VARCHAR(255) DEFAULT ""' },
      { name: "whatsapp_number", type: 'VARCHAR(50) DEFAULT ""' },
      { name: "modules_actifs", type: 'JSON' },
      { name: "modes_paiement", type: 'JSON' }
    ];

    for (const col of columnsToAddBoutique) {
      if (!tableBoutiques[col.name]) {
        console.log("[MIGRATION] Ajout colonne manquante sur boutiques:", col.name);
        await sequelize.query(`ALTER TABLE boutiques ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    const tableProducts = await queryInterface.describeTable("products");
    if (!tableProducts["is_nouveau"]) {
      console.log("[MIGRATION] Ajout colonne is_nouveau sur products");
      await sequelize.query(`ALTER TABLE products ADD COLUMN is_nouveau TINYINT(1) DEFAULT 0;`);
    }

    const tableUsers = await queryInterface.describeTable("users");
    const columnsToAddUser = [
      { name: "otp_code", type: "VARCHAR(255) NULL" },
      { name: "otp_expires_at", type: "DATETIME NULL" },
      { name: "is_email_verified", type: "TINYINT(1) DEFAULT 0" }
    ];

    for (const col of columnsToAddUser) {
      if (!tableUsers[col.name]) {
        console.log("[MIGRATION] Ajout colonne manquante sur users:", col.name);
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    // Upgrade image columns and enum columns to flexible types to avoid "Data Truncated" errors
    const alterQueries = [
      "ALTER TABLE products MODIFY COLUMN image_url LONGTEXT NULL;",
      "ALTER TABLE products MODIFY COLUMN image_url2 LONGTEXT NULL;",
      "ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT NULL;",
      "ALTER TABLE boutiques MODIFY COLUMN logo_url LONGTEXT NULL;",
      "ALTER TABLE boutiques MODIFY COLUMN banner_slides LONGTEXT NULL;",
      "ALTER TABLE boutiques MODIFY COLUMN side_banners LONGTEXT NULL;",
      "ALTER TABLE boutiques MODIFY COLUMN formule_abonnement VARCHAR(50) DEFAULT 'standard';"
    ];

    for (const q of alterQueries) {
      await sequelize.query(q).catch(() => {});
    }
  } catch (err) {
    console.warn("[MIGRATION WARNING]:", err.message);
  }
}

async function start() {
  let connected = false;
  for (let i = 0; i < 15 && !connected; i++) {
    try {
      await sequelize.authenticate();
      connected = true;
    } catch (err) {
      console.log("En attente de la base de données MySQL...", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!connected) {
    console.error("Impossible de se connecter à MySQL après plusieurs tentatives.");
    process.exit(1);
  }

  await ensureColumns();
  await sequelize.sync(); // crée les tables si elles n'existent pas (compatibilité TiDB Cloud)
  await runSeed();        // insère les données de démonstration et utilisateurs si la base est vide

  app.listen(PORT, () => console.log(`API Boutique SaaS démarrée sur le port ${PORT}`));
}

start();
