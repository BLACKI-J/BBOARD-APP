# BBOARD App

> **La solution moderne de gestion de colonies de vacances et centres aérés.**
> 
> *Planification, Transport, Fiches sanitaires, Emploi du temps - Tout en un.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

---

## Présentation

**BBOARD** est une application web progressive (PWA) conçue pour simplifier la vie des directeurs et animateurs de séjours de vacances. Elle remplace les fichiers Excel complexes et les papiers volants par une interface centralisée, fluide et pensée pour le terrain.

### Fonctionnalités Clés

*   **🚌 Plans de Transport (SeatMap)** : Créez visuellement vos plans de bus/minibus avec glisser-déposer. Gérez les places, les chauffeurs et imprimez les listes d'émargement.
*   **📅 Planning Interactif** : Emploi du temps de la semaine avec gestion des activités, des lieux et des horaires.
*   **📄 Fiches de Sortie** : Génération automatique de fiches de sortie conformes (A4) avec listes des participants, infos médicales (PAI/Allergies) et signatures.
*   **📝 Récapitulatif Quotidien** : Outil de prise de notes pour les réunions du soir et suivi des tâches (To-Do List).
*   **👥 Annuaire Centralisé** : Gestion complète des enfants, animateurs et direction (Fiches sanitaires, Groupes d'âge, Photos).
*   **💾 100% Local & Sécurisé** : Les données sont stockées localement dans votre navigateur (LocalStorage) avec option d'export/import JSON complet. Pas de serveur de base de données requis.

---

## Stack Technique

Le projet est construit avec des technologies modernes pour assurer performance et maintenabilité :

*   **Core** : [React 18](https://reactjs.org/) (Hooks, Context API)
*   **Build Tool** : [Vite](https://vitejs.dev/) (Ultra-rapide)
*   **UI/UX** : CSS Modules, Lucide React (Icônes), Google Fonts (Outfit)
*   **Drag & Drop** : `@dnd-kit/core` (Gestion fluide du glisser-déposer tactile)
*   **Déploiement** : Docker + Nginx (Image légère < 30Mo)

---

## Installation & Démarrage

### 1️ En Local (Développement)

Pré-requis : Node.js 18+ installé.

```bash
# Cloner le projet
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```
> L'application sera accessible sur `http://localhost:5173`

### 2️ Déploiement avec Docker (Production)

C'est la méthode recommandée pour un déploiement sur serveur (VPS, NAS, etc.).

```bash
# Construire et lancer le conteneur en arrière-plan
docker-compose up -d --build
```
> L'application sera accessible sur le port **8080** de votre serveur (ex: `http://votre-ip:8080`).

**Structure de l'image Docker :**
*   **Stage 1 (Build)** : Node.js compile l'application React.
*   **Stage 2 (Run)** : Nginx (Alpine) sert les fichiers statiques.
*   **Optimisation** : Configuration Nginx personnalisée pour le support SPA (Single Page Application).

### 3️ Déploiement Classique (Apache/Nginx)

Si vous n'utilisez pas Docker :

1.  Générez les fichiers de production :
    ```bash
    npm run build
    ```
2.  Copiez le contenu du dossier `dist/` vers votre hébergement web (`/var/www/html` ou via FTP).
3.  Assurez-vous que votre serveur redirige toutes les routes vers `index.html` (SPA).

---

## Gestion des Données

BBOARD fonctionne en "Offline-First". 

*   **Sauvegarde** : Allez dans l'onglet *Paramètres* > *Sauvegarde complète* pour télécharger un fichier `.json` contenant toutes vos données.
*   **Restauration** : Utilisez le même fichier pour restaurer vos données sur un autre appareil ou après un nettoyage du cache.
*   **Confidentialité** : Aucune donnée ne transite par un serveur tiers. Tout reste sur votre machine.

---

## Contribuer

Les contributions sont les bienvenues ! 

1.  Forkez le projet
2.  Créez votre branche (`git checkout -b feature/AmazingFeature`)
3.  Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4.  Push sur la branche (`git push origin feature/AmazingFeature`)
5.  Ouvrez une Pull Request

---

**Développé avec ❤️ pour les colos.**
