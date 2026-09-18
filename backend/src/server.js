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
const path = require("path");
const runSeed = require("./seed");

const compression = require("compression");
const rateLimit = require("express-rate-limit");

const app = express();

// Trust reverse proxy headers on Render/Vercel for express-rate-limit
app.set("trust proxy", 1);

// High Performance Compression (GZIP/Brotli)
app.use(compression());

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

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

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

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

  await sequelize.sync(); // crée les tables si elles n'existent pas (compatibilité TiDB Cloud)
  await runSeed();        // insère les données de démonstration et utilisateurs si la base est vide

  app.listen(PORT, () => console.log(`API Boutique SaaS démarrée sur le port ${PORT}`));
}

start();
