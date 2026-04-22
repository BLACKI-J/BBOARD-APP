# BBOARD-APP 🚀

BBOARD-APP est une solution métier de pointe dédiée à la **gestion complète des Centres de Vacances et Séjours (Colonies)**. Conçue pour offrir une fluidité opérationnelle maximale, l'application centralise les données critiques, la planification et la sécurité, même en conditions de réseau dégradées.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-green.svg)](package.json)
[![Tech](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20SQLite-indigo.svg)](https://react.dev)

## ✨ Caractéristiques Principales

-   📊 **Dashboard de Santé** : Surveillance en temps réel de la connexion backend/client.
-   🔒 **Sécurité par Profil** : Authentification individuelle par Code PIN à 4 chiffres.
-   🔄 **Synchronisation Temps Réel** : Mise à jour instantanée via Socket.io.
-   ⚡ **Mode Résilience** : Gestion intelligente des déconnexions pour un usage fluide sur le terrain.
-   🤖 **Assistance IA** : Intégration de Groq et HuggingFace pour l'aide à la saisie et l'analyse.
-   📅 **Gestion Multisectorielle** : Participants, Plannings, Inventaire, FEI (Fiches d'Incident) et Transports.

## 🛠️ Stack Technique

-   **Frontend** : React 18, Vite, Tailwind CSS.
-   **Backend** : Node.js, Express, Socket.io.
-   **Base de Données** : SQLite (persistance locale simplifiée).
-   **Infrastructure** : Docker & Docker Compose.

---

## 🚀 Installation & Démarrage

BBOARD-APP utilise un gestionnaire unique (`bboard.sh`) pour simplifier toutes vos opérations.

```bash
# 1. Cloner le projet
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP

# 2. Lancer la configuration automatique (Assistance interactive)
bash bboard.sh setup

# 3. Lancer l'environnement souhaité
bash bboard.sh dev   # Mode Développement (Local)
# OU
bash bboard.sh up    # Mode Production (Docker)
```

## 🎮 Commandes du Gestionnaire CLI

Le script `bboard.sh` à la racine est votre seul outil de contrôle :

| Commande | Description |
| :--- | :--- |
| `setup` | Installe les dépendances, crée le `.env` et propose l'install de Docker. |
| `dev` | Lance le Frontend (5173) et le Backend (3001) localement. |
| `up` | Déploie l'application complète via Docker Compose (Port 8080). |
| `update` | Récupère le dernier code et redémarre les services (Docker/Local). |
| `down` | Arrête proprement tous les services (Docker et processus locaux). |
| `logs` | Visualise les journaux d'activité du serveur. |

---

## ⚙️ Configuration Avancée (.env)

L'application est hautement configurable via le fichier `.env`.

### 🌐 Exposition & Domaines (CORS)
Si vous utilisez un tunnel (Cloudflare, Ngrok) ou un domaine personnalisé :
```env
ALLOWED_ORIGINS=https://mon-domaine.com,http://localhost:5173
```

### 🤖 Services d'Intelligence Artificielle
Pour activer les fonctionnalités d'assistance intelligente :
```env
# Clé Groq (Recommandé)
GROQ_API_KEY=votre_cle_ici
GROQ_MODEL=llama-3.1-8b-instant

# Clé Hugging Face (Optionnel)
HUGGINGFACE_API_KEY=votre_cle_ici
```

### 🎨 Personnalisation du Logo
Pour utiliser votre propre logo dans l'application :
1.  Préparez une image au format **PNG** (recommandé : fond transparent).
2.  Remplacez le fichier suivant par le vôtre : `public/logo/logo.png`.
3.  Le logo sera automatiquement mis à jour sur la page de connexion et dans l'interface.

> [!NOTE]
> Le fichier `public/logo/logo.png` est ignoré par Git pour protéger votre identité visuelle personnelle lors des mises à jour.

---

## 📂 Structure du Projet

```text
.
├── bboard.sh        # Gestionnaire principal (CLI)
├── scripts/         # Scripts d'automatisation internes
├── docs/            # Archives et documents du projet
├── server/          # Backend Node.js & Base SQLite
└── src/             # Frontend React (Vite)
```

> [!IMPORTANT]
> **Profil Direction** : Par défaut, le profil "Direction Générale" est accessible avec le code PIN `1234`. Pensez à le modifier dans les réglages de sécurité dès votre première connexion.

---
*Généré avec ❤️ via le skill readme-generator.*
