# 🏕️ BBOARD App (Colo-App)

> **La solution moderne de gestion de colonies de vacances et centres aérés.**
> *Planification, Transport, Fiches sanitaires, Emploi du temps - Tout en un.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=flat&logo=sqlite&logoColor=white)
![Socket.io](https://img.shields.io/badge/socket.io-black?style=flat&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

---

## 📋 Présentation

**BBOARD** est une application web conçue pour simplifier la vie des directeurs et animateurs. Elle centralise la gestion des participants, des transports (Bus/Vans) et du planning avec une synchronisation en temps réel.

### ✨ Fonctionnalités
*   **🚌 Plans de Transport** : Drag & drop visuel pour les bus et minibus.
*   **📅 Planning Interactif** : Gestion des activités et des horaires.
*   **📄 Fiches de Sortie** : Génération PDF/A4 automatique avec infos médicales.
*   **� Temps Réel** : Communication via WebSockets (Socket.io).
*   **� Persistance SQL** : Base de données SQLite structurée.

---

## 🛠️ Guide d'Installation Complet

### 1️⃣ Installation Automatique (Recommandé)

Si vous êtes sur **Ubuntu** ou **Debian**, vous pouvez installer Docker et Docker Compose en une seule commande :

```bash
# Se placer dans le dossier du projet
cd BBOARD-APP
# Lancer le script d'installation
bash install_docker.sh
```
*Le script s'occupe de tout : nettoyage des vieilles versions, configuration des dépôts officiels et installation de Docker Compose V2.*

---

### 2️⃣ Déploiement de l'Application (Docker)

C'est la méthode la plus simple pour la production.

```bash
# Se placer dans le dossier du projet
cd BBOARD-APP

# Lancer la stack complète
sudo docker compose up -d --build
```
*   **Frontend** : [http://localhost](http://localhost) (Port 80)
*   **Backend** : Géré en arrière-plan (Port 3001)

---

### 3️⃣ Développement Local (Sans Docker)

Pour modifier le code et voir les changements en direct :

1.  **Backend** :
    ```bash
    cd server
    npm install
    node index.js
    ```
2.  **Frontend** (dans un autre terminal) :
    ```bash
    npm install
    npm run dev
    ```
    *Accès : http://localhost:5173*

---

## 🛰️ Guide Git & GitHub

### Initialiser votre identité
```bash
git config user.email "login@votre-email.com"
git config user.name "VOTRE_NOM"
```

### Mettre à jour GitHub
```bash
# 1. Ajouter les fichiers modifiés
git add .

# 2. Créer un commit
git commit -m "feat: ajout de nouvelles fonctionnalités"

# 3. Envoyer vers GitHub
git push origin main
```

> [!TIP]
> Si vous utilisez un **Token (PAT)**, configurez-le ainsi :
> `git remote set-url origin https://VOTRE_USERNAME:VOTRE_TOKEN@github.com/BLACKI-J/BBOARD-APP.git`

---

## 🧪 Tests
L'application inclut des tests unitaires (Vitest) pour garantir la qualité :
```bash
npm run test
```

---
**Développé avec ❤️ pour les colos.**
