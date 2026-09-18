const bcrypt = require("bcryptjs");
const { Boutique, User, Category, Product, Order, OrderItem, Review } = require("./models");

/**
 * Insère les données de démonstration et tous les comptes utilisateurs de manière sécurisée et répétable.
 */
async function runSeed() {
  console.log("Initialisation et vérification des données de démonstration dans la base de données...");

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // --- 1. Super Admin plateforme ---
  await User.findOrCreate({
    where: { email: "superadmin@boutique-saas.com" },
    defaults: {
      nom: "Super Admin",
      email: "superadmin@boutique-saas.com",
      motDePasseHash: hash("SuperAdmin123!"),
      role: "super_admin",
    }
  });

  // --- 2. Bannières Slider de la boutique ---
  const bannerSlides = [
    {
      id: 1,
      title: "Marché Frais & Produit Bio Direct Producteurs",
      subtitle: "Fruits gorgés de soleil, légumes de saison et épicerie locale livrés directement chez vous.",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Découvrir le marché",
      linkUrl: "/catalogue"
    },
    {
      id: 2,
      title: "Soins & Cosmétiques 100% Naturels",
      subtitle: "Sublimez votre beauté au naturel avec nos beurres purs, huiles bio et sérums éclat.",
      imageUrl: "https://images.unsplash.com/photo-1608248597263-00079e96515c?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Voir les cosmétiques",
      linkUrl: "/catalogue?categoryId=4"
    },
    {
      id: 3,
      title: "Livraison Express & Paiement Mobile",
      subtitle: "Payez par Mvola, Holam ou à la livraison en toute sécurité.",
      imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Commander maintenant",
      linkUrl: "/catalogue"
    }
  ];

  // --- 3. Boutique de démonstration ---
  const [boutique] = await Boutique.findOrCreate({
    where: { slug: "marche-vert" },
    defaults: {
      nom: "Marché Vert Dakar",
      slug: "marche-vert",
      logoUrl: "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=200&q=80",
      couleurPrincipale: "#163424",
      formuleAbonnement: "commission",
      fraisLivraison: 1000,
      zonesLivraison: "Dakar, Pikine, Guédiawaye, Rufisque, Moroni",
      bannerSlides: bannerSlides
    }
  });

  // --- 4. Comptes Administrateur, Employés & Client ---
  await User.findOrCreate({
    where: { email: "admin@marche-vert.com" },
    defaults: {
      nom: "Aïssatou Ba (Admin)",
      email: "admin@marche-vert.com",
      motDePasseHash: hash("Admin123!"),
      role: "admin",
      boutiqueId: boutique.id,
    }
  });

  await User.findOrCreate({
    where: { email: "ibrahima@marche-vert.com" },
    defaults: {
      nom: "Ibrahima Ndiaye",
      email: "ibrahima@marche-vert.com",
      motDePasseHash: hash("Employe123!"),
      role: "employe",
      boutiqueId: boutique.id,
      permissions: ["voir_dashboard", "gerer_categories", "gerer_produits", "gerer_commandes"],
    }
  });

  const [emp2] = await User.findOrCreate({
    where: { email: "khady@marche-vert.com" },
    defaults: {
      nom: "Khady Diop",
      email: "khady@marche-vert.com",
      motDePasseHash: hash("Employe123!"),
      role: "employe",
      boutiqueId: boutique.id,
      permissions: ["voir_dashboard", "gerer_commandes"],
    }
  });

  const [clientUser] = await User.findOrCreate({
    where: { email: "client@example.com" },
    defaults: {
      nom: "Awa Sarr",
      email: "client@example.com",
      motDePasseHash: hash("Client123!"),
      role: "client",
    }
  });

  // --- 5. Catégories ---
  const catList = [
    { nom: "Légumes", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80" },
    { nom: "Fruits", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80" },
    { nom: "Épicerie", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=400&q=80" },
    { nom: "Soins visage", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80" },
    { nom: "Soins corps", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1608248597263-00079e96515c?auto=format&fit=crop&w=400&q=80" },
    { nom: "Cheveux", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&q=80" },
  ];

  const cats = {};
  for (const c of catList) {
    const [catObj] = await Category.findOrCreate({
      where: { nom: c.nom, boutiqueId: boutique.id },
      defaults: { ...c, boutiqueId: boutique.id }
    });
    cats[c.nom] = catObj;
  }

  // --- 6. Produits ---
  const produitsData = [
    {
      nom: "Tomates fraîches Bio", cat: "Légumes", prix: 900, unite: "kg", stock: 42, seuilAlerte: 10, coutAchat: 500, ventesCount: 5,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1546470427-227c7369a679?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Oignons violets locaux", cat: "Légumes", prix: 700, prixPromo: 550, unite: "kg", stock: 8, seuilAlerte: 10, coutAchat: 350, ventesCount: 3,
      imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Mangues Kent très sucrées", cat: "Fruits", prix: 1200, unite: "kg", stock: 30, seuilAlerte: 8, coutAchat: 700, ventesCount: 8,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Bananes plantain mûres", cat: "Fruits", prix: 800, unite: "kg", stock: 25, seuilAlerte: 10, coutAchat: 450, ventesCount: 3,
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Riz brisé parfumé 100%", cat: "Épicerie", prix: 15000, prixPromo: 12900, unite: "sac 25kg", stock: 14, seuilAlerte: 5, coutAchat: 10500, ventesCount: 2,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Huile d'arachide pure", cat: "Épicerie", prix: 3200, unite: "bidon 2L", stock: 3, seuilAlerte: 6, coutAchat: 2200, ventesCount: 4,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Sérum Visage Vitamine C", cat: "Soins visage", prix: 8500, prixPromo: 6900, unite: "30ml", stock: 18, seuilAlerte: 5, coutAchat: 4000, ventesCount: 6,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1608248597263-00079e96515c?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Beurre de Karité Brut Pur", cat: "Soins corps", prix: 3500, unite: "250g", stock: 40, seuilAlerte: 10, coutAchat: 1500, ventesCount: 9,
      imageUrl: "https://images.unsplash.com/photo-1567928256561-125026a7a0b5?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Savon Noir Gommant Eclat", cat: "Soins corps", prix: 2200, unite: "pièce", stock: 55, seuilAlerte: 15, coutAchat: 900, ventesCount: 12,
      imageUrl: "https://images.unsplash.com/photo-1607006482170-a35a16d510a7?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Huile Capillaire Ricin & Argan", cat: "Cheveux", prix: 4200, prixPromo: 3400, unite: "100ml", stock: 6, seuilAlerte: 8, coutAchat: 2000, ventesCount: 7,
      imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Citrons Verts Bio", cat: "Fruits", prix: 500, unite: "kg", stock: 60, seuilAlerte: 15, coutAchat: 250, ventesCount: 1,
      imageUrl: "https://images.unsplash.com/photo-1534531141161-e49d13714bde?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const produits = {};
  for (const p of produitsData) {
    const { cat, ...rest } = p;
    const catObj = cats[cat];
    const [prodObj] = await Product.findOrCreate({
      where: { nom: p.nom, boutiqueId: boutique.id },
      defaults: { ...rest, boutiqueId: boutique.id, categoryId: catObj ? catObj.id : null }
    });
    produits[p.nom] = prodObj;
  }

  // --- 7. Avis & Commandes ---
  if (produits["Tomates fraîches Bio"] && clientUser) {
    await Review.findOrCreate({
      where: { productId: produits["Tomates fraîches Bio"].id, userId: clientUser.id },
      defaults: { productId: produits["Tomates fraîches Bio"].id, userId: clientUser.id, note: 5, commentaire: "Très fraîches, livrées le jour même." }
    });
  }

  const nbOrders = await Order.count({ where: { boutiqueId: boutique.id } });
  if (nbOrders === 0 && produits["Tomates fraîches Bio"] && clientUser && emp2) {
    const order = await Order.create({
      boutiqueId: boutique.id,
      clientId: clientUser.id,
      statut: "en_livraison",
      modeLivraison: "domicile",
      adresseLivraison: "Sacré-Cœur 3, Dakar",
      moyenPaiement: "cash",
      employeAssigneId: emp2.id,
      sousTotal: 2650,
      fraisLivraison: 1000,
      total: 3650,
    });

    await OrderItem.create({
      orderId: order.id,
      productId: produits["Tomates fraîches Bio"].id,
      quantite: 2,
      prixUnitaire: 900
    });
  }

  console.log("Seed exécuté avec succès : comptes et produits insérés dans la base de données !");
}

module.exports = runSeed;

if (require.main === module) {
  const sequelize = require("./config/database");
  sequelize.sync().then(runSeed).then(() => process.exit(0));
}

