FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Build / generate Prisma client
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY . .
RUN npx prisma generate

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY server.js ./

EXPOSE 5000

CMD ["node", "server.js"]
