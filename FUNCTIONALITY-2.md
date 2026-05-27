# FUNCTIONALITY-2 — Informe de estado y tareas pendientes

**Branch:** `feat/functionality-2`  
**Base:** `master` (post feat/functionality)  
**Fecha:** 2026-05-26

---

## Resumen ejecutivo

El backend está **completo en endpoints**. El frontend tiene tres páginas totalmente con **mock data hardcodeado** (`/rankings`, `/leagues`) y una con **funcionalidad parcial** (`/rules`). La integración frontend↔backend está hecha solo en: `/home`, `/fixture`, `/predictions`, `/settings`.

---

## 1. Páginas con mock data hardcodeado

### 🔴 `/rankings` — 100% mock
**Archivo:** `frontend/src/app/(main)/rankings/page.tsx`

Todo es dato inventado:
- Stat cards: `1.250 pts`, `posición 18.402`, `61%` — hardcoded.
- `chartData`: array estático de 7 puntos de ejemplo.
- Tabla del leaderboard: 4 usuarios ficticios (`Martin Q.`, `Juampi10`, `Lia Alvarez`, `Rodrigo Sálvador`) con puntos y rachas inventadas.
- El usuario "TÚ" es un placeholder `tu_usuario` con datos falsos.

**Backend disponible:** `GET /api/leaderboard` — devuelve usuarios rankeados por puntos reales.

**Lo que falta hacer:**
1. Conectar `GET /api/leaderboard` → mostrar top 100 real.
2. Agregar endpoint `GET /api/leaderboard/me` (o aprovechar el existente) para obtener posición, puntos totales y precisión del usuario logueado.
3. Para el gráfico de evolución de puntos, se necesita un endpoint nuevo: `GET /api/leaderboard/history?userId=&period=weekly|monthly|tournament` — actualmente **no existe en el backend**.
4. Reemplazar todos los valores hardcodeados con datos de la API.

---

### 🔴 `/leagues` — 100% mock
**Archivo:** `frontend/src/app/(main)/leagues/page.tsx`

Todo es dato inventado:
- Stat cards: `3 ligas activas`, `posición promedio 2°`, `850 puntos en ligas`, `61% precisión` — hardcoded.
- Lista "Mis Ligas": `Liga Amigos (12 miembros)`, `Familia Futbolera (8 miembros)`, `Oficina Champions (15 miembros)` — ficticias.
- "Ligas recomendadas": `Fanáticos del Fútbol`, `Prode Mundial 2026`, `La Redonda` — ficticias.
- Tab "Explorar Ligas": grid de 4 ligas inventadas.
- Los botones "Crear nueva liga" y "Unirse a una liga" van a `href="#"` — **no implementados**.
- El botón "Ver liga" no navega a ningún lado.

**Backend disponible:**
- `GET /api/mini-leagues/mine` — ligas del usuario con rol.
- `POST /api/mini-leagues` — crear liga.
- `POST /api/mini-leagues/join-by-token` — unirse por token.
- `GET /api/mini-leagues/:id` — detalle + miembros.
- `GET /api/mini-leagues/:id/leaderboard` — ranking de una liga.
- `POST /api/mini-leagues/:id/invite` — generar link de invitación.

**Lo que falta hacer:**
1. Conectar `GET /api/mini-leagues/mine` → mostrar las ligas reales del usuario.
2. Crear modal/formulario "Crear liga" → `POST /api/mini-leagues`.
3. Crear modal/formulario "Unirse con código" → `POST /api/mini-leagues/join` (por código) o `POST /api/mini-leagues/join-by-token`.
4. Implementar botón "Ver liga" → navegar a `/leagues/[id]` con el leaderboard de la liga.
5. Crear página `/leagues/[id]` con: miembros, ranking interno, opción de copiar link de invitación.
6. Tab "Explorar ligas" — el backend **no tiene** endpoint para listar ligas públicas. Opciones:
   - Agregar `GET /api/mini-leagues/public` (recomendado) o dejar el tab como "próximamente".
7. Calcular stats reales del usuario: posición promedio entre sus ligas, puntos totales, precisión — puede derivarse de `GET /api/mini-leagues/mine` + `GET /api/mini-leagues/:id/leaderboard`.
8. Completar el archivo `frontend/src/api/mini-leagues.ts` — faltan funciones: `getMyLeagues()`, `createLeague()`, `joinByCode()`, `getLeagueDetail()`, `getLeagueLeaderboard()`.

---

### 🟡 `/rules` — Estático (no es urgente, es contenido)
**Archivo:** `frontend/src/app/(main)/rules/page.tsx`

Solo muestra el tab "Sistema de puntos" con contenido estático. Los otros 5 tabs (`Fechas y plazos`, `Predicciones`, `Desempates`, `Ligas`, `Otras reglas`) **no tienen contenido** — el componente retorna solo el header de tabs pero nada debajo.

**Lo que falta hacer:** Agregar contenido a los 5 tabs restantes (es contenido editorial, no requiere API).

⚠️ **Inconsistencia con el scoring real:** La página de reglas muestra un sistema diferente al implementado:
- La página dice: Exacto=5pts, Diferencia exacta=3pts, Resultado correcto=1pt, Error grande=-1pt, Racha=+3pts bonus.
- El backend (`scoring.ts`) implementa: Exacto=5pts, Ganador correcto=3pts, Empate correcto=1pt, Incorrecto=0pts — **sin penalizaciones ni bonus de racha**.

