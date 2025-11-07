# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Accept build argument for API URL (optional)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /build
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Ensure Vite picks up the runtime API endpoint during the production build when supplied
RUN if [ -n "$VITE_API_URL" ]; then echo "VITE_API_URL=$VITE_API_URL" > .env.production; fi
RUN npm run build

# Production stage with nginx
FROM nginx:1.25-alpine

WORKDIR /usr/share/nginx/html

# Copy built app from builder
COPY --from=builder /build/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user (nginx already runs as non-root by default in Alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
