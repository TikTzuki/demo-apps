# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files + prisma schema (needed by postinstall)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies (postinstall runs prisma generate)
RUN npm i

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client + migration files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./app/node_modules/@prisma

# Install prisma CLI with all its dependencies for migrate deploy
RUN npm install prisma --save-dev --ignore-scripts

# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Ensure nextjs user can write to prisma engines (needed for migrate deploy)
RUN chown -R nextjs:nodejs node_modules/@prisma node_modules/.prisma

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["sh", "entrypoint.sh"]
