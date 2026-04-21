# BBOARD-APP 🚀

BBOARD-APP est une solution métier de pointe dédiée à la **gestion complète des Centres de Vacances et Séjours (Colonies)**. Conçue pour offrir une fluidité opérationnelle maximale, l'application centralise les données critiques, la planification et la sécurité, même en conditions de réseau dégradées.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](package.json)
[![Tech](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20SQLite-indigo.svg)](https://react.dev)

## ✨ Caractéristiques Principales

-   📊 **Dashboard de Santé** : Surveillance en temps réel de la connexion backend/client.
-   🔒 **Sécurité par Profil** : Authentification individuelle par Code PIN à 4 chiffres.
-   🔄 **Synchronisation en Temps Réel** : Mise à jour instantanée des données sur tous les écrans via Socket.io.
-   ⚡ **Mode Résilience** : Gestion intelligente des déconnexions pour un usage fluide sur le terrain.
-   🤖 **Assistance IA** : Intégration de modèles de langage (Groq/HuggingFace) pour l'aide à la saisie et l'analyse.
-   📅 **Gestion Multisectorielle** : Participants, Plannings, Inventaire, FEI (Fiches d'Incident) et Transports.

## 🛠️ Stack Technique

-   **Frontend** : React 18, Vite, Tailwind CSS, Lucide Icons.
-   **Backend** : Node.js, Express.
-   **Base de Données** : SQLite avec synchronisation temps réel.
-   **Infrastructure** : Docker & Docker Compose.

---

## 🚀 Installation Express

La méthode la plus simple pour démarrer le projet localement :

```bash
# 1. Cloner le projet
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP

# 2. Lancer la configuration automatique
bash setup.sh

# 3. Lancer l'environnement de développement
bash dev.sh
```

## 📦 Déploiement Production (Docker)

Recommandé pour un déploiement stable sur serveur ou VPS :

```bash
# Installer Docker si nécessaire
bash install_docker.sh

# Lancer la pile applicative
docker compose up -d --build
```

L'application sera accessible par défaut sur le port **8080**.

---

## ⚙️ Configuration & Environnement

Le projet utilise un fichier `.env` pour sa configuration. Utilisez `.env.example` comme base.

### 🌐 Exposition & CORS
Si vous utilisez un domaine personnalisé ou un tunnel (Cloudflare, Ngrok) :
```env
# Liste des origines autorisées (séparées par des virgules)
ALLOWED_ORIGINS=https://votre-domaine.com,http://localhost:5173
```

### 🤖 Clés API Intelligence Artificielle
Pour activer les fonctionnalités IA, insérez vos clés dans le `.env` :
```env
# Plateforme Groq (Llama 3.1)
GROQ_API_KEY=votre_cle_ici

# Hugging Face
HUGGINGFACE_API_KEY=votre_cle_ici
```

---

## 👨‍💻 Développement

Pour lancer manuellement les services en mode développement (sans Docker) :

-   **Frontend** : `npm run dev` (Port 5173)
-   **Backend** : `npm run dev --prefix server` (Port 3001)

> [!IMPORTANT]
> **Identifiant par défaut** : Le profil "Direction Générale" est protégé par le code PIN `1234`.

---

## 📄 Licence & Crédits

Ce projet est sous licence MIT. Développé par la communauté BBOARD pour l'excellence opérationnelle des colonies de vacances.

---
*Généré avec ❤️ via le skill readme-generator.*
