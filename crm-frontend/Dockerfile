FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_API_URL
ARG VITE_API_BASE=/api
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
