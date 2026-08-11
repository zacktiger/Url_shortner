# ---- Dependencies + Prisma client ----------------------------------------
# Install production dependencies only, then generate the Prisma client into
# that same node_modules. Doing both in one stage means the runner gets a
# single, self-consistent node_modules instead of merged fragments.
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# The schema is needed for `prisma generate`; the prisma CLI ships as a
# regular dependency so it is still present after --omit=dev.
COPY prisma ./prisma
RUN npx prisma generate

# ---- Production image ------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# package.json must be present at runtime: it carries "type": "module", without
# which Node parses server.js as CommonJS and the top-level import throws.
COPY package.json ./
COPY server.js ./
COPY src ./src

# Run as an unprivileged user rather than root.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nodeapp \
    && chown -R nodeapp:nodejs /app
USER nodeapp

EXPOSE 5000

CMD ["node", "server.js"]
