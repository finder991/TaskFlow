# ---- Builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Версію npm фіксуємо, щоб резолвінг optional-залежностей збігався з lock-файлом.
RUN npm install -g npm@11

COPY package*.json ./
RUN npm ci

COPY . .

# Базові URL для API/WS вшиваються під час білду (за замовчуванням — відносні, через nginx-проксі).
ARG VITE_API_URL=/api
ARG VITE_WS_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ---- Runner (nginx) ----
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
