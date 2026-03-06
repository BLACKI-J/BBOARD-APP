# 🏕️ BBOARD App

> **La solution moderne de gestion de colonies de vacances et centres aérés.**
> 
> *Planification, Transport, Fiches sanitaires, Emploi du temps - Tout en un.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=flat&logo=sqlite&logoColor=white)
![Socket.io](https://img.shields.io/badge/socket.io-black?style=flat&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

---

## 📋 Présentation

**BBOARD** est une application web conçue pour simplifier la vie des directeurs et animateurs de séjours de vacances. Elle centralise la gestion des participants, des transports et du planning dans une interface fluide et réactive.

### ✨ Fonctionnalités Clés

*   **🚌 Plans de Transport (SeatMap)** : Créez visuellement vos plans de bus/minibus avec glisser-déposer. Gestion en temps réel via WebSockets.
*   **📅 Planning Interactif** : Emploi du temps quotidien et hebdomadaire.
*   **📄 Fiches de Sortie** : Génération automatique de fiches de sortie conformes (A4) avec infos médicales.
*   **👥 Annuaire Centralisé** : Gestion complète des enfants et de l'équipe (Fiches sanitaires, Groupes, Photos).
*   **🔄 Temps Réel** : Synchronisation instantanée entre tous les postes de travail.

---

## 🛠️ Stack Technique

*   **Frontend** : [React 18](https://reactjs.org/), [Vite](https://vitejs.dev/), TailwindCSS, Socket.io-client.
*   **Backend** : [Node.js](https://nodejs.org/), Express, Socket.io.
*   **Base de données** : [SQLite](https://sqlite.org/) (SGBD léger et performant).
*   **Conteneurisation** : Docker & Docker-compose.

---

## 🚀 Installation & Démarrage

### 1️⃣ En Local (Développement)

#### Pré-requis :
- Node.js 18+
- npm

#### Étapes :
1. **Cloner le projet** :
   ```bash
   git clone https://github.com/BLACKI-J/BBOARD-APP.git
   cd BBOARD-APP
   ```

2. **Lancer le Backend** :
   ```bash
   cd server
   npm install
   node index.js
   ```
   *Le serveur écoute sur le port 3001.*

3. **Lancer le Frontend** (dans un autre terminal) :
   ```bash
   # Retour à la racine
   cd ..
   npm install
   npm run dev
   ```
   *L'application est accessible sur http://localhost:5173.*

---

### 2️⃣ Déploiement avec Docker (Production)

C'est la méthode recommandée pour un déploiement simple et rapide.

```bash
# Lancer toute la stack (Frontend + Backend)
docker-compose up -d --build
```

- **Frontend** : Accessible sur [http://localhost](http://localhost) (Port 80 par défaut).
- **Backend** : Géré automatiquement par le conteneur.
- **Persistance** : La base de données est stockée dans un volume Docker pour ne pas perdre les données au redémarrage.

---

## 🛰️ Guide Git & GitHub

### Configurer votre identité (une seule fois)
```bash
git config user.email "votre@email.com"
git config user.name "VotreNom"
```

### Pousser vos modifications
Si vous avez fait des changements et voulez les mettre à jour sur GitHub :

1. **Ajouter les fichiers** :
   ```bash
   git add .
   ```

2. **Créer un commit** :
   ```bash
   git commit -m "Description de vos changements"
   ```

3. **Envoyer vers GitHub** :
   ```bash
   git push origin main
   ```

> [!TIP]
> Si GitHub demande vos identifiants à chaque fois, vous pouvez configurer votre URL avec un Token (PAT) :
> `git remote set-url origin https://VOTRE_USERNAME:VOTRE_TOKEN@github.com/BLACKI-J/BBOARD-APP.git`

---

**Développé avec ❤️ pour les colos.**
