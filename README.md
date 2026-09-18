# Marché Vert — Plateforme SaaS multi-boutiques (Full Stack)

Application e-commerce complète basée sur le cahier des charges : backend API (Node.js + Express + MySQL via Sequelize), frontend React (Vite), et base de données MySQL — le tout orchestré avec Docker Compose.

## Architecture

```
boutique-saas/
├── backend/         API REST Node.js / Express / Sequelize / MySQL / JWT
├── frontend/        Application React (Vite) — boutique, admin, super admin
├── database/        schema.sql (documentation du schéma, auto-créé par Sequelize)
└── docker-compose.yml
```

### Fonctionnalités couvertes

**Espace Client (front-office)**
- Catalogue par catégories (alimentation / cosmétique), recherche, promotions
- Fiche produit avec avis et notes
- Panier, choix livraison à domicile / retrait, choix du moyen de paiement (Orange Money, Wave, Carte, Cash)
- Création de commande réelle (transaction en base : décrémente le stock, incrémente les ventes)
- Suivi de commande (statuts : en attente → validée → en préparation → en livraison → livrée)
- Compte client (inscription / connexion), avis produits

**Espace Admin boutique (back-office)**
- Tableau de bord : chiffre d'affaires, bénéfice net estimé, alertes de stock, graphique 7 jours, top produits
- Gestion du catalogue (CRUD produits, prix promo, seuils d'alerte stock)
- Gestion des commandes (changement de statut, attribution à un employé)
- Gestion des employés (création de comptes avec permissions)
- Paramètres boutique (identité, zones et frais de livraison)

**Console Super Admin (plateforme)**
- Vue globale multi-boutiques (CA cumulé, ventes cumulées, boutiques actives)
- Création de nouvelles boutiques clientes (avec compte admin associé)
- Activation / suspension de boutiques

## Démarrage rapide (Docker — recommandé)

Prérequis : Docker et Docker Compose installés.

```bash
cd boutique-saas
docker-compose up --build
```

Cela démarre :
- MySQL sur le port `3306`
- Redis sur le port `6379` (réservé pour un usage futur de cache/sessions)
- Backend API sur `http://localhost:4000`
- Frontend sur `http://localhost:5173`

Au premier démarrage, le backend attend que MySQL soit prêt, crée automatiquement les tables, puis **insère des données de démonstration** (boutique, catégories, produits, commandes, avis, comptes).

Ouvrez ensuite **http://localhost:5173**.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Super Admin | superadmin@boutique-saas.com | SuperAdmin123! |
| Admin boutique | admin@marche-vert.com | Admin123! |
| Employé | ibrahima@marche-vert.com | Employe123! |
| Employé | khady@marche-vert.com | Employe123! |
| Client | client@example.com | Client123! |

Après connexion, vous êtes automatiquement redirigé vers l'espace correspondant à votre rôle :
- Client → boutique (`/`)
- Admin / Employé → back-office (`/admin`)
- Super Admin → console plateforme (`/super-admin`)

## Démarrage sans Docker (développement local)

### 1. Base de données
Installez MySQL localement, puis créez la base :
```sql
CREATE DATABASE boutique_saas CHARACTER SET utf8mb4;
```

### 2. Backend
```bash
cd backend
cp .env.example .env     # ajustez DB_HOST=localhost si besoin
npm install
npm run dev               # démarre sur http://localhost:4000
```
Les tables sont créées et les données de démo insérées automatiquement au démarrage.

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # démarre sur http://localhost:5173
```

## Points techniques clés

- **Authentification** : JWT (`jsonwebtoken`), mots de passe hashés avec `bcryptjs`.
- **Multi-tenant** : chaque boutique (`boutiques`) est isolée ; les comptes admin/employé sont rattachés à `boutique_id`, et toutes les routes `/api/admin/*` filtrent systématiquement par la boutique de l'utilisateur connecté.
- **Intégrité des commandes** : la création de commande est faite dans une transaction Sequelize avec verrouillage de ligne (`LOCK.UPDATE`) pour éviter les ventes en survente sur du stock concurrent.
- **Base de données** : MySQL via Sequelize ORM. Le fichier `database/schema.sql` documente la structure réelle des tables pour référence.
- **Extensions prévues par le cahier des charges non implémentées dans cette version** : intégration réelle des passerelles de paiement (Orange Money / Wave / CinetPay — actuellement le moyen de paiement est enregistré mais aucun appel à une API bancaire réelle n'est fait), notifications SMS/push, synchronisation hors-ligne MongoDB pour les livreurs, cache Redis actif sur le catalogue (le conteneur Redis est prêt mais non encore branché au code).

## Prochaines étapes suggérées

1. Brancher un vrai agrégateur de paiement (CinetPay gère Orange Money + Wave + carte pour l'Afrique de l'Ouest) sur la route `POST /api/store/:slug/orders`.
2. Ajouter des migrations Sequelize (`sequelize-cli`) plutôt que `sequelize.sync()` pour la production.
3. Ajouter des tests automatisés (Jest + Supertest côté backend).
4. Déployer : backend sur un serveur Node (ou conteneur), MySQL managé, frontend buildé (`npm run build`) servi via un CDN ou Nginx.
