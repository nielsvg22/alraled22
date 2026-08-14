FROM node:20-slim

WORKDIR /workspace

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
