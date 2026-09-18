const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define("Category", {
  boutiqueId: { type: DataTypes.INTEGER, allowNull: false },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  famille: { type: DataTypes.STRING(100), defaultValue: "Alimentation" },
  imageUrl: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "categories" });

module.exports = Category;
