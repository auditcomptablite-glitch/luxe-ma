# 🛍️ LUXE.MA — Boutique Accessoires

Site e-commerce complet avec paiement à la livraison, dashboard admin et gestion des coupons.

## 🚀 Stack Technique

- **Backend** : Node.js + Express
- **Base de données** : MySQL (Railway)
- **Frontend** : HTML/CSS/JS vanilla (no framework)
- **Auth** : JWT + Cookies
- **Déploiement** : Railway

---

## 📋 Fonctionnalités

### Site client
- 🏠 Page d'accueil avec produits en vedette
- 🛍️ Boutique avec filtres par catégorie et recherche
- 📦 Fiche produit détaillée
- 🛒 Panier persistant (localStorage)
- ✅ Checkout avec **paiement à la livraison**
- 🎟️ **Code coupon** à l'étape de commande
- 📍 Suivi de commande public (par numéro)
- 👤 Compte utilisateur (profil + historique commandes)

### Dashboard Admin (`/admin`)
- 📊 Tableau de bord avec statistiques (CA, commandes, clients...)
- 📦 **Gestion des commandes** : suivi, mise à jour statut, date livraison
- 🛍️ **Gestion des produits** : CRUD complet, stock, vedette
- 🗂️ **Gestion des catégories**
- 🎟️ **Gestion des coupons** : % ou montant fixe, expiration, nb max d'utilisations
- 👥 Liste des utilisateurs

### Rôles
- `user` : client standard
- `admin` : accès complet au dashboard

---

## 🛠️ Déploiement sur Railway

### 1. Préparer le projet

```bash
git init
git add .
git commit -m "Initial commit LUXE.MA"
```

### 2. Créer le projet Railway

1. Aller sur [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Connecter votre repo GitHub

### 3. Ajouter MySQL

Dans Railway :
1. **+ Add Service → MySQL**
2. Railway créera automatiquement les variables :
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### 4. Variables d'environnement

Dans les settings de votre service Node.js sur Railway, ajouter :

```
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
NODE_ENV=production
```

Les variables MySQL sont automatiquement injectées par Railway.

### 5. Importer le schéma SQL

Dans Railway → MySQL → **Query** (ou via un client MySQL) :

```sql
-- Copier-coller le contenu de backend/schema.sql
```

Ou via la CLI Railway :
```bash
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < backend/schema.sql
```

### 6. Déploiement automatique

Railway déploie automatiquement à chaque push sur main.

---

## 💻 Développement local

```bash
# 1. Installer les dépendances
cd backend && npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos infos MySQL locales

# 3. Importer le schéma
mysql -u root -p < schema.sql

# 4. Démarrer
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

---

## 🔑 Accès par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@shop.ma | admin123 |

> ⚠️ **Changer le mot de passe admin en production !**

---

## 🗂️ Structure du projet

```
shop/
├── backend/
│   ├── config/
│   │   └── db.js              # Connexion MySQL
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js            # Login/register/profile
│   │   ├── products.js        # CRUD produits
│   │   ├── orders.js          # Commandes + coupons
│   │   └── misc.js            # Catégories, stats, users
│   ├── server.js              # Point d'entrée
│   ├── schema.sql             # Structure + données initiales
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   ├── style.css      # Styles globaux (dark luxury)
│   │   │   └── admin.css      # Styles admin dashboard
│   │   └── js/
│   │       └── main.js        # Utilitaires partagés (Cart, Auth, Toast, API)
│   └── pages/
│       ├── index.html         # Accueil
│       ├── shop.html          # Boutique
│       ├── product.html       # Fiche produit
│       ├── cart.html          # Panier
│       ├── checkout.html      # Commande + coupon
│       ├── order-success.html # Confirmation
│       ├── track.html         # Suivi commande
│       ├── login.html
│       ├── register.html
│       ├── user/
│       │   ├── profile.html
│       │   └── orders.html
│       └── admin/
│           ├── dashboard.html
│           ├── orders.html    # Gestion + livraisons
│           ├── products.html
│           ├── categories.html
│           ├── coupons.html
│           └── users.html
├── package.json               # Root (Railway)
├── railway.toml               # Config Railway
└── .gitignore
```

---

## 🎟️ Coupons disponibles (données de test)

| Code | Type | Valeur | Min. achat |
|------|------|--------|-----------|
| BIENVENUE10 | % | 10% | 200 MAD |
| SOLDES20 | % | 20% | 500 MAD |
| LIVRAISON50 | Fixe | -50 MAD | 300 MAD |

---

## 📞 Support

Pour toute question, contactez : contact@luxe.ma
