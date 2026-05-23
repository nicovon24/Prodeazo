# Prodeazo (Prode Mundial 2026)

Esta app estará ideada para ser una plataforma de pronósticos y estadísticas de fútbol,
comenzando por el Mundial 2026 y escalando luego a otros torneos.

## ¿De qué va a tratar el proyecto?
La plataforma va a permitir:
- Ver fixtures y resultados en tiempo real.
- Cargar predicciones de partidos.
- Sumar puntos por aciertos.
- Comparar usuarios en rankings generales y por ligas.
- Consultar estadísticas de equipos, jugadores y partidos.

## Features y módulos planeados

### 1) Módulo core (MVP)
- **Fixture**: listado de partidos y estados (pendiente, en vivo, finalizado).
- **Predicciones**: carga de resultados antes del inicio del partido.
- **Ranking general**: tabla de posiciones por puntos.
- **Comparativa**: usuario vs usuario, partido por partido.
- **Predicciones del torneo**: campeón/goleador y otros picks especiales.
- **Perfil**: resumen personal (aciertos, puntos e historial).

### 2) Miniligas y administración (segunda etapa)
- **Miniligas privadas/públicas** con código de invitación.
- **Ranking por miniliga**.
- **Panel admin** para ajustes manuales (resultados, scoring, usuarios).

### 3) Módulo estadísticas y expansión a otros torneos (tercera etapa)
- **Grupos y llaves** del torneo activo.
- **Goleadores, asistidores y métricas avanzadas**.
- **Vista de partido** con eventos y datos enriquecidos.
- **Perfiles de equipos y jugadores**.
- **Base reutilizable para sumar nuevos torneos** (copas y ligas internacionales).

## Stack (definición inicial)
Esta app va a ser construida con:
- **Next.js + TypeScript** para frontend y estructura principal.
- **Supabase + PostgreSQL** para auth, base de datos y backend.
- **Tailwind + NextUI** para interfaz visual.
- **Bzzoiro BSD** como fuente principal de fixtures/resultados.

## Desarrollo local

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/). No es obligatorio tener Node ni PostgreSQL instalados en tu máquina.

```bash
# Copiar .env y configurar SESSION_SECRET como mínimo
cp backend/.env.example backend/.env

# Build, migraciones y arranque
docker compose up --build
```

Las migraciones se ejecutan automáticamente. El backend queda disponible en `http://localhost:3000`.

## Roadmap de alto nivel
- **Fase 1 (MVP):** foco en predicciones + ranking.
- **Fase 2:** miniligas y panel administrativo.
- **Fase 3:** módulo estadístico completo y expansión multi-torneo.

> Objetivo: la versión inicial estará ideada para terminarse antes del inicio del Mundial 2026,
> y luego evolucionará como producto reusable para otros torneos.

