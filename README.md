# BBOARD 🚀
**L'application Premium de gestion de Centre de Vacances (Colo) et de Séjours.**

BBOARD est une solution digitale novatrice, conçue spécifiquement pour les directeurs et animateurs de colonies de vacances. Son interface premium (*glassmorphism*, animations fluides, système design *Impeccable*) permet une gestion sans friction des activités, des présences, de la logistique et de la sécurité des participants.

---

## 🛠️ Comment fonctionne l'application ?

L'application repose sur une architecture moderne séparant clairement l'interface utilisateur et la logique serveur :

1. **Le Frontend (Port 8080 en prod, 5173 en dev)** : Développé en **React / Vite**, il charge l'application sous forme de PWA (Progressive Web App). Il gère l'état hors ligne local, les formulaires, et l'affichage dynamique. L'interface est dite "utilitaire et ludique".
2. **Le Backend (Port 3001)** : Développé en **Node.js / Express**, il s'occupe de la persistance des données.
3. **La Base de données** : Propulsée par **SQLite**, la base de données (`server/data/database.sqlite`) stocke la liste des personnels, des enfants, des inventaires, et des logs applicatifs. C'est un format de fichier unique qui ne nécessite pas de serveur SQL lourd, facilitant grandement les sauvegardes.

### Authentification & Rôles
BBOARD intègre un système d'identification par **codes PIN individuels**. 
* L'utilisateur arrive sur l'application, sélectionne son prénom dans l'annuaire de l'équipe d'animation, et saisit son code à 4 chiffres (comme sur un terminal de paiement).
* La **Direction** possède les pleins droits pour accéder au module Paramètres (création d'utilisateurs, assignation de permissions pour l'inventaire, le pointage, etc.).
* *Note : Par défaut, si l'animateur fraîchement créé n'a pas défini son code, le code de repli global est `1234`.*

---

## 💻 Déploiement : Pre-prod & Production

L'infrastructure du projet a été pensée pour être déployée facilement via **Docker**. BBOARD contient deux conteneurs : un serveur NGINX servant les fichiers statiques de React, et le backend Node.js.

### Prérequis Serveur
* Un serveur sous **Linux** (Ubuntu/Debian préféré).
* **Docker** et **Docker Compose** installés. (Vous pouvez utiliser le script inclus `install_docker.sh` sur un serveur Ubuntu vierge).

### Lancement de la Production (Docker)

1. Clonez le dépôt sur votre serveur :
   ```bash
   git clone https://github.com/BLACKI-J/BBOARD-APP.git
   cd BBOARD-APP
   ```

2. Préparez la structure des données et un éventuel fichier d'environnement (si besoin d'IA ou clés spéciales) :
   *(Optionnel) Dupliquez `.env.example` en `.env`.*

3. Démarrez l'infrastructure avec Docker Compose :
   ```bash
   docker-compose up -d --build
   ```

**Que fait cette commande ?**
* Elle compile la version de production de React (`npm run build`).
* Elle crée une image **Nginx** qui écoute sur le port **8080**.
* Elle lance le Backend Node.js qui écoute sur le port **3001**.
* Elle monte le dossier `server/data/` persisté sur l'hôte, garantissant que vos fiches d'incidents, bases de participants ne sont *pas perdues* quand le conteneur redémarre.

*Vous pouvez ensuite exposer le port 8080 sur le web via un reverse proxy classique (Nginx Proxy Manager, Traefik).*

### Production Sécurisée (Cloudflare Tunnel - Zero Trust)
Le fichier `docker-compose.yml` intègre une option **Cloudflared**. Si votre serveur est masqué derrière un NAT ou que vous ne voulez ouvrir **aucun port entrant**, vous pouvez relier l'app à Cloudflare.
1. Créez un tunnel dans Cloudflare Zero Trust.
2. Ajoutez le jeton récupéré dans un fichier `.env` à la racine : `TUNNEL_TOKEN=votre-token-ici`.
3. Lancez : `docker-compose --profile cloudflare up -d`.

---

## 🔄 Comment Mettre à Jour l'Application (Update)

L'application évolue ? Voici comment récupérer la dernière version sans perdre vos données (qui sont sécurisées et liées dans `server/data/`) :

1. Entrez dans le dossier BBOARD sur votre serveur.
2. Récupérez le dernier code source depuis GitHub :
   ```bash
   git pull origin main
   ```
3. Reconstruisez et relancez les conteneurs :
   ```bash
   docker-compose up -d --build
   ```
Vos animateurs n'ont plus qu'à rafraîchir leur page internet pour obtenir la nouvelle version.

*(Pour nettoyer les anciennes images inutiles : `docker image prune -a`)*

---

## 🎨 Personnalisation : Changer le Logo BBOARD

Le design de BBOARD est générique mais personnalisable pour votre association / organisme de séjour.

Pour modifier le logo principal affiché sur la page d'accueil ou en haut à gauche de la barre de navigation :

1. Prenez l'image de votre logo au format **PNG** (fond transparent recommandé).
2. Vérifiez que l'image est de forme plutôt carrée (ex: 500x500px).
3. Nommez ce fichier : `logo.png`.
4. Écrasez le précédent fichier logé dans le répertoire suivant :
   `public/logo/logo.png`
5. *(Si vous êtes en production)* Reconstruisez l'image front via Docker (voir la section *Update* juste au dessus) afin que Vite intègre le nouveau logo dans son bundle final.

---

## 👨‍💻 Développement Local (Sur votre ordinateur)

Vous souhaitez travailler sur le code de l'application ou la tester rapidement sans Docker ?

1. Installez Node.js.
2. Clonez l'application.
3. Lancez le script de démarrage local :
   ```bash
   ./dev.sh
   bash dev.sh # si les permissions "chmod +x dev.sh" ne sont pas définies
   ```
Ce script vide les ports, lance le Server (3001) et le client Vite (5173) en parallèle. Vous pouvez y accéder directement sur `http://localhost:5173`.
