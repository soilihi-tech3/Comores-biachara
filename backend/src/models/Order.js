const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
  boutiqueId: { type: DataTypes.INTEGER, allowNull: false },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  statut: {
    type: DataTypes.STRING(50),
    defaultValue: "en_attente",
  },
  modeLivraison: { type: DataTypes.ENUM("domicile", "retrait"), defaultValue: "domicile" },
  adresseLivraison: { type: DataTypes.STRING(255), allowNull: true },
  moyenPaiement: { type: DataTypes.ENUM("orange_money", "wave", "carte", "cash"), allowNull: false },
  typeVente: { type: DataTypes.STRING(30), defaultValue: "commande_enligne" },
  employeAssigneId: { type: DataTypes.INTEGER, allowNull: true },
  sousTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fraisLivraison: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: "orders" });

module.exports = Order;
