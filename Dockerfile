FROM node:20-slim

WORKDIR /workspace

COPY crm-backend/package.json crm-backend/package-lock.json* ./
RUN npm ci

COPY crm-backend/ .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
