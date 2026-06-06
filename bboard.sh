#!/bin/bash

# ==============================================================================
# BBOARD-APP : Gestionnaire de Projet (CLI)
# ==============================================================================

set -e

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Aide / Usage
usage() {
    echo -e "${BLUE}Usage:${NC} bash bboard.sh [commande]"
    echo ""
    echo -e "${YELLOW}Commandes disponibles :${NC}"
    echo "  setup    - Configuration initiale (Dépendances, .env, Docker)"
    echo "  dev      - Lancer l'environnement de développement local"
    echo "  up       - Déployer l'application via Docker Compose"
    echo "  update   - Mettre à jour le projet (Git pull + Rebuild)"
    echo "  down     - Arrêter tous les services (Local et Docker)"
    echo "  logs     - Afficher les logs du backend"
    echo "  help     - Afficher cette aide"
    echo ""
}

# --- PRÉ-VOL : vérifie .env + PIN avant tout déploiement Docker ---
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}✗ Fichier .env manquant.${NC} Lancez d'abord : ${YELLOW}bash bboard.sh setup${NC}"
        exit 1
    fi
    PIN=$(grep -E '^INITIAL_ADMIN_PIN=' .env | head -1 | cut -d= -f2- | tr -d " \"'")
    if ! echo "$PIN" | grep -Eq '^[0-9]{4}$'; then
        echo -e "${RED}✗ INITIAL_ADMIN_PIN invalide dans .env${NC} (4 chiffres requis)."
        echo -e "${YELLOW}  → Éditez .env : INITIAL_ADMIN_PIN=1234 (votre code à 4 chiffres).${NC}"
        echo -e "${YELLOW}  Sans PIN valide, le backend refuse de démarrer (erreur 502 sur /api).${NC}"
        exit 1
    fi
}

# --- COMMANDES ---

case "$1" in
    setup)
        echo -e "${BLUE}=== Configuration Initiale ===${NC}"
        bash scripts/setup.sh
        echo ""
        echo -e "${YELLOW}Souhaitez-vous installer Docker ? (y/n)${NC}"
        read -r install_docker
        if [[ "$install_docker" =~ ^[Yy]$ ]]; then
            bash scripts/install_docker.sh
        fi
        echo -e "${GREEN}Configuration terminée !${NC}"
        ;;

    dev)
        echo -e "${BLUE}=== Lancement Mode Développement ===${NC}"
        bash scripts/dev.sh
        ;;

    up)
        echo -e "${BLUE}=== Déploiement Docker ===${NC}"
        check_env
        docker compose up -d --build
        echo -e "${GREEN}Application déployée sur http://localhost:8080${NC}"
        echo -e "${YELLOW}Vérifier le backend : docker logs bboard-backend${NC}"
        ;;

    update)
        echo -e "${BLUE}=== Mise à jour du Projet ===${NC}"
        echo -e "${YELLOW}Récupération du code...${NC}"
        git pull origin main
        echo -e "${YELLOW}Mise à jour des dépendances...${NC}"
        if command -v npm >/dev/null 2>&1; then
            npm run install:all
        else
            echo -e "${YELLOW}Note: npm non trouvé sur l'hôte, saut de l'installation des dépendances locales.${NC}"
        fi
        
        if [ -f "docker-compose.yml" ] && [ "$(docker ps -q -f name=bboard-backend)" ]; then
            echo -e "${YELLOW}Redémarrage des conteneurs Docker...${NC}"
            check_env
            docker compose up -d --build
        fi
        
        echo -e "${GREEN}Mise à jour terminée avec succès !${NC}"
        echo -e "${YELLOW}Note: Vos données dans server/data/ ont été préservées.${NC}"
        ;;

    down)
        echo -e "${BLUE}=== Arrêt des Services ===${NC}"
        # Docker down
        docker compose down 2>/dev/null || true
        # Local cleanup
        L3001=$(lsof -ti :3001 2>/dev/null) || true
        L5173=$(lsof -ti :5173 2>/dev/null) || true
        [ ! -z "$L3001" ] && kill -9 $L3001 2>/dev/null || true
        [ ! -z "$L5173" ] && kill -9 $L5173 2>/dev/null || true
        echo -e "${GREEN}Tous les services sont arrêtés.${NC}"
        ;;

    logs)
        if [ -f server/backend.log ]; then
            tail -f server/backend.log
        else
            docker compose logs -f
        fi
        ;;

    help|*)
        usage
        ;;
esac
