# ──────────────────────────────────────────────────────────────

# Frontend Dockerfile — Multi-Stage Build (Node → Nginx)
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build the React application ─────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the production bundle → outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:alpine

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
