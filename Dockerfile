# syntax=docker/dockerfile:1

# ---- Étape 1 : build de l'application Angular ------------------------------
# Le dataset D3FEND est versionné dans public/data : aucun accès réseau externe requis.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ---- Étape 2 : nginx non-root (uid 101), port 8080 ---------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS serve

COPY --from=build /app/dist/d3fend-navigator/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# hors de conf.d/, dont les *.conf sont chargés automatiquement
COPY security-headers.conf /etc/nginx/security-headers.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
