<div align="center">

  # BBOARD 🚀
  **L'application de gestion de Centre de Vacances (Colo) nouvelle génération.**

  [![React](https://img.shields.io/badge/React-18.2-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.2-purple.svg?style=flat&logo=vite)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
  [![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg?style=flat&logo=sqlite)](https://www.sqlite.org/)
</div>

<br/>

**BBOARD** est une application web complète, pensée pour faciliter la vie des directeurs et animateurs de colonies de vacances. Dotée d'une interface premium novatrice (nom de code *Impeccable* combinant Glassmorphism et fluidité extrême), elle centralise tous les outils nécessaires au bon déroulement d'un séjour.

---

## ✨ Fonctionnalités Principales

*   🔒 **Système de Connexion Sécurisé** : Profils individualisés pour les animateurs et la direction avec codes PIN personnels.
*   📅 **Planning Interactif (*Schedule*)** : Gestion des activités par jour et par groupe avec un système intuitif de drag & drop.
*   🚌 **Gestion des Transports (*Seatmap*)** : Placement dynamique des enfants dans les bus et navettes (glisser-déposer sur un plan interactif).
*   📇 **Annuaire & Suivi (*Directory & Attendance*)** : Informations vitales des participants (allergies, autorisations) et modules de pointage sécurisés (check-in/check-out).
*   📦 **Inventaire Avancé (*Inventory*)** : Gestion du matériel (jeux, trousses de secours, sonorisation) avec suivi dynamique des stocks.
*   🚨 **Gestion de Crise (*FEI*)** : Création et suivi des Fiches d'Événements Indésirables (Incidents, problèmes médicaux, etc.) directement exportables.
*   ⚙️ **Espace Administration** : Module de paramétrage exclusif à la direction. Permet la gestion des permissions, la création d'utilisateurs et l'accès aux journaux système.

---

## 🛠️ Stack Technique

*   **Frontend** : [React.js](https://reactjs.org/) architecturé avec [Vite](https://vitejs.dev/) pour des performances optimales.
*   **Design** : CSS natif exploitant les variables `OKLCH` pour des couleurs ultra-modernes, couplé à [TailwindCSS](https://tailwindcss.com/) pour la structure. Icônes par [Lucide React](https://lucide.dev/).
*   **Backend** : [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
*   **Base de Données** : [SQLite](https://www.sqlite.org/) pour une portabilité et une légèreté maximales.
*   **Temps Réel** : Intégration de Websockets (Socket.io).

---

## 🚀 Installation & Démarrage rapide

Si vous souhaitez tester l'application en local sur votre machine, suivez ces étapes simples :

### Prérequis
*   [Node.js](https://nodejs.org/) (version 18+ recommandée)
*   NPM ou Yarn

### 1. Cloner le projet
```bash
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP
```

### 2. Installer les dépendances
Il faut installer les dépendances pour le frontend (React) ET pour le backend (Serveur).

```bash
# Installation des dépendances front
npm install

# Installation des dépendances serveur
cd server
npm install
cd ..
```

### 3. Lancer l'application
L'application fournit un script de lancement (`dev.sh`) pour démarrer le backend et le frontend simultanément.

**Sur MacOS / Linux :**
```bash
# Donnez les droits d'exécution au script
chmod +x dev.sh

# Lancez le script
./dev.sh
```

*(Si vous êtes sous Windows, lancez la commande `npm run dev` dans le dossier racine, et ouvrez un second terminal pour exécuter `npm run dev` dans le dossier `/server`)*.

### 4. Accéder à l'application
Ouvrez votre navigateur sur : **`http://localhost:5173`**

*(Le backend tourne en parallèle sur le port `3001`)*.

---

## 🔐 Identifiants de Test (Démarrage par défaut)

À la première ouverture, vous serez redirigé vers la page de **Login**. L'application contient un profil de base pré-configuré.

*   **Profil** : `Direction Générale`
*   **Code PIN Général par défaut** : `1234`

Une fois connecté, nous vous invitons à aller dans le module **Paramètres** (icône d'engrenage / espace sécurisé) pour créer vos propres profils animateurs avec leurs codes PIN individuels et tester la plateforme !

---

<div align="center">
  <i>Développé avec passion pour l'animation socio-culturelle.</i><br/>
  <strong>BBOARD © 2024</strong>
</div>
