# Guía de desarrollo — Prodeazo

Procedimiento probado en local (rama `feat/frontend`, Docker Desktop, frontend con `npm`).

---

## Requisitos

- **Node.js** v20+
- **Docker Desktop** (Postgres, Redis y backend en contenedores)
- **Git**
- Carpeta **`envs/`** con los `.env` reales del equipo (no están en el repo)

---

## 1. Clonar y cambiar de rama

```bash
git clone <repo>
cd Prodeazo
git fetch origin feat/frontend
git checkout feat/frontend
```

Para alinear el directorio con el remoto (descarta cambios locales):

```bash
git checkout -B feat/frontend origin/feat/frontend
```

---

## 2. Variables de entorno (obligatorio: copiar desde `envs/`)

Los archivos reales viven en **`envs/`**. Hay que copiarlos tal cual a donde los lee cada app:

| Origen | Destino |
|--------|---------|
| `envs/back/.env` | `backend/.env` |
| `envs/front/.env` | `frontend/.env` |

**PowerShell (desde la raíz del repo):**

```powershell
Copy-Item -Path "envs\back\.env" -Destination "backend\.env" -Force
Copy-Item -Path "envs\front\.env" -Destination "frontend\.env" -Force
```

**Reglas importantes:**

- No editar puertos ni URLs de OAuth “a mano” si no lo pide el equipo. El login con Google depende de que coincidan:
  - `NEXT_PUBLIC_API_URL` en frontend (típicamente `http://localhost:4000`)
  - URI de redirección en Google Cloud: `http://localhost:4000/api/auth/callback`
- Los `.env` en `backend/` y `frontend/` deben ser **copias exactas** de `envs/`. Si alguien te pasa envs nuevos, volvé a copiar encima.
- La carpeta `envs/` puede quedarse como respaldo local; no se commitea (está en `.gitignore` junto con `backend/.env` y `frontend/.env`).

**Comprobar que son iguales (opcional):**

```powershell
# Mismo tamaño y contenido byte a byte
(Get-FileHash "envs\back\.env").Hash -eq (Get-FileHash "backend\.env").Hash
(Get-FileHash "envs\front\.env").Hash -eq (Get-FileHash "frontend\.env").Hash
```

> **Nota sobre la base de datos:** el `DATABASE_URL` del `.env` del compañero puede apuntar a otro puerto (ej. `5433`). Docker Compose **sobrescribe** la conexión dentro de los contenedores (`5432`, host `db`). Por eso el **seed** debe correrse con Docker (ver sección 4), no con `npm run seed` en el host si tu `.env` no apunta al Postgres de Docker.

---

## 3. Instalar dependencias (frontend en el host)

En la raíz solo hay un workspace mínimo. Instalá en cada carpeta:

```bash
cd backend
npm install

cd ../frontend
npm install
```

(`pnpm` también sirve si lo tenés; en Windows muchas veces se usa `npm`.)

---

## 4. Docker: levantar infraestructura

Desde la **raíz del repo**:

```bash
docker compose up -d
```

Servicios:

| Servicio | Puerto en tu PC | Rol |
|----------|-----------------|-----|
| Postgres | 5432 | Base de datos |
| Redis | 6379 | Sesiones / caché |
| Backend | **4000** | API (`/api/...`) |
| migrate | — | Tarea única: schema (`drizzle-kit push`) |

Verificar:

```bash
docker compose ps
curl http://localhost:4000/api/health
# → {"ok":true}
```

### Reconstruir desde cero (imágenes y volúmenes viejos)

```bash
docker compose down -v --remove-orphans
docker compose build --no-cache
docker compose up -d
```

`down -v` borra la DB; después hay que volver a correr el **seed** (sección 5).

### Puerto 4000 bloqueado en Windows

Si `docker compose up` falla con *“bind … 4000”* o *“socket no permitido”*, Windows suele reservar el rango **4000–4099**. **No cambies** el puerto del backend ni del frontend para OAuth.

Abrí **PowerShell como administrador** y ejecutá:

```powershell
netsh int ipv4 set dynamicport tcp start=49152 num=16384
netsh int ipv6 set dynamicport tcp start=49152 num=16384
net stop winnat
net start winnat
```

Luego, en una terminal normal:

```bash
docker compose up -d
```

### Google Cloud Console (referencia)

Orígenes JS autorizados: `http://localhost:3000`, `http://localhost:4000`  
URI de redirección: `http://localhost:4000/api/auth/callback`

---

## 5. Seed de torneos (Mundial 2026 + Premier League)

Torneos definidos en `backend/src/scripts/tournaments.config.ts` (por defecto: **FIFA World Cup 2026** y **Premier League 2025/26**).

**Siempre correr el seed dentro de Docker** (usa la DB del compose y la API key del `.env` montado):

```bash
# Desde la raíz del repo
docker compose run --rm --no-deps migrate pnpm seed
```

Esto:

1. Crea/actualiza registros en la tabla `tournaments`
2. Carga equipos y fixtures desde Bzzoiro
3. Habilita el selector de torneo en **Fixture** (cuando hay más de un torneo)

Datos de prueba sin API key:

```bash
docker compose run --rm --no-deps migrate pnpm seed:mock
```

Para agregar otro torneo, editá `tournaments.config.ts` y volvé a ejecutar el mismo comando.

---

## 6. Frontend (desarrollo en el host)

```bash
cd frontend
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
API (Docker): [http://localhost:4000](http://localhost:4000)

Reiniciá `npm run dev` después de cambiar `frontend/.env`.

---

## 7. Flujo completo (resumen)

```text
1. git checkout feat/frontend
2. Copiar envs/back/.env → backend/.env y envs/front/.env → frontend/.env
3. npm install en backend/ y frontend/
4. docker compose up -d
5. docker compose run --rm --no-deps migrate pnpm seed
6. cd frontend && npm run dev
7. Login (Google) → Fixture → selector de torneo
```

---

## Comandos útiles

```bash
docker compose logs -f backend
docker compose up --build -d backend
docker compose restart
docker compose down          # apaga, mantiene volúmenes
docker compose down -v       # apaga y borra DB (re-seed después)
```

---

## Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| `redirect_uri_mismatch` (Google) | Puertos 4000/3000 sin cambiar; `.env` copiados desde `envs/`; URI en Google Console |
| Seed falla con `ECONNREFUSED` en el host | Usar `docker compose run … pnpm seed`, no `npm run seed` en `backend/` |
| Backend no arranca en 4000 | Rango reservado en Windows (sección 3) |
| Fixture sin partidos | Seed no corrido o torneo sin datos en Bzzoiro |
| Placeholders en Mundial (W101, 1A…) | Normal hasta que Bzzoiro tenga naciones reales; re-ejecutar seed |

---

## Torneos — agregar uno nuevo

Editá `backend/src/scripts/tournaments.config.ts` y buscá `leagueId` / `seasonId` en la API Bzzoiro. Luego:

```bash
docker compose run --rm --no-deps migrate pnpm seed
```
