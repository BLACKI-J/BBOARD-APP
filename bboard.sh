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
    echo "  update   - Mettre à jour le projet (sauvegarde auto + Git pull + Rebuild)"
    echo "  backup   - Sauvegarder la base de données maintenant"
    echo "  restore  - Restaurer la base depuis une sauvegarde (restore <fichier>)"
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

DATA_DB="server/data/database.sqlite"
APP_PORT=8080

# IP LAN de la machine (pour l'accès depuis téléphone/tablette).
lan_ip() {
    hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^(192\.168|10\.|172\.)' | head -1
}

# Affiche les URL d'accès (machine + LAN).
show_access() {
    local ip
    ip=$(lan_ip)
    echo -e "${GREEN}➜ Sur cette machine : http://localhost:${APP_PORT}${NC}"
    [ -n "$ip" ] && echo -e "${GREEN}➜ Téléphone/tablette (même WiFi) : http://${ip}:${APP_PORT}${NC}"
    echo -e "${YELLOW}  Astuce : « Ajouter à l'écran d'accueil » installe l'app (PWA).${NC}"
}

# Attend que le backend réponde 200 ; sinon donne la commande de diagnostic.
health_check() {
    echo -ne "${YELLOW}Vérification du serveur... ${NC}"
    local code
    for _ in $(seq 1 20); do
        code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/api/auth/session" 2>/dev/null || echo 000)
        [ "$code" = "200" ] && { echo -e "${GREEN}OK${NC}"; return 0; }
        sleep 1
    done
    echo -e "${RED}KO${NC}"
    echo -e "${YELLOW}  → Diagnostic : docker logs bboard-backend --tail 30${NC}"
    return 1
}

# Copie horodatée de la base (garde les 10 dernières). Sans danger si pas de base.
backup_db() {
    if [ -f "$DATA_DB" ]; then
        local ts dest
        ts=$(date +%Y%m%d_%H%M%S)
        dest="server/data/backup-${ts}.sqlite"
        cp "$DATA_DB" "$dest"
        echo -e "${GREEN}✔ Sauvegarde : ${dest}${NC}"
        ls -1t server/data/backup-*.sqlite 2>/dev/null | tail -n +11 | xargs -r rm -f
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
        health_check || true
        echo ""
        show_access
        ;;

    update)
        echo -e "${BLUE}=== Mise à jour du Projet ===${NC}"
        check_env
        # 1. Sauvegarde la base AVANT toute opération (filet de sécurité).
        backup_db
        # 2. Récupère le code (échec propre si modifications locales).
        echo -e "${YELLOW}Récupération du code...${NC}"
        if ! git pull origin main; then
            echo -e "${RED}✗ git pull a échoué (modifications locales ?).${NC}"
            echo -e "${YELLOW}  → Sauvegardez/annulez vos changements (git stash) puis relancez.${NC}"
            exit 1
        fi
        # 3. Reconstruit l'image Docker (recompile sqlite3). Marche même conteneur arrêté.
        if [ -f "docker-compose.yml" ]; then
            echo -e "${YELLOW}Reconstruction des conteneurs Docker...${NC}"
            docker compose up -d --build
            health_check || true
            echo ""
            show_access
            echo -e "${YELLOW}Pensez à recharger en vidant le cache (Ctrl+Maj+R, ou rouvrir la PWA).${NC}"
        fi
        echo -e "${GREEN}Mise à jour terminée. Données préservées (sauvegarde auto créée).${NC}"
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

    backup)
        echo -e "${BLUE}=== Sauvegarde de la base ===${NC}"
        if [ -f "$DATA_DB" ]; then
            backup_db
        else
            echo -e "${YELLOW}Aucune base à sauvegarder (${DATA_DB} introuvable).${NC}"
        fi
        ;;

    restore)
        echo -e "${BLUE}=== Restauration de la base ===${NC}"
        SRC="$2"
        if [ -z "$SRC" ]; then
            echo -e "${YELLOW}Usage : bash bboard.sh restore <fichier.sqlite>${NC}"
            echo -e "${YELLOW}Sauvegardes disponibles :${NC}"
            ls -1t server/data/backup-*.sqlite 2>/dev/null || echo "  (aucune)"
            exit 1
        fi
        if [ ! -f "$SRC" ]; then
            echo -e "${RED}✗ Fichier introuvable : ${SRC}${NC}"
            exit 1
        fi
        echo -e "${RED}Cela remplacera la base actuelle par : ${SRC}${NC}"
        echo -e "${YELLOW}Continuer ? (y/n)${NC}"
        read -r confirm_restore
        [[ "$confirm_restore" =~ ^[Yy]$ ]] || { echo "Annulé."; exit 0; }
        backup_db   # sauvegarde l'actuelle avant d'écraser
        docker compose down 2>/dev/null || true
        cp "$SRC" "$DATA_DB"
        echo -e "${GREEN}✔ Base restaurée depuis ${SRC}${NC}"
        check_env
        docker compose up -d --build
        health_check || true
        ;;

    help|*)
        usage
        ;;
esac
