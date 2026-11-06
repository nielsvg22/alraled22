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
# robots.txt verwijst naar de sitemap van de API waarmee gebouwd is (geen vast adres in de code)
ARG REACT_APP_API_URL
RUN if [ -n "$REACT_APP_API_URL" ]; then printf '\nSitemap: %s/sitemap.xml\n' "$REACT_APP_API_URL" >> /usr/share/nginx/html/robots.txt; fi
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
