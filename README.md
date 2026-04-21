# BBOARD 🚀

BBOARD est une application web métier moderne conçue pour la gestion complète des **Centres de Vacances et Séjours**. Elle centralise le suivi des participants, la planification des activités, la logistique et la sécurité des mineurs.

---

## 🛠️ Architecture & Fonctionnement

L'application repose sur une stack robuste et légère :

1.  **Frontend (React/Vite)** : Interface réactive avec mode "Résilience" (gestion avancée des déconnexions).
2.  **Backend (Node.js/Express)** : Serveur API gérant la logique métier et la synchronisation en temps réel via Socket.io.
3.  **Persistance (SQLite)** : Base de données locale située dans `server/data/database.sqlite`. Sa portabilité permet des sauvegardes simplifiées par copier-coller.

### 🔒 Sécurité & Authentification
L'accès est protégé par un système de profils avec **Code PIN à 4 chiffres**.
- **Profil "Direction Générale"** : Créé par défaut au premier lancement.
- **Code PIN par défaut** : `1234` (pour la Direction et les nouveaux profils).
- **Modification** : Les codes PIN et les autorisations se gèrent dans l'onglet **Paramètres > Sécurité**.

---

## 🚀 Installation Rapide (Setup)

Pour une installation automatisée et sans erreur, utilisez le script de configuration :

```bash
# 1. Cloner le dépôt
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP

# 2. Lancer l'assistant de configuration
bash setup.sh
```

> [!TIP]
> Le script `setup.sh` se charge d'installer les dépendances, de créer votre fichier `.env` et de préparer les répertoires nécessaires.

---

## 🌍 Exposition & Domaines Personnalisés

Si vous déployez BBOARD sur un serveur exposé via un **domaine personnalisé** ou un **tunnel (Cloudflare Tunnel, Ngrok, etc.)**, vous devez configurer la politique CORS pour éviter les blocages.

### Configuration du `.env`
Modifiez la variable `ALLOWED_ORIGINS` dans votre fichier `.env` :

```env
# Séparez les URLs par des virgules sans espaces
ALLOWED_ORIGINS=https://votre-domaine.com,https://bboard.monreseau.fr
```

### Pourquoi est-ce nécessaire ?
Par mesure de sécurité, le serveur backend rejette les requêtes provenant d'origines inconnues. Sans cette configuration, vous pourriez voir des erreurs "CORS Blocked" ou un indicateur de serveur "Non disponible" sur la page de connexion.

---

## 🤖 Configuration de l'Intelligence Artificielle

BBOARD utilise des services d'IA (Groq et HuggingFace) pour certaines fonctionnalités (aide à l'écriture, analyse, etc.).

### Ajout des clés API
Modifiez votre fichier `.env` pour y insérer vos clés personnelles :

```env
# API Groq (Recommandé pour la rapidité)
GROQ_API_KEY=votre_cle_groq_ici
GROQ_MODEL=llama-3.1-8b-instant

# API HuggingFace (Optionnel)
HUGGINGFACE_API_KEY=votre_cle_hf_ici
```

> [!NOTE]
> Vous pouvez obtenir une clé gratuite sur [Groq Cloud](https://console.groq.com/) et [Hugging Face](https://huggingface.co/settings/tokens).

---

## 💻 Déploiement Production (Docker)

Méthode recommandée pour la stabilité et la facilité de mise à jour.

1. **Installer Docker** (si besoin via notre script) :
   ```bash
   bash install_docker.sh
   ```
2. **Lancer l'application** (Port par défaut : 8080) :
   ```bash
   docker compose up -d --build
   ```

### 🔄 Mises à jour
Pour récupérer les dernières fonctionnalités sans perdre vos données :
```bash
git pull origin main
docker compose up -d --build
```

---

## 👨‍💻 Environnement de Développement (Local)

Pour travailler sur le code source localement :

1. Assurez-vous d'avoir Node.js installé.
2. Lancez l'environnement de développement :
   ```bash
   bash dev.sh
   ```
- **Client** : `http://localhost:5173`
- **Serveur API** : `http://localhost:3001`

---

## 🎨 Personnalisation du Logo

1. Remplacez le fichier `public/logo/logo.png` par votre propre logo PNG.
2. Reconstruisez l'application (Docker ou local) pour appliquer le changement sur tous les supports.

---

> [!IMPORTANT]
> **Dashboard de Santé** : Un indicateur visuel en bas à gauche de l'écran de connexion vous permet de vérifier en temps réel si le client communique correctement avec le serveur backend.
