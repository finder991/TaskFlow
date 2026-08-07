# ---- Builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# openssl потрібен Prisma; python/make/g++ — для нативної збірки bcrypt.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Версію npm фіксуємо, щоб резолвінг optional-залежностей збігався з lock-файлом
# (образ node:22 постачається з npm 10, а lock згенеровано npm 11).
RUN npm install -g npm@11

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://taskflow:taskflow_secret@localhost:5432/taskflow?schema=public"
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Прибираємо dev-залежності (prisma лишається — вона в dependencies).
RUN npm prune --omit=dev

# ---- Runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Образ node постачається з непривілейованим користувачем `node` — працюємо під ним,
# щоб процес у контейнері не мав прав root.
RUN chown -R node:node /app
USER node

EXPOSE 8080

# Збірка включає prisma/seed.ts, тому точка входу — dist/src/main.js.
# migrate deploy + старт задаються у docker-compose (command).
CMD ["node", "dist/src/main.js"]
