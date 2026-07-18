# ──────────────────────────────────────────────────────────────
# Frontend Dockerfile — Multi-Stage Build (Node → Nginx)
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build the React application ─────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Vite embeds these at build time
ARG VITE_API_BASE_URL=
ARG VITE_WS_BASE_URL=
ARG VITE_CLERK_PUBLISHABLE_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_BASE_URL=$VITE_WS_BASE_URL \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the production bundle → outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve with Nginx (non-root) ─────────────────────
FROM nginx:alpine

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (listens on 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Allow unprivileged nginx user to write pid/cache and read html
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid \
    && sed -i 's|^pid\s\+.*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && sed -i 's/user\s\+nginx;/# user nginx;/' /etc/nginx/nginx.conf

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
