FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# robots.txt verwijst naar de sitemap van de API. Standaard de productie-API; te overschrijven met build-argument SITEMAP_URL.
ARG SITEMAP_URL=https://api.alra-led.com/sitemap.xml
RUN printf '\nSitemap: %s\n' "$SITEMAP_URL" >> /usr/share/nginx/html/robots.txt
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
