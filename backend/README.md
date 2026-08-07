# TaskFlow — Backend

NestJS + PostgreSQL + Prisma. JWT (access + refresh), WebSocket (socket.io), Redis + BullMQ.

```bash
npm install
npx prisma migrate deploy   # застосувати міграції
npm run prisma:seed         # опційно: демо-дані
npm run start:dev           # http://localhost:8080 (Swagger: /api/docs)
npm test                    # unit-тести
npm run test:e2e            # e2e (потрібна PostgreSQL)
npm run openapi:export      # згенерувати openapi.json
```

Змінні оточення — див. [`.env.example`](../.env.example). Повна документація — у
[кореневому README](../README.md).
