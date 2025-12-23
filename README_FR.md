# 🚀 Blablabook API - Documentation Backend

**🌐 [English Version](README.md)** | **🇫🇷 Version Française**

## 📖 Aperçu

Blablabook API est un service backend RESTful construit avec Express.js, TypeScript et Prisma ORM pour une plateforme de gestion de livres et de lecture sociale. L'API offre des fonctionnalités complètes pour l'authentification des utilisateurs, la gestion des livres, le suivi des bibliothèques, les commentaires et les fonctionnalités sociales.

## 🎯 Fonctionnalités Clés

- **Authentification** : Authentification basée sur JWT avec tokens de rafraîchissement, OAuth Google
- **Gestion des Utilisateurs** : Profils, avatars, rôles (utilisateur/admin)
- **Gestion des Livres** : Opérations CRUD, recherche, catégories, auteurs
- **Bibliothèque Utilisateur** : Suivi du statut de lecture (à lire, en cours, lu), notations
- **Fonctionnalités Sociales** : Commentaires, likes, réponses
- **Tableau de Bord Admin** : Gestion des utilisateurs, modération de contenu
- **Services Email** : Réinitialisation de mot de passe, notifications via Resend

## 🛠️ Stack Technologique

- **Framework** : Express.js 5.x
- **Langage** : TypeScript 5.x
- **ORM** : Prisma 7.x avec PostgreSQL
- **Authentification** : JWT, Argon2 pour le hachage des mots de passe
- **Validation** : Schémas Zod
- **Tests** : Vitest (tests unitaires et d'intégration)
- **Documentation** : Swagger/OpenAPI
- **Qualité de Code** : Biome pour le linting/formatage
- **Conteneurisation** : Docker avec support multi-architecture

## 📦 Structure du Projet

```
projet-blablabook-back/
├── src/
│   ├── controllers/       # Gestionnaires de routes
│   ├── routers/           # Définitions des routes Express
│   ├── middlewares/       # Authentification et gestion des erreurs
│   ├── lib/               # Utilitaires principaux (auth, tokens, email, etc.)
│   ├── schemas/           # Schémas de validation Zod
│   ├── models/            # Modèles de base de données et seeding
│   └── @types/            # Définitions de types TypeScript
├── prisma/                # Schéma Prisma et migrations
├── tests/                 # Tests unitaires et d'intégration
└── config/                # Fichiers de configuration
```

## 🔧 Schéma de Base de Données

L'API utilise PostgreSQL avec les entités principales suivantes :

- **Utilisateurs** : Email, mot de passe, informations de profil, avatars
- **Livres** : ISBN, titre, auteurs, genres, métadonnées
- **Auteurs & Genres** : Entités normalisées avec relations
- **Enregistrements Utilisateur-Livre** : Statut de lecture, notations, progression
- **Commentaires** : Structure imbriquée avec likes
- **Tokens de Rafraîchissement** : Gestion sécurisée des sessions
- **Tokens de Réinitialisation de Mot de Passe** : Récupération sécurisée

## 🚀 Guide de Démarrage

### 1. 📦 Installer les Dépendances

```bash
npm install
```

### 2. ⚙️ Configurer l'Environnement

Copier et éditer les fichiers d'exemple :

```bash
cp .env.docker.example .env.docker
cp .env.example .env
```

Variables requises :
- `DATABASE_URL` - Chaîne de connexion PostgreSQL
- `JWT_SECRET` - Secret pour la signature JWT
- `PORT` - Port du serveur API
- `ALLOWED_ORIGINS` - Configuration CORS
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` - Pour OAuth Google
- `RESEND_API_KEY` - Pour les services email

### 3. 🐳 Démarrer la Base de Données avec Docker

```bash
# Démarrer le conteneur PostgreSQL
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker up -d

# Arrêter le conteneur
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker down
```

### 4. 💎 Configuration Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations de base de données
npm run prisma:migrate

# Optionnel : Démarrer Prisma Studio
npm run prisma:studio
```

### 5. ▶️ Démarrer le Serveur de Développement

```bash
npm run dev
```

L'API sera disponible à `http://localhost:PORT` (comme configuré dans `.env`).

### 6. 🧪 Exécuter les Tests

```bash
# Exécuter tous les tests
npm test

# Exécuter uniquement les tests unitaires
npm run test:unit
```

## 🔐 Flux d'Authentification

1. **Inscription** : L'utilisateur crée un compte avec email/mot de passe ou Google OAuth
2. **Connexion** : Retourne un token d'accès (courte durée) et un token de rafraîchissement (longue durée)
3. **Rafraîchissement du Token** : Rafraîchissement automatique lorsque le token d'accès expire
4. **Routes Protégées** : Utilisation du middleware `isAuth` pour l'authentification
5. **Routes Admin** : Utilisation du middleware `isAdmin` pour l'accès basé sur les rôles

## 📚 Points de Terminaison de l'API

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/google` - Connexion Google OAuth
- `POST /api/auth/refresh` - Rafraîchissement du token
- `POST /api/auth/logout` - Déconnexion utilisateur
- `GET /api/auth/me` - Obtenir le profil de l'utilisateur actuel

### Livres
- `GET /api/books` - Lister tous les livres
- `GET /api/books/:id` - Obtenir les détails d'un livre
- `POST /api/books` - Créer un livre (admin uniquement)
- `PUT /api/books/:id` - Mettre à jour un livre (admin uniquement)
- `DELETE /api/books/:id` - Supprimer un livre (admin uniquement)

### Bibliothèque Utilisateur
- `GET /api/library` - Obtenir la bibliothèque de l'utilisateur
- `POST /api/library` - Ajouter un livre à la bibliothèque
- `PUT /api/library/:id` - Mettre à jour le statut de lecture/notation
- `DELETE /api/library/:id` - Retirer un livre de la bibliothèque

### Commentaires
- `GET /api/comments` - Obtenir les commentaires pour un livre
- `POST /api/comments` - Créer un commentaire
- `POST /api/comments/:id/like` - Aimé un commentaire
- `POST /api/comments/:id/reply` - Répondre à un commentaire

### Admin
- `GET /api/admin/users` - Lister tous les utilisateurs
- `PUT /api/admin/users/:id` - Mettre à jour le rôle d'un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur

## 🌐 Documentation de l'API

La documentation Swagger est disponible à `/api-docs` lorsque le serveur est en cours d'exécution. La spécification OpenAPI est générée automatiquement à partir des commentaires JSDoc.

## 📊 Stratégie de Test

### Tests Unitaires
- Validation des middlewares
- Utilitaires de tokens
- Constructeurs de requêtes
- Gestionnaires d'erreurs

### Tests d'Intégration
- Flux d'authentification
- Opérations CRUD sur les livres
- Gestion de la bibliothèque utilisateur
- Système de commentaires
- Fonctionnalités admin

### Configuration des Tests
```bash
# Réinitialiser la base de données de test
npm run reset-test-db

# Exécuter les tests dans Docker
npm run test:docker
```

## 🛡️ Fonctionnalités de Sécurité

- **Hachage des Mots de Passe** : Argon2 pour un stockage sécurisé
- **Sécurité JWT** : Tokens d'accès de courte durée avec rotation des tokens de rafraîchissement
- **CORS** : Origines autorisées configurables
- **Validation des Entrées** : Schémas Zod pour toutes les requêtes
- **Protection contre les Injections SQL** : Prisma ORM avec requêtes paramétrées
- **Limitation de Débit** : Limitation intégrée dans Express

## 📦 Déploiement

### Déploiement en Production

L'API est automatiquement déployée en production via GitHub Actions lors des pushes sur la branche `main` :

1. **Build** : Image Docker multi-architecture (linux/arm64)
2. **Push** : Image poussée vers Docker Hub
3. **Migration** : Migrations de base de données appliquées
4. **Déploiement** : Nouveau conteneur démarré sur le serveur de production

### Pipeline CI/CD

- **Job de Test** : Exécute tous les tests à chaque push
- **Job de Déploiement** : Déploie en production uniquement sur la branche `main`
- **Rollback** : Sauvegarde automatique du conteneur précédent
- **Vérifications de Santé** : Surveillance de la santé du conteneur

### Environnement de Production

- **Base de Données** : Supabase PostgreSQL
- **Hébergement** : Conteneur Docker sur serveur dédié
- **Domaine** : `https://api.blablabook.space`
- **Surveillance** : Vérifications de santé intégrées dans Express

## 📝 Qualité de Code

### Formatage & Linting

```bash
# Vérifier la qualité du code
npm run check

# Formater le code
npm run format

# Linter le code
npm run lint
```

### Configuration Biome

- Support TypeScript
- Formatage compatible Prettier
- Linting compatible ESLint
- Corrections automatiques disponibles

## 🔧 Scripts de Développement

```bash
# Serveur de développement avec rechargement automatique
npm run dev

# Build pour la production
npm run build

# Démarrer le serveur de production
npm start

# Seeding de la base de données
npm run db:seed

# Réinitialiser la base de données (développement uniquement)
npm run prisma:reset
```

## 🤝 Contribution

1. Forker le dépôt
2. Créer une branche de fonctionnalité
3. Implémenter les changements avec des tests
4. Exécuter `npm run check` pour vérifier la qualité du code
5. Soumettre une pull request vers la branche `dev`

## 📄 Licence

Licence ISC - Voir le fichier LICENSE pour plus de détails.

## 📬 Contact

Pour toute question ou support, veuillez contacter l'équipe Blablabook.
