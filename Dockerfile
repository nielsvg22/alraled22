FROM node:20-slim

WORKDIR /workspace

COPY crm-backend/package.json crm-backend/package-lock.json* ./
RUN npm ci --include=dev

COPY crm-backend/ .
RUN npm run build

EXPOSE 3001

# De schema-sync mag het opstarten nooit blokkeren: stdin dicht (geen vragen) en maximaal 120 seconden
CMD ["sh", "-c", "timeout 120 npx drizzle-kit push </dev/null 2>/dev/null; node dist/index.js"]
