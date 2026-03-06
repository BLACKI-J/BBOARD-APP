#!/bin/bash

# ==============================================================================
# 🚀 BBOARD-APP : Script d'installation Docker UNIVERSEL
# ==============================================================================
# Supporte : Ubuntu (incluant 24.04), Debian, Kali Linux, CentOS, Fedora, RHEL
# Optimisé pour : Bare Metal, VM, Proxmox LXC
# ==============================================================================

set -e

echo "--------------------------------------------------------"
echo "  🐳 Installation de Docker & Docker Compose"
echo "--------------------------------------------------------"

# 1. Détection initiale du système
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    OS_ID=$ID
else
    echo "❌ Erreur : Impossible de détecter le système d'exploitation."
    exit 1
fi

echo "🔍 Système détecté : $OS_NAME ($OS_ID)"

# 2. Nettoyage préventif (Crucial pour Kali et Ubuntu)
echo "🧹 Nettoyage des anciennes versions et conflits..."
if [[ "$OS_ID" == "ubuntu" || "$OS_ID" == "debian" || "$OS_ID" == "kali" ]]; then
    sudo rm -f /etc/apt/sources.list.d/docker.list || true
    sudo apt-get update -qq || true
    # On supprime les paquets conflictuels rencontrés précédemment
    for pkg in docker.io docker-doc docker-compose docker-buildx docker-compose-v2 podman-docker containerd runc; do 
        sudo apt-get remove -y $pkg >/dev/null 2>&1 || true
    done
    sudo apt-get install -f -y >/dev/null 2>&1 || true
fi

# 3. Correctif de sécurité (Ubuntu 24.04 / AppArmor)
# Ce correctif empêche l'erreur "permission denied" sur les nouvelles distros
if [ -f /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
    echo "🛡️  Application du correctif de sécurité AppArmor..."
    echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns > /dev/null
    echo "kernel.apparmor_restrict_unprivileged_userns = 0" | sudo tee /etc/sysctl.d/60-apparmor-docker.conf > /dev/null
    sudo sysctl -p /etc/sysctl.d/60-apparmor-docker.conf >/dev/null 2>&1 || true
fi

# 4. Installation via le script officiel Docker (Méthode la plus stable et universelle)
echo "📥 Téléchargement et installation de Docker officiel..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh > /dev/null
rm get-docker.sh

# 5. Installation du plugin Docker Compose V2 (si non présent via get.docker.com)
if ! docker compose version >/dev/null 2>&1; then
    echo "🛠️  Installation manuelle du plugin Docker Compose..."
    if [[ "$OS_ID" == "ubuntu" || "$OS_ID" == "debian" || "$OS_ID" == "kali" ]]; then
        sudo apt-get update -qq
        sudo apt-get install -y docker-compose-plugin > /dev/null
    fi
fi

# 6. Configuration des permissions (Groupe Docker)
if ! getent group docker > /dev/null; then
    sudo groupadd docker
fi
sudo usermod -aG docker $USER

# 7. Finalisation
echo "--------------------------------------------------------"
echo "✅ Installation réussie !"
echo "--------------------------------------------------------"
echo "ℹ️  Note pour Proxmox LXC :"
echo "   Si vous êtes sur Proxmox LXC, n'oubliez pas d'activer"
echo "   l'option [Nesting] dans les 'Features' du conteneur."
echo ""
echo "⚠️  IMPORTANT : Tapez 'newgrp docker' ou reconnectez-vous"
echo "   pour utiliser 'docker' sans sudo."
echo ""
echo "🚀 Pour lancer le projet :"
echo "   docker compose up -d --build"
echo "--------------------------------------------------------"
