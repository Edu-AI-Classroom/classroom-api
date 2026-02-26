# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install ALL deps (including devDeps for build)
RUN pnpm install --frozen-lockfile


# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy installed deps
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build Nx app
RUN pnpm exec nx build classroom-api --prod


# ==========================================
# Stage 3: Runner (Final Image)
# ==========================================
FROM node:22-alpine AS runner

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules (already contains generated Prisma client)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/apps/classroom-api/main.js"]