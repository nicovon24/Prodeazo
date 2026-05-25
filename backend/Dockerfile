FROM node:20-alpine AS builder

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/tsconfig.json backend/drizzle.config.ts ./backend/

COPY backend/src ./backend/src/

COPY backend/drizzle ./backend/drizzle/

RUN pnpm --filter backend run build

WORKDIR /repo/backend

# ─── runner ──────────────────────────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --prod --filter backend...

COPY --from=builder /repo/backend/dist ./backend/dist

WORKDIR /repo/backend

EXPOSE 4000

CMD ["node", "dist/index.js"]
