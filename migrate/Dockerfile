FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm ci
COPY migrate.js ./
CMD ["node", "migrate.js"]
