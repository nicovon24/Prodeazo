# PRODEAZO FRONTEND

## Purpose

This `frontend/` folder contains the Next.js application for Prodeazo, a World Cup 2026 predictions product.
Work in this directory should assume the focus is the frontend app: landing page, auth flows, fixture/prediction screens, shared app providers, styling, state, and browser-facing data integration.

The current product direction is:

- Build a polished World Cup 2026 predictions experience first.
- Prioritize prediction workflows, rankings, groups/minileagues, and football-centric UI.
- Keep the app visually strong, simple to scan, and mobile-aware.

## Current Frontend Stack

### Stack Installed

| Category   | Package                                  | Version                |
| ---------- | ---------------------------------------- | ---------------------- |
| Framework  | `next`                                   | ^16.2.4                |
| CSS        | `tailwindcss`                            | ^4.2.4 (v4, CSS-first) |
| CSS Build  | `@tailwindcss/postcss`                   | ^4.2.4                 |
| UI Library | `@heroui/react` + `@heroui/styles`       | ^3.0.3                 |
| Animation  | `framer-motion`                          | ^12.38.0               |
| State      | `zustand`                                | ^5.0.13                |
| Data       | `@tanstack/react-query`                  | ^5.100.9               |
| Charts     | `recharts`                               | ^3.8.1                 |
| Validation | `zod`                                    | ^4.4.3                 |
| Icons      | `lucide-react`                           | ^1.14.0                |
| API/Auth   | HTTP API client + cookie session         | Express backend        |

Also present in the app:

- `react` 19.2.5
- `react-dom` 19.2.5
- `typescript` ~6.0.2
- `date-fns`
- `clsx`
- `tailwind-merge`
- `@internationalized/date`

## Architecture Notes

- Framework: Next.js App Router.
- Rendering model: server-first by default, client components only when interaction requires them.
- Styling: Tailwind CSS v4 via CSS-first setup in `src/app/globals.css`.
- UI primitives: HeroUI is installed and should be preferred when it fits the existing UI direction.
- Icons: use `lucide-react`.
- State: use Zustand for app-level client state when shared state is genuinely needed.
- Server/cache/data fetching: prefer React Query for browser data workflows.
- Validation: use Zod for input and payload schemas.
- Auth/backend integration: use the Express backend documented in `.planning/backend-context/`.
- Sessions are cookie-based (`connect.sid`), so browser requests must include credentials.
- API responses for collection GET endpoints use `{ count, next, previous, results }`.

## Scripts

- `npm run dev` - start local Next dev server
- `npm run build` - production build check
- `npm run start` - run built app
- `npm run lint` - Next lint

## Repository Shape

Current important folders/files in this frontend:

- `src/app/` - App Router pages, layouts, route groups, and global app entrypoints.
- `src/app/layout.tsx` - root HTML/body shell.
- `src/app/page.tsx` - current landing page.
- `src/app/globals.css` - Tailwind imports, theme tokens, global selection styling, and utility classes.
- `src/app/providers.tsx` - app-wide providers.
- `src/store/` - Zustand stores.
- `src/hooks/` - custom hooks.
- `src/context/` - React context where needed.
- `src/api/client.ts` - frontend API client utilities.
- `public/` - static assets such as logos and icons.
- `.planning/` - local planning docs with product context and implementation notes.
- `README.md` - local frontend readme.

## Visual System

This project already has custom theme colors defined in Tailwind/global CSS and they should be reused instead of inventing slightly-different greens/reds/blues.

### Custom Colors

| Token | Value | Meaning |
| ----- | ----- | ------- |
| `--color-primary` | `#AFE805` | bright lime / main highlight |
| `--color-secondary` | `#033F2D` | deep green / dark contrast |
| `--color-tertiary-blue` | `#001AAC` | strong blue accent |
| `--color-tertiary-red` | `#D50204` | strong red accent |
| `--color-green-normal` | `#00CE17` | vivid mid green for text accents |

### Typography

The project uses a combination of a bold, sporty font for branding and a modern, high-legibility font for UI.

| Role | Font Family | Weight | Tracking | Case |
| ---- | ----------- | ------ | -------- | ---- |
| **Display / Logo / Titles** | Montserrat | Black (900) | `-0.06em` | Uppercase |
| **All UI / Content** | Geist Sans | Variable (300-900) | Normal | Mixed |

Tokens:
- `font-sans`: Geist Sans
- `font-display`: Montserrat

### Existing Utility Classes

- `.text-primary`
- `.bg-primary`
- `.border-primary/40`
- `.text-primary/70`
- `.text-green-normal`

### Selection Styling

Global text selection is intentionally customized:

- selection background: `--color-primary`
- selection text color: `--color-secondary`

This is defined in `src/app/globals.css` with:

- `*::selection`
- `*::-moz-selection`

## Frontend Working Rules

- Preserve the existing visual language of the landing unless a task explicitly asks for a redesign.
- Keep the football/product identity strong: bold contrast, dark surfaces, lime/green accents, and tournament-forward messaging.
- Prefer editing existing route files and utilities over creating new abstractions too early.
- Do not introduce a separate frontend state library beyond what is already installed.
- Do not invent another styling system. Stay with Tailwind v4 + existing global tokens.
- Use client components only when hooks, browser APIs, or interactivity require them.
- Be careful with hydration: avoid `Date.now()`, random values, and locale-sensitive rendering directly inside SSR output unless handled intentionally.
- For static assets in `public/`, prefer fixing sizing through the asset `viewBox` or the component layout before adding hacky CSS transforms.

## App Router Notes

- New pages should live under `src/app/`.
- Route groups such as `(auth)` and `(main)` are already in use and should be preserved when extending flows.
- Shared providers should stay centralized in `src/app/providers.tsx`.
- Global shell concerns belong in `src/app/layout.tsx` and `src/app/globals.css`.

## Data and Product Notes

Use the local planning docs as context when implementing product-facing features:

- `.planning/backend-context/README.md`
- `.planning/backend-context/DATABASE.md`
- `.planning/README.md`
- `.planning/ImplementationPlan.md`
- `.planning/manual-tasks.md`
- `../README.md`

Product assumptions currently visible in the app/planning:

- This is a predictions app for World Cup 2026.
- Core flows include auth, fixture viewing, predictions, rankings, and group competition.
- The landing page is marketing-light and product-first, not a generic SaaS homepage.

## Practical Guidance for Future AI Tasks

- When changing the landing, check `src/app/page.tsx` first because the current hero and decorative composition live there.
- When touching visual tokens, check `src/app/globals.css` before adding hardcoded colors.
- When adding shared client state, inspect `src/store/` before creating a new store.
- When wiring API calls, extend `src/api/client.ts` or existing hooks/stores rather than scattering fetch logic everywhere.
- When reading backend collections, unwrap the paginated `results` array instead of assuming the response is an array.
- When working with logos or SVGs in `public/`, verify whether the whitespace problem is inside the asset `viewBox` before trying to solve it only with CSS.
- When changing SSR-rendered UI, watch for hydration mismatch risks from browser extensions, locale output, or client-only values.

## Avoid

- Do not describe this frontend as Vite-based. It is now Next.js.
- Do not document or assume a separate Express backend inside this folder.
- Do not add broad architectural claims that are not present in the current codebase.
- Do not replace the existing theme tokens with ad hoc one-off colors.
