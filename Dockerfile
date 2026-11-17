# syntax=docker/dockerfile:1

# Images de base épinglées par digest (reproductibilité, protection contre un tag
# réécrit). À mettre à jour régulièrement (Renovate / Dependabot savent le faire).
ARG NODE_IMAGE=node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

# ---- Étape 1 : build de l'application Angular ------------------------------
# Le dataset D3FEND est versionné dans public/data : aucun accès réseau externe requis.
FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts : aucun script d'installation de dépendance n'est exécuté
# (vecteur classique d'attaque supply chain) ; les binaires natifs nécessaires
# (esbuild, lmdb…) sont fournis précompilés via les optionalDependencies.
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
# chmod : rend le contenu lisible par nginx (uid 101) quel que soit l'umask de
# l'hôte, sans jamais le rendre inscriptible par autre que root.
RUN npx ng build --configuration production \
 && chmod -R u=rwX,go=rX dist

# ---- Étape 2 : nginx non-root (uid 101), port 8080 ---------------------------
FROM ${NGINX_IMAGE} AS serve

USER root
# Réduction de la surface d'attaque : pas de gestionnaire de paquets, pas de
# scripts d'entrypoint (envsubst, réécriture de config…), pas de contenu par défaut.
RUN apk --no-cache --purge del apk-tools \
 && rm -rf /docker-entrypoint.sh /docker-entrypoint.d \
           /etc/nginx/conf.d /usr/share/nginx/html/* \
           /var/cache/apk /lib/apk

# Fichiers possédés par root et en lecture seule pour nginx : un processus nginx
# compromis ne peut modifier ni sa configuration ni le contenu servi.
COPY --from=build --chown=root:root /app/dist/d3fend-navigator/browser /usr/share/nginx/html
COPY --chown=root:root --chmod=644 nginx.conf /etc/nginx/nginx.conf
COPY --chown=root:root --chmod=644 security-headers.conf /etc/nginx/security-headers.conf

USER 101:101

EXPOSE 8080
STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1

ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
