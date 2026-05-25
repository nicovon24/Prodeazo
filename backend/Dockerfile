# Build context: backend/ (Render Root Directory = backend, or docker compose context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# bcrypt native bindings
RUN apk add --no-cache python3 make g++

COPY package.json tsconfig.json drizzle.config.ts ./
RUN npm install

COPY src ./src/
COPY drizzle ./drizzle/

RUN npm run build

# ─── migrator ────────────────────────────────────────────────────────────────
# Keeps devDependencies (drizzle-kit) so db:push can run
FROM builder AS migrator

# ─── pruner ──────────────────────────────────────────────────────────────────
FROM builder AS pruner
RUN npm prune --omit=dev

# ─── runner ──────────────────────────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=pruner /app/package.json ./
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/dist ./dist

EXPOSE 4000

CMD ["node", "--dns-result-order=ipv4first", "dist/index.js"]
