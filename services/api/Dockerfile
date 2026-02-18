# Multi-stage build for API service
FROM mcr.microsoft.com/azurelinux/base/nodejs:20 AS builder

WORKDIR /build
COPY package*.json ./
RUN npm install && npm cache clean --force

FROM mcr.microsoft.com/azurelinux/base/nodejs:20

WORKDIR /app

# Install dumb-init for proper process management (binary from GitHub, not in tdnf repos)
RUN curl -fsSL -o /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
    chmod +x /usr/local/bin/dumb-init

# Copy built dependencies from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy application source
COPY . .

# Create non-root user (shadow-utils provides groupadd/useradd on Azure Linux)
RUN tdnf install -y shadow-utils && tdnf clean all && \
    groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
