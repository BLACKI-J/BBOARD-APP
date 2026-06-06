FROM node:20

WORKDIR /app

# Outils de build pour compiler les modules natifs (sqlite3) DANS l'image,
# contre sa propre GLIBC. Évite l'erreur "GLIBC_2.38 not found" causée par
# un binaire prébuilt compilé sur un système plus récent.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Force la compilation depuis les sources (pas de prébuilt incompatible)
ENV npm_config_build_from_source=true
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
