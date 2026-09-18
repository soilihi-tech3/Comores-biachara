const bcrypt = require("bcryptjs");
const { Boutique, User, Category, Product, Order, OrderItem, Review } = require("./models");

/**
 * Insère des données de démonstration avec des images de qualité professionnelle.
 */
async function runSeed() {
  const nbBoutiques = await Boutique.count();
  if (nbBoutiques > 0) {
    console.log("Données déjà présentes — seed ignoré.");
    return;
  }
  console.log("Base vide détectée : insertion des données de démonstration avec photos réelles...");

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // --- Super Admin plateforme ---
  await User.create({
    nom: "Super Admin", email: "superadmin@boutique-saas.com",
    motDePasseHash: hash("SuperAdmin123!"), role: "super_admin",
  });

  // --- Bannières Slider de la boutique ---
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
      subtitle: "Payez par Wave, Orange Money ou à la livraison en toute sécurité à Dakar.",
      imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Commander maintenant",
      linkUrl: "/catalogue"
    }
  ];

  // --- Boutique de démonstration ---
  const boutique = await Boutique.create({
    nom: "Marché Vert Dakar",
    slug: "marche-vert",
    logoUrl: "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=200&q=80",
    couleurPrincipale: "#2D5A27",
    formuleAbonnement: "commission",
    fraisLivraison: 1000,
    zonesLivraison: "Dakar, Pikine, Guédiawaye, Rufisque",
    bannerSlides: bannerSlides
  });

  await User.create({
    nom: "Aïssatou Ba (Admin)", email: "admin@marche-vert.com",
    motDePasseHash: hash("Admin123!"), role: "admin", boutiqueId: boutique.id,
  });

  const emp1 = await User.create({
    nom: "Ibrahima Ndiaye", email: "ibrahima@marche-vert.com",
    motDePasseHash: hash("Employe123!"), role: "employe", boutiqueId: boutique.id,
    permissions: { catalogue: true, commandes: false, livraison: false },
  });
  const emp2 = await User.create({
    nom: "Khady Diop", email: "khady@marche-vert.com",
    motDePasseHash: hash("Employe123!"), role: "employe", boutiqueId: boutique.id,
    permissions: { catalogue: false, commandes: true, livraison: false },
  });

  const client = await User.create({
    nom: "Awa Sarr", email: "client@example.com",
    motDePasseHash: hash("Client123!"), role: "client",
  });

  // --- Autres boutiques ---
  await Boutique.create({ nom: "Beauté Sahel", slug: "beaute-sahel", formuleAbonnement: "forfait_mensuel" });
  await Boutique.create({ nom: "Épicerie Thiès Express", slug: "epicerie-thies", formuleAbonnement: "essai_gratuit" });

  // --- Catégories ---
  const cats = {};
  for (const c of [
    { nom: "Légumes", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80" },
    { nom: "Fruits", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80" },
    { nom: "Épicerie", famille: "alimentation", imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=400&q=80" },
    { nom: "Soins visage", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80" },
    { nom: "Soins corps", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1608248597263-00079e96515c?auto=format&fit=crop&w=400&q=80" },
    { nom: "Cheveux", famille: "cosmetique", imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&q=80" },
  ]) {
    cats[c.nom] = await Category.create({ ...c, boutiqueId: boutique.id });
  }

  // --- Produits (avec 2 photos par produit) ---
  const produitsData = [
    {
      nom: "Tomates fraîches Bio", cat: "Légumes", prix: 900, unite: "kg", stock: 42, seuilAlerte: 10, coutAchat: 500,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1546470427-227c7369a679?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Oignons violets locaux", cat: "Légumes", prix: 700, prixPromo: 550, unite: "kg", stock: 8, seuilAlerte: 10, coutAchat: 350,
      imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Mangues Kent très sucrées", cat: "Fruits", prix: 1200, unite: "kg", stock: 30, seuilAlerte: 8, coutAchat: 700,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Bananes plantain mûres", cat: "Fruits", prix: 800, unite: "kg", stock: 25, seuilAlerte: 10, coutAchat: 450,
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Riz brisé parfumé 100%", cat: "Épicerie", prix: 15000, prixPromo: 12900, unite: "sac 25kg", stock: 14, seuilAlerte: 5, coutAchat: 10500,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Huile d'arachide pure", cat: "Épicerie", prix: 3200, unite: "bidon 2L", stock: 3, seuilAlerte: 6, coutAchat: 2200,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Sérum Visage Vitamine C", cat: "Soins visage", prix: 8500, prixPromo: 6900, unite: "30ml", stock: 18, seuilAlerte: 5, coutAchat: 4000,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1608248597263-00079e96515c?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Beurre de Karité Brut Pur", cat: "Soins corps", prix: 3500, unite: "250g", stock: 40, seuilAlerte: 10, coutAchat: 1500,
      imageUrl: "https://images.unsplash.com/photo-1567928256561-125026a7a0b5?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Savon Noir Gommant Eclat", cat: "Soins corps", prix: 2200, unite: "pièce", stock: 55, seuilAlerte: 15, coutAchat: 900,
      imageUrl: "https://images.unsplash.com/photo-1607006482170-a35a16d510a7?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Huile Capillaire Ricin & Argan", cat: "Cheveux", prix: 4200, prixPromo: 3400, unite: "100ml", stock: 6, seuilAlerte: 8, coutAchat: 2000,
      imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80"
    },
    {
      nom: "Citrons Verts Bio", cat: "Fruits", prix: 500, unite: "kg", stock: 60, seuilAlerte: 15, coutAchat: 250,
      imageUrl: "https://images.unsplash.com/photo-1534531141161-e49d13714bde?auto=format&fit=crop&w=600&q=80",
      imageUrl2: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const produits = {};
  for (const p of produitsData) {
    const { cat, ...rest } = p;
    produits[p.nom] = await Product.create({ ...rest, boutiqueId: boutique.id, categoryId: cats[cat].id });
  }

  // --- Avis ---
  await Review.create({ productId: produits["Tomates fraîches Bio"].id, userId: client.id, note: 5, commentaire: "Très fraîches, livrées le jour même." });
  await Review.create({ productId: produits["Sérum Visage Vitamine C"].id, userId: client.id, note: 5, commentaire: "Ma peau est plus lumineuse en 2 semaines." });
  await Review.create({ productId: produits["Beurre de Karité Brut Pur"].id, userId: client.id, note: 5, commentaire: "100% naturel, hydrate toute la journée." });

  // --- Commande ---
  const order = await Order.create({
    boutiqueId: boutique.id, clientId: client.id, statut: "en_livraison",
    modeLivraison: "domicile", adresseLivraison: "Sacré-Cœur 3, Dakar",
    moyenPaiement: "wave", employeAssigneId: emp2.id,
    sousTotal: 2650, fraisLivraison: 1000, total: 3650,
  });
  await OrderItem.create({ orderId: order.id, productId: produits["Tomates fraîches Bio"].id, quantite: 2, prixUnitaire: 900 });
  await OrderItem.create({ orderId: order.id, productId: produits["Oignons violets locaux"].id, quantite: 1, prixUnitaire: 550 });

  console.log("Seed terminé avec succès !");
}

module.exports = runSeed;

if (require.main === module) {
  const sequelize = require("./config/database");
  sequelize.sync().then(runSeed).then(() => process.exit(0));
}
