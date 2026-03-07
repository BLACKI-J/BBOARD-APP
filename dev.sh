#!/bin/bash

# Script pour lancer le mode développement instantané (HMR)
# Frontend sur port 5173, Backend sur port 3001

echo "🚀 Lancement du mode développement..."

# Kill potential existing processes
fuser -k 5173/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null

# Clean up any leftover Docker containers that might use the ports
echo "🧹 Nettoyage des anciens conteneurs..."
docker stop bboard-frontend bboard-backend 2>/dev/null
docker rm bboard-frontend bboard-backend 2>/dev/null

# Active the backend
echo "📦 Démarrage du Backend (port 3001)..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Active the frontend
echo "💻 Démarrage du Frontend (port 5173)..."
cd .. && npm run dev

# When frontend stops, kill backend
kill $BACKEND_PID
echo "✅ Mode développement arrêté."
