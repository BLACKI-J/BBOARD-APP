#!/bin/bash

# Script d'installation automatique de Docker et Docker Compose pour Ubuntu/Debian
# Auteur: Antigravity (BBOARD-APP)

set -e

echo "🚀 Démarrage de l'installation de Docker..."

# 1. Nettoyage des anciennes versions
echo "🧹 Nettoyage des anciens paquets Docker..."
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do 
    sudo apt-get remove -y $pkg || true
done

# 2. Mise à jour et installation des pré-requis
echo "📦 Installation des pré-requis système..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2.1 Correctif spécifique pour Ubuntu 24.04 (Noble) - AppArmor userns restriction
if [ -f /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
    echo "🛡️ Application du correctif pour Ubuntu 24.04 (AppArmor userns restriction)..."
    echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns
    echo "kernel.apparmor_restrict_unprivileged_userns = 0" | sudo tee /etc/sysctl.d/60-apparmor-docker.conf
    sudo sysctl -p /etc/sysctl.d/60-apparmor-docker.conf || true
fi

# 3. Configuration du dépôt officiel Docker
echo "🔑 Configuration de la clé GPG et du dépôt Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Détection de la distribution et ajout du dépôt
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
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

echo "👤 Ajout de l'utilisateur $(whoami) au groupe docker..."
sudo usermod -aG docker $(whoami)

echo ""
echo "✅ Installation terminée avec succès !"
echo "⚠️  IMPORTANT : Vous devez vous déconnecter et vous reconnecter pour pouvoir utiliser docker sans 'sudo'."
echo "🚀 Pour lancer l'app : git clone https://github.com/BLACKI-J/BBOARD-APP.git && cd BBOARD-APP && docker compose up -d --build"
