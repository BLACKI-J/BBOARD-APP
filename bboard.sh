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
        docker compose up -d --build
        echo -e "${GREEN}Application déployée sur http://localhost:8080${NC}"
        ;;

    update)
        echo -e "${BLUE}=== Mise à jour du Projet ===${NC}"
        echo -e "${YELLOW}Récupération du code...${NC}"
        git pull origin main
        echo -e "${YELLOW}Mise à jour des dépendances...${NC}"
        npm run install:all
        
        if [ -f "docker-compose.yml" ] && [ "$(docker ps -q -f name=bboard-backend)" ]; then
            echo -e "${YELLOW}Redémarrage des conteneurs Docker...${NC}"
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
