# BBOARD 🏕️

**BBOARD** est une application métier de gestion complète des **centres de vacances et séjours (colonies)**. Pensée pour le terrain : utilisable sur **téléphone, tablette et ordinateur**, en réseau local ou à distance, elle centralise la santé, la coordination, le pointage et la logistique d'un séjour.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20Node%20%7C%20SQLite-c2703d.svg)](https://react.dev)
[![PWA](https://img.shields.io/badge/PWA-installable-7c5cff.svg)](#-mobile--multi-appareils)

---

## ✨ Fonctionnalités

### 🩺 Pôle Santé
- **Fiches & Suivi** : fiche complète par enfant (activités, hygiène, sommeil, repas, santé, traitements) — éditable par l'équipe sanitaire, lisible par les anims.
- **Médicaments** : administration par créneau (Matin / Midi / Goûter / Soir) avec **calendrier** pour consulter/valider n'importe quel jour, traitement « si besoin » (PRN), et **export PDF** du registre.
- **Registre infirmerie** : registre d'administration + suivi des passages à l'infirmerie, **exportables en PDF** (document à archiver).

### 📋 Tableau de bord
- **Messages & Alertes** : la direction / l'équipe sanitaire publie un message ou une alerte (priorité info / important / urgent) directement, visible par toute l'équipe.
- Vue du jour : activités du créneau en cours, traitements à donner, repas, alertes auto (fiches sanitaires manquantes, anniversaires).

### 👥 Annuaire & Coordination
- **Annuaire** : participants & staff, **rôles dynamiques**, groupes, recherche/filtres, import/export CSV & JSON, **argent de poche** par enfant.
- **Pointage** : présence par groupe, photo via **caméra native du téléphone** ou galerie.
- **Coordination** : compte-rendu quotidien (sauvegarde auto) + tâches priorisées par jour.
- **Planning & Menus** : activités datées + menus de la semaine.

### 🚨 Sécurité & logistique
- **FEI** (Fiches d'Événement Indésirable) : formulaire Cerfa imprimable + **reformulation assistée par IA**.
- **Fiche de sortie**, **Matériel / Inventaire** (scan & reconnaissance IA), **Transports**.

### ⚙️ Transverse
- 🔒 **Authentification par code PIN** (4 chiffres, haché en base), rôles & permissions configurables.
- 🔄 **Synchronisation temps réel** via Socket.io.
- 🤖 **Assistance IA** (Groq + Hugging Face) pour la saisie FEI et la reconnaissance d'objets.
- 📲 **PWA installable**, navigation mobile (barre inférieure), en-têtes rétractables au scroll.

---

## 🛠️ Stack technique

| Couche | Technologies |
| :--- | :--- |
| **Frontend** | React 18 · Vite · design system custom (variables CSS OKLCH, thème chaud « Terracotta ») |
| **Backend** | Node.js · Express · Socket.io |
| **Base de données** | SQLite (persistance locale) |
| **Infra** | Docker & Docker Compose · Nginx |
| **Polices** | Bricolage Grotesque (titres) · Hanken Grotesk (texte) |

---

## 🚀 Déploiement facile (Docker)

> **Cible** : un PC ou serveur sous **Linux** (ou **Windows avec WSL2**) avec **Docker** installé.
> Toute la gestion passe par **un seul script** : `bboard.sh`. Aucune connaissance technique requise.

### Étape par étape

**1. Récupérer le code**
```bash
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP
```

**2. Configuration initiale** (crée le fichier `.env`, prépare les dossiers ; propose d'installer Docker si absent — répondez `y`)
```bash
bash bboard.sh setup
```

**3. Choisir le code PIN Direction** — obligatoire, **4 chiffres**. Éditez `.env` :
```bash
nano .env     # remplacez la ligne : INITIAL_ADMIN_PIN=change_me_4_digits
```
*ou* en une commande (remplacez `4827` par votre code) :
```bash
sed -i 's/^INITIAL_ADMIN_PIN=.*/INITIAL_ADMIN_PIN=4827/' .env
```

**4. Déployer**
```bash
bash bboard.sh up
```
Le script reconstruit l'app, vérifie que le serveur répond, puis **affiche l'URL d'accès** :
```
➜ Sur cette machine : http://localhost:8080
➜ Téléphone/tablette (même WiFi) : http://192.168.X.X:8080
```

**5. Se connecter** — ouvrez l'URL, profil **Direction**, code PIN choisi à l'étape 3.
Sur téléphone : « Ajouter à l'écran d'accueil » installe l'app (PWA).

> [!NOTE]
> Le PIN n'est lu qu'au **premier** démarrage (création de la base) ; ensuite il se change
> dans **Paramètres**. Vos données vivent dans `server/data/` et **survivent** aux mises à jour.

### 🎮 Au quotidien

| Besoin | Commande |
| :--- | :--- |
| Démarrer / redéployer | `bash bboard.sh up` |
| **Mettre à jour** (sauvegarde auto + rebuild) | `bash bboard.sh update` |
| Sauvegarder la base maintenant | `bash bboard.sh backup` |
| Restaurer une sauvegarde | `bash bboard.sh restore <fichier>` |
| Voir les journaux | `bash bboard.sh logs` |
| Arrêter les services | `bash bboard.sh down` |
| Développement local (sans Docker) | `bash bboard.sh dev` *(Front 5173 · Back 3001)* |

---

## 🔄 Mise à jour (déploiement Docker)

Pour récupérer la dernière version sur le serveur (vos données dans `server/data/` sont **conservées**) :

```bash
cd ~/BBOARD-APP
git pull origin main
docker compose up -d --build      # reconstruit les images (front + back)
docker logs bboard-backend --tail 10
```

Ou en une commande via le gestionnaire (recommandé) :

```bash
bash bboard.sh update
```

`bboard.sh update` fait tout, en sécurité : **copie de sauvegarde de la base avant
toute opération**, `git pull`, reconstruction Docker, vérification que le serveur
répond, puis affiche l'URL à ouvrir sur téléphone. Une sauvegarde manuelle reste
possible à tout moment : `bash bboard.sh backup` (et `restore <fichier>` pour revenir en arrière).

> [!IMPORTANT]
> - Le `--build` est nécessaire : il reconstruit le backend (le module natif `sqlite3`
>   est recompilé dans l'image). Sans lui, les changements de dépendances ne sont pas pris.
> - Après mise à jour, **rechargez l'app en vidant le cache** (Ctrl+Maj+R, ou sur mobile :
>   fermer puis rouvrir l'onglet / l'icône PWA) — sinon l'ancienne interface reste en cache.
> - En cas de souci : `docker logs bboard-backend --tail 30` montre l'erreur exacte.

> [!TIP]
> Si le rebuild semble figé sur du cache, forcez : `docker compose build --no-cache && docker compose up -d`.

---

## 📲 Mobile & multi-appareils

L'app est conçue pour être **servie au quotidien depuis n'importe quel appareil** (tél, tablette, PC).

**Sur le réseau local (le plus simple)** : une machine héberge l'app, les autres s'y connectent en WiFi.

```bash
bash bboard.sh up                 # sur la machine serveur → port 8080
# Sur les téléphones : ouvrir http://IP-DU-SERVEUR:8080
```

> [!TIP]
> Sur le téléphone, « Ajouter à l'écran d'accueil » installe BBOARD comme une appli (PWA).
> La prise de photo (pointage, matériel) utilise la **caméra native** → fonctionne aussi en HTTP sur le réseau local.

---

## ⚙️ Configuration (.env)

### 🌐 Exposition / CORS
Les IP locales (`192.168.*`, `10.*`, `127.*`) et `localhost` sont autorisées d'office.
**Pour un accès par domaine ou reverse proxy (Cloudflare, Nginx, Ngrok…), vous DEVEZ
ajouter l'origine** — sinon toutes les requêtes `/api` sont bloquées (login impossible).

```env
ALLOWED_ORIGINS=https://camp.mondomaine.net      # votre domaine public exact (https://…)
COOKIE_SECURE=true                                # obligatoire en HTTPS (cookie de session)
```

> [!WARNING]
> Symptôme d'un domaine non autorisé : « Serveur Backend : Non disponible » + erreurs
> 5xx sur `/api/...`. Vérifiez : `docker logs bboard-backend` → ligne « CORS: origine
> non autorisée → … ». Ajoutez le domaine à `ALLOWED_ORIGINS`, puis `docker compose up -d`.

### 🔒 Sécurité
```env
INITIAL_ADMIN_PIN=4827   # PIN Direction initial (haché au 1er démarrage)
COOKIE_SECURE=true       # à activer en production HTTPS
```
Le backend refuse de démarrer sans `INITIAL_ADMIN_PIN` valide.

### 🤖 Intelligence artificielle (optionnel)
```env
GROQ_API_KEY=votre_cle_ici
GROQ_MODEL=llama-3.1-8b-instant
HUGGINGFACE_API_KEY=votre_cle_ici
```

### 🎨 Logo
Remplacez `public/logo/logo.png` par votre image PNG (fond transparent recommandé). Le fichier est ignoré par Git pour protéger votre identité visuelle.

---

## 📂 Structure

```text
.
├── bboard.sh        # Gestionnaire CLI
├── scripts/         # Scripts d'automatisation (dev, setup…)
├── server/          # Backend Node.js + SQLite
│   └── index.js     # API Express + Socket.io
├── src/
│   ├── components/  # Sections (Home, Santé, Annuaire, Pointage…)
│   ├── ui/          # Système d'UI (provider, primitives)
│   └── utils/       # Helpers (meds, impression, garde non-sauvé…)
├── docker-compose.yml
└── nginx.conf
```

---

> [!IMPORTANT]
> **Premier démarrage** : définissez `INITIAL_ADMIN_PIN` avant tout, et gardez-le hors du dépôt Git.
