#!/bin/bash

# Script pour lancer le mode développement instantané (HMR)
# Frontend sur port 5173, Backend sur port 3001

echo "🚀 Lancement du mode développement..."

# Kill potential existing processes (FORCE)
echo "🔒 Libération des ports 3001 et 5173..."
echo "root" | sudo -S fuser -k 3001/tcp 2>/dev/null
echo "root" | sudo -S fuser -k 5173/tcp 2>/dev/null

# Clean up any leftover Docker containers that might use the ports
echo "🧹 Nettoyage des anciens conteneurs..."
echo "root" | sudo -S docker stop bboard-frontend bboard-backend 2>/dev/null
echo "root" | sudo -S docker rm bboard-frontend bboard-backend 2>/dev/null

# Store the base directory
BASE_DIR=$(pwd)

# Active the backend
echo "📦 Démarrage du Backend (port 3001)..."
cd "$BASE_DIR/server" && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Active the frontend
echo "💻 Démarrage du Frontend (port 5173)..."
cd "$BASE_DIR" && npm run dev

# When frontend stops, kill backend
kill $BACKEND_PID
echo "✅ Mode développement arrêté."
