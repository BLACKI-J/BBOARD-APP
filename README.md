# BBOARD 🚀

BBOARD est une application web métier pour la gestion des Centres de Vacances et Séjours. 
Elle centralise la gestion des participants, des plannings, de la logistique (transports et inventaire) et le suivi des incidents (FEI).

---

## 🛠️ Fonctionnement Général

L'application est divisée en deux parties :
1. **Frontend (React/Vite)** : L'interface utilisateur. Elle gère notamment un mode hors-ligne partiel pour la résilience.
2. **Backend (Node.js/Express) + SQLite** : Un serveur léger qui stocke toutes les données (base `server/data/database.sqlite`). L'usage de SQLite rend les sauvegardes simples : il suffit de copier le ficher `.sqlite`.

**Authentification :**
L'application utilise un système de profil avec **Code PIN à 4 chiffres**. 
- Vous sélectionnez votre prénom dans la liste et entrez votre code.
- Par défaut, si vous venez de créer un profil depuis l'administration et n'avez pas mis de code, le système utilise `1234`.
- Le profil "Direction Générale" est créé d'office et protégé par le code global.

---

## 💻 Déploiement en Production (Serveur / VPS)

Le plus simple (et recommandé) pour déployer BBOARD est d'utiliser **Docker**.

### Installation initiale

1. Rapatriez le code sur votre serveur :
   ```bash
   git clone https://github.com/BLACKI-J/BBOARD-APP.git
   cd BBOARD-APP
   ```
2. Installez Docker si ce n'est pas déjà fait :
   *(Optionnel : un script `install_docker.sh` est fourni à la racine pour les systèmes Debian/Ubuntu).*
3. Lancez les conteneurs :
   ```bash
   docker compose up -d --build
   ```

Votre application web est maintenant accessible sur le port **8080** de votre serveur.

---

## 🔄 Mettre à jour l'application

Il n'y a **pas de script `update.sh` magique**. La mise à jour se fait avec les commandes standards de Git et Docker.
Vos données sont stockées dans `server/data/` qui est un volume persistant, elles ne seront donc pas écrasées.

Sur votre serveur, dans le dossier `BBOARD-APP` :

1. Récupérez le nouveau code depuis GitHub :
   ```bash
   git pull origin main
   ```
2. Reconstruisez et relancez les images Docker avec le nouveau code :
   ```bash
   docker compose up -d --build
   ```

Nettoyez occasionnellement les vieilles images avec `docker image prune -a`.

---

## 🎨 Personnaliser le logo

C'est très simple :
1. Prenez votre logo au format PNG et nommez-le `logo.png`.
2. Remplacez le fichier existant à cet emplacement : `public/logo/logo.png`.
3. Re-générez l'application (voir la section "Mettre à jour" ci-dessus pour la commande de build Docker).

---

## 👨‍💻 Environnement de Développement (Local)

Pour tester BBOARD localement sans Docker sur votre ordinateur :

1. Assurez-vous d'avoir Node.js d'installé.
2. Installez les dépendances :
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
3. Exécutez le script de démarrage local :
   ```bash
   ./dev.sh
   ```
Le client (React) tournera sur `localhost:5173` et l'API sur `localhost:3001`.
