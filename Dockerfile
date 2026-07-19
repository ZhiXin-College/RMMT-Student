FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Leave VITE_API_URL empty so the SPA calls same-origin /api via reverse proxy
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build || npx vite build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
