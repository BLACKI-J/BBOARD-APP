# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app

# Ne copier que package.json au début pour profiter du cache Docker
COPY package.json ./

# Set config to avoid hanging on some environments
RUN npm config set registry http://registry.npmjs.org/ && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set maxsockets 1 && \
    npm config set strict-ssl false && \
    npm install

# Copier le reste de l'application
COPY . .

EXPOSE 5173

# Lancer le serveur de développement Vite
CMD ["npm", "run", "dev"]
