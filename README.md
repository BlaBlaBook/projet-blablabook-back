# 🚀 Installation & Lancement du Projet Blablabook API

## 1. 📦 Installation des dépendances

```bash
npm install
````

---

## 2. ⚙️ Configuration des variables d’environnement

Copier les fichiers d’exemple :

```bash
cp .env.docker.example .env.docker
cp .env.example .env
```

> ⚠️ N’oublie pas d’éditer ces fichiers pour y mettre tes valeurs (ports, clés, URL DB, etc.).

---

## 3. 🐳 Lancer la base de données avec Docker

Exécuter la stack Docker :

```bash
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker up -d
```

> `-p blablabook` définit le nom du projet Docker
> `--env-file .env.docker` charge les variables pour la DB

Fermer le container DB :

```bash
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker down
```

---

## 4. 💎 Générer et Migrer Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

---

## 5. ▶️ Lancer le serveur Express.js

```bash
npm run dev
```

Le serveur démarre ensuite sur :

```
http://localhost:PORT
```

(Le port est défini dans ton `.env`.)

---

## 6. 🌐 Déploiement

L’API **Blablabook** est déployée en production à l’adresse :

```
https://api.blablabook.space
```

### CI/CD

Le déploiement est automatisé via **GitHub Actions** : à chaque push sur la branche `main`, le workflow :

1. Build et push l’image Docker sur Docker Hub.
2. Se connecte au serveur distant via SSH.
3. Exécute les migrations Prisma sur la base de données.
4. Redémarre le container Docker de l’API avec les nouvelles modifications.

### Base de données

La base de données PostgreSQL est hébergée sur **Supabase**.  
Les variables d’environnement nécessaires (URL DB, JWT, ports, etc.) sont injectées dans le container via GitHub Actions pour la production.
