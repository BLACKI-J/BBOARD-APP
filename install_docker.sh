#!/bin/bash

# Script d'installation automatique de Docker et Docker Compose
# Supporte : Ubuntu, Debian, Kali Linux
# Auteur: Antigravity (BBOARD-APP)

set -e

echo "🚀 Démarrage de l'installation de Docker..."

# Détection de la distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_LIKE=$ID_LIKE
else
    echo "❌ Impossible de détecter la distribution. /etc/os-release manquant."
    exit 1
fi

echo "🔍 Distribution détectée : $OS ($OS_LIKE)"

# Configuration des variables Docker selon la distribution
DOCKER_DISTRO="ubuntu"
DOCKER_CODENAME=$VERSION_CODENAME

if [[ "$OS" == "debian" || "$OS_LIKE" == *"debian"* || "$OS" == "kali" ]]; then
    DOCKER_DISTRO="debian"
    # Pour Kali ou les versions instables de Debian, on utilise 'bookworm' (Debian 12) comme base stable
    if [[ "$OS" == "kali" || "$VERSION_CODENAME" == "kali-rolling" || -z "$VERSION_CODENAME" ]]; then
        echo "ℹ️  Kali détecté, utilisation du dépôt Debian Bookworm comme base stable."
        DOCKER_CODENAME="bookworm"
    fi
fi

echo "📦 Utilisation du dépôt Docker : $DOCKER_DISTRO / $DOCKER_CODENAME"

# 1. Nettoyage des anciennes versions et dépôts corrompus
echo "🧹 Nettoyage des anciens paquets Docker et dépôts..."
sudo rm -f /etc/apt/sources.list.d/docker.list || true
# Suppression des paquets Kali/Debian qui provoquent des conflits de fichiers (dpkg error)
for pkg in docker.io docker-doc docker-compose docker-buildx docker-compose-v2 podman-docker containerd runc; do 
    sudo apt-get remove -y $pkg || true
done

# Réparation forcée au cas où le système est dans un état instable
sudo apt-get install -f -y || true

# 2. Mise à jour et installation des pré-requis
echo "📦 Installation des pré-requis système..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2.1 Correctif spécifique pour Ubuntu 24.04+ - AppArmor userns restriction
if [ -f /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
    echo "🛡️ Application du correctif AppArmor userns restriction..."
    echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns
    echo "kernel.apparmor_restrict_unprivileged_userns = 0" | sudo tee /etc/sysctl.d/60-apparmor-docker.conf
    sudo sysctl -p /etc/sysctl.d/60-apparmor-docker.conf || true
fi

# 3. Configuration du dépôt officiel Docker
echo "🔑 Configuration de la clé GPG et du dépôt Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/$DOCKER_DISTRO/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Ajout du dépôt Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$DOCKER_DISTRO \
  $DOCKER_CODENAME stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Installation de Docker et du plugin Compose V2
echo "🛠️ Installation de Docker Engine et Docker Compose V2..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Vérification du groupe docker
if ! getent group docker > /dev/null; then
    echo "👥 Création du groupe docker..."
    sudo groupadd docker
fi

echo "👤 Ajout de l'utilisateur $USER au groupe docker..."
sudo usermod -aG docker $USER

echo ""
echo "✅ Installation terminée avec succès !"
echo "⚠️  IMPORTANT : Vous devez peut-être redémarrer votre session pour utiliser docker sans 'sudo'."
echo "🚀 Pour lancer l'app : docker compose up -d --build"
