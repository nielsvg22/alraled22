FROM node:20-slim

WORKDIR /workspace

COPY crm-backend/package.json crm-backend/package-lock.json* ./
RUN npm ci

COPY crm-backend/ .
RUN npm run build

EXPOSE 3001

CMD sh -c "npx drizzle-kit push 2>&1 || true && node dist/index.js"
