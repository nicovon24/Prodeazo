# Build context: backend/ (Render Root Directory = backend, or docker compose context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# bcrypt native bindings
RUN apk add --no-cache python3 make g++

COPY package.json tsconfig.json drizzle.config.ts ./
RUN npm install

COPY src ./src/
COPY drizzle ./drizzle/

RUN npm run build && npm prune --omit=dev

# ─── runner ──────────────────────────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
