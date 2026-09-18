const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Boutique = sequelize.define("Boutique", {
  nom: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  logoUrl: { type: DataTypes.STRING(255) },
  couleurPrincipale: { type: DataTypes.STRING(20), defaultValue: "#1F4D3A" },
  formuleAbonnement: {
    type: DataTypes.ENUM("essai_gratuit", "forfait_mensuel", "commission"),
    defaultValue: "essai_gratuit",
  },
  statut: { type: DataTypes.ENUM("active", "suspendue"), defaultValue: "active" },
  fraisLivraison: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1000 },
  zonesLivraison: { type: DataTypes.STRING(255), defaultValue: "" },
  telephone: { type: DataTypes.STRING(20) },
  telephone2: { type: DataTypes.STRING(20) },
  adresse: { type: DataTypes.STRING(255) },
  adresse2: { type: DataTypes.STRING(255) },
  emailContact: { type: DataTypes.STRING(150) },
  aProposText: { type: DataTypes.TEXT },
  horairesOuverture: { type: DataTypes.STRING(255), defaultValue: "Tous les jours de 08h30 à 23h00" },
  facebookUrl: { type: DataTypes.STRING(255), defaultValue: "" },
  instagramUrl: { type: DataTypes.STRING(255), defaultValue: "" },
  tiktokUrl: { type: DataTypes.STRING(255), defaultValue: "" },
  whatsappNumber: { type: DataTypes.STRING(50), defaultValue: "" },
  bannerSlides: { type: DataTypes.JSON, defaultValue: [] },
  sideBanners: { type: DataTypes.JSON, defaultValue: [] },
}, { tableName: "boutiques" });

module.exports = Boutique;
