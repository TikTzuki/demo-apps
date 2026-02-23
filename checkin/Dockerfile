FROM node:20-alpine AS base

# --- Builder stage ---
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

COPY public/ ./public/
COPY src/ ./src/
COPY next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production stage ---
FROM base AS app
RUN apk add --no-cache tini

WORKDIR /app

COPY --from=builder --chown=node /app/node_modules ./node_modules
COPY --from=builder --chown=node /app/.next/standalone ./
COPY --from=builder --chown=node /app/.next/static ./.next/static
COPY --from=builder --chown=node /app/prisma ./prisma
COPY --from=builder --chown=node /app/prisma.config.ts ./
COPY --from=builder --chown=node /app/public ./public
COPY --from=builder --chown=node /app/next.config.js ./

RUN npm install --global --save-exact \
  "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

COPY --chown=node entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV CHECKPOINT_DISABLE=1
ENV DISABLE_PRISMA_TELEMETRY=true
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
USER node

ENTRYPOINT ["entrypoint.sh"]
