# ----------------------------------------------------
# Stage 1: Base Environment
# ----------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ----------------------------------------------------
# Stage 2: Development (Hot-Reloading with Vite)
# ----------------------------------------------------
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ----------------------------------------------------
# Stage 3: Production Build
# ----------------------------------------------------
FROM base AS build
RUN npm ci

# Allow configuring backend API base URL at build time
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ----------------------------------------------------
# Stage 4: Production Image (Nginx Alpine)
# ----------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx static html files
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint probe
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
