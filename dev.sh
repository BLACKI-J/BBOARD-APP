#!/bin/bash

# Script de développement pour BBOARD

echo "--------------------------------------------------------"
echo "Lancement du mode développement..."
echo "--------------------------------------------------------"

echo "Libération des ports 3001 et 5173..."
if command -v fuser >/dev/null 2>&1; then
    fuser -k 3001/tcp 2>/dev/null || true
    fuser -k 5173/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
    lsof -ti:3001,5173 | xargs kill -9 2>/dev/null || true
else
    echo "Note : Ni 'fuser' ni 'lsof' n'ont été trouvés. Les ports ne peuvent pas être libérés automatiquement."
fi

echo "Nettoyage des anciens conteneurs..."
docker rm -f bboard-dev 2>/dev/null || true

# Lancement du backend en arrière-plan
echo "Démarrage du Backend (port 3001)..."
cd server
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!

# Lancement du frontend
echo "Démarrage du Frontend (port 5173)..."
cd ..
npm run dev

# Fermeture propre
echo "Arrêt des services..."
kill $BACKEND_PID
echo "Mode développement arrêté."
