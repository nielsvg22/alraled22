FROM node:20-slim

RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY crm-backend/package.json crm-backend/package-lock.json* ./
RUN npm ci

COPY crm-backend/ .
RUN npm run build

EXPOSE 3001

CMD ["./start.sh"]
