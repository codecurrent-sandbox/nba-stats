# Multi-stage build for API service
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper process management
RUN apk add --no-cache dumb-init

# Copy built dependencies from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy application source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