Hay que alinear las reglas mostradas con el scoring real o implementar el scoring completo.

---

## 2. Endpoints de backend faltantes

| Endpoint | Para qué | Urgencia |
|----------|----------|----------|
| `GET /api/leaderboard/me` | Posición global, puntos totales y precisión del usuario logueado | 🔴 Alta |
| `GET /api/leaderboard/history` | Historial de puntos para el gráfico de evolución | 🟡 Media |
| `GET /api/mini-leagues/public` | Listar ligas públicas para "Explorar Ligas" | 🟡 Media |
| `PATCH /api/mini-leagues/:id` | Editar nombre de la liga (owner) | 🟡 Media |

---

## 3. Funcionalidades de frontend faltantes (sin depender de nuevos endpoints)

| Página | Funcionalidad | Notas |
|--------|--------------|-------|
| `/leagues` | Modal "Crear liga" | Requiere `POST /api/mini-leagues` (ya existe) |
| `/leagues` | Modal "Unirse con código" | Requiere `POST /api/mini-leagues/join` (ya existe) |
| `/leagues/[id]` | Página de detalle de liga | Ruta dinámica nueva, usa endpoints existentes |
| `/leagues` | Compartir link de invitación desde UI | Usa `POST /api/mini-leagues/:id/invite` (ya existe) |
| `/rankings` | Tabla con usuarios reales | Usa `GET /api/leaderboard` (ya existe) |
| `/rules` | Contenido de los 5 tabs faltantes | Solo contenido editorial |

---

## 4. Problemas menores / deuda técnica

| Ítem | Archivo | Descripción |
|------|---------|-------------|
| `changePassword` en settings | `frontend/src/api/user.ts` | Implementado, pero solo aplica a usuarios `local` — los de Google ven "No disponible". OK. |
| `deleteAccount` | `frontend/src/api/user.ts` | Llama `DELETE /api/auth/me` — implementado en backend. OK. |
| Avatar upload | `settings/page.tsx` | Manda base64 al backend en `PATCH /api/auth/me` — el backend lo guarda directamente. Sin CDN ni compresión. Riesgo de payload grande. |
| Leaderboard `ORDER BY` | `leaderboard.model.ts` | `.orderBy(sum(predictions.points))` ordena ASC, no DESC. Los primeros del ranking aparecen al final. Bug real. |

---

## 5. Orden de implementación recomendado para Cursor

### Fase A — Rankings (alta visibilidad, fácil)
1. **Fix bug**: `leaderboard.model.ts` → cambiar `.orderBy(sum(...))` a `.orderBy(desc(sum(...)))`.
2. **Nuevo endpoint backend**: `GET /api/leaderboard/me` → devuelve `{ rank, totalPoints, accuracy, correctPredictions, totalPredictions }`.
3. **Frontend `/rankings`**: reemplazar mock data por datos reales de `GET /api/leaderboard` y `GET /api/leaderboard/me`.
4. **Gráfico**: el historial de puntos por período requiere un endpoint nuevo. Por ahora se puede mostrar el gráfico solo si hay datos, u omitirlo.

### Fase B — Ligas (alta complejidad)
5. **Completar `frontend/src/api/mini-leagues.ts`**: agregar `getMyLeagues()`, `createLeague(name)`, `joinByCode(code)`, `getLeagueDetail(id)`, `getLeagueLeaderboard(id)`.
6. **Conectar `GET /api/mini-leagues/mine`** → reemplazar la lista hardcodeada.
7. **Modal "Crear liga"** con validación y `POST /api/mini-leagues`.
8. **Modal "Unirse"** con input de código/token y `POST /api/mini-leagues/join-by-token`.
9. **Página `/leagues/[id]`** → leaderboard de la liga + botón para copiar link de invitación.
10. **Tab "Explorar Ligas"** → marcar como "próximamente" o implementar `GET /api/mini-leagues/public`.

### Fase C — Pulido
11. **`/rules`**: alinear reglas con el scoring real (remover -1pt y bonus racha, o implementarlos en `scoring.ts`).
12. **`/rules`**: completar los 5 tabs faltantes con contenido.
13. **Avatar**: evaluar si comprimir la imagen antes de enviarla al backend.

---

## 6. Archivos a crear/modificar (lista para Cursor)

### Backend
- `backend/src/models/leaderboard.model.ts` — fix orderBy + agregar query `findLeaderboardForUser(userId)`
- `backend/src/controllers/leaderboard.controller.ts` — agregar handler `me()`
- `backend/src/routes/leaderboard.routes.ts` — agregar `GET /me`
- (opcional) `backend/src/controllers/mini-leagues.controller.ts` — agregar `listPublic()`
- (opcional) `backend/src/routes/mini-leagues.routes.ts` — agregar `GET /public`

### Frontend
- `frontend/src/api/mini-leagues.ts` — agregar las 5 funciones faltantes
- `frontend/src/app/(main)/rankings/page.tsx` — reemplazar mock por API real
- `frontend/src/app/(main)/leagues/page.tsx` — reemplazar mock por API real + modales
- `frontend/src/app/(main)/leagues/[id]/page.tsx` — **crear página nueva**
- `frontend/src/app/(main)/rules/page.tsx` — completar tabs

---

*Generado el 2026-05-26 en sesión de review de feat/functionality-2*
