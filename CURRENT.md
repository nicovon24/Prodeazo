# CURRENT.md — Estado actual del proyecto

> Este archivo es el primer documento que debe leer cualquier sesión nueva. Refleja el estado real del proyecto hoy. Se actualiza al cierre de cada sesión.

---

## En progreso

- Documentación y sistema de agentes recién configurado (CLAUDE.md, VISION.md, ARCHITECTURE.md, docs/agents, docs/rules, docs/WORKFLOW.md)
- Frontend pages existen con mock data — integración con backend pendiente

## Última sesión (2026-05-25)

- Se creó el sistema de documentación completo: L1 (CLAUDE.md, VISION.md, ARCHITECTURE.md), L2 (docs/agents/), L3 (docs/rules/), docs/WORKFLOW.md
- Decisión: JWT en localStorage como mecanismo de auth (ADR-001 registrado)
- Se corrigieron referencias desactualizadas a cookie-session en backend/AGENTS.md, DEVELOPMENT_GUIDE.md y README.md
- Se creó este archivo CURRENT.md como sistema de memoria entre sesiones

## Próxima tarea

Integrar el frontend con el backend real: las páginas de Fixture, Predictions y Rankings usan mock data. El primer paso es conectar `/fixture` con `GET /api/fixtures` y reemplazar los mocks por datos reales.

Ver estado detallado en `frontend/development_guide.md` — cada página tiene documentado qué endpoints necesita.

## Bloqueantes / preguntas abiertas

- Ninguno por ahora.

---

*Actualizado: 2026-05-25 — sesión de setup de documentación y sistema de agentes*
