#!/bin/bash

# ==============================================================================
# BBOARD-APP : Script de configuration initiale (Setup)
# ==============================================================================

set -e

echo "--------------------------------------------------------"
# shellcheck disable=SC2028
echo "  🚀 Configuration de BBOARD-APP"
echo "--------------------------------------------------------"

# 1. Gestion du fichier .env
if [ ! -f .env ]; then
    echo "📄 Création du fichier .env à partir de .env.example..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Pensez à y ajouter vos clés API réelles."
else
    echo "✅ Fichier .env déjà présent."
fi

# 2. Vérification des clés API
if grep -q "your_api_key_here" .env; then
    echo "⚠️  ATTENTION : Des clés API par défaut ('your_api_key_here') sont détectées dans votre .env."
    echo "   Certaines fonctionnalités IA risquent de ne pas fonctionner."
fi

# 3. Installation des dépendances (Optionnel sur l'hôte)
if command -v npm >/dev/null 2>&1; then
    echo "📦 Installation des dépendances (Racine + Serveur)..."
    npm run install:all
else
    echo "⚠️  Note: npm non trouvé sur l'hôte. L'installation locale est sautée."
    echo "   Cela n'est pas gênant si vous utilisez Docker pour faire tourner le projet."
fi

# 4. Préparation du dossier de données
echo "📁 Vérification du dossier de données..."
mkdir -p server/data
chmod 777 server/data

# 5. Fin
echo "--------------------------------------------------------"
echo "✅ Configuration terminée avec succès !"
echo "--------------------------------------------------------"
echo "Pour lancer le projet en mode développement :"
echo "   bash dev.sh"
echo "--------------------------------------------------------"
