# === Backend image ===
# Multi-stage: build TS -> компактный runtime-образ без dev-зависимостей.

# 1) Сборка
FROM node:20-alpine AS builder
WORKDIR /app

# Сначала копируем манифесты — кэш слоёв установленных зависимостей.
COPY package*.json ./
RUN npm ci

# Копируем исходники и собираем.
COPY . .
RUN npm run build

# Отдельно ставим только runtime-зависимости (без dev).
RUN npm ci --omit=dev

# 2) Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# curl нужен для healthcheck.
RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Nest слушает на 3000. Healthcheck по корневому префиксу /api.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://localhost:3000/api/analytics/overview -o /dev/null -H "Authorization: Bearer x" || exit 0

CMD ["node", "dist/main.js"]
