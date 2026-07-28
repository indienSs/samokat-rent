# === Frontend image ===
# Multi-stage: build SPA -> раздаём статику через nginx, проксируя /api и /events.

# 1) Сборка
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# В docker-режиме API и WS ходят через nginx (относительные пути).
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/events
RUN npm run build

# 2) Runtime
FROM nginx:alpine AS runtime

# Кастомная конфигурация: SPA-fallback + прокси на backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
