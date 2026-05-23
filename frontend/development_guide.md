# Guía de Desarrollo y Estado Frontend 🛠️

Este documento detalla el estado funcional actualizado de interactividad y conexión de datos de cada una de las nuevas páginas implementadas (Arquitectura compartida, Home, Fixture, Predicciones, Ligas, Rankings y Reglas). Funciona como un "mapa mental" para continuar acoplando la lógica del Backend en los componentes limpios y funcionales de Front.

---

## 🏗️ 1. Arquitectura Compartida (`layout.tsx` + `Navbar`/`Sidebar`)
- **Datos Mostrados:** El estado de la sesión, acceso al nombre de usuario para el botón de "Cerrar Sesión", y resaltado activo de la página en el menú lateral.
- **Origen de datos:** Contexto local derivado del hook existente `useAuth` y llamadas a la API (o cookies válidas).
- **Estado Funcional:** 
  - ✅ **Funciona:** Renderizado persistente (layout principal en `/(main)`), Auth Guard que redirige a `/login` si no hay sesión, botón de cerrar sesión operativo.
  - ⏳ **Falta:** Obtener el avatar/ícono dinámico del usuario (actualmente es un placeholder gráfico estandarizado).

---

## 🏠 2. Home Page (`/home`)
- **Datos Mostrados:** Estadísticas globales resumidas (Posición y precisión), resumen rápido de *"Próximos Partidos"* y foco en *"Predicciones Pendientes"*.
- **Origen de datos:** Mocks de datos definidos directo en el HTML compilado para replicar con alta fidelidad las maquetas de Figma.
- **Estado Funcional:**
  - ✅ **Funciona:** Retiene la grilla estructural responsiva, efectos de hover ("Mi Prode", "Rankings", "Ligas").
  - ⏳ **Falta:** 
    - Un endpoint Backend tipo `GET /api/dashboard/summary` que entregue las métricas macro del usuario.
    - Endpoints para listar los próximos 2 partidos reales cronológicos.

---

## 📅 3. Fixture Page (`/fixture`)
- **Datos Mostrados:** Calendario dividido por Fechas con filtros, muestra banderas de países, resultados consolidados o etiqueta *EN VIVO*, así como la medalla de "tu éxito de predicción" (rojo, verde, amarillo).
- **Origen de datos:** 
  - Parcialmente real: Ejecuta en el render `GET /api/fixtures`.
  - Simulada artificial: A la estructura le insertamos valores condicionales en el componente para ver cómo reaccionan las etiquetas de resultados según los mocks de diseño.
- **Estado Funcional:**
  - ✅ **Funciona:** El consumo superficial de Fixtures por fetcher, agrupación visual, estilos de insignias.
  - ⏳ **Falta:** 
    - Endpoints cruzados entre Partidos y "Tus Predicciones" para inyectarle el color correcto condicionado del Backend sobre la insignia generada.
    - Componentización dinámica real del filtro de fecha ("Todas las fechas / Fase de grupos").

---

## ✏️ 4. Predicciones Page (`/predictions`)
- **Datos Mostrados:** Contador global (ej. 12/104 listos) partidos presentados con `ScoreInput` (spinners numéricos de + y -), segmentado por botones navegables de días.
- **Origen de datos:** Implementado mediante arreglos simulados (`useState`) y actualización por llaves React en cliente para asegurar rendimiento visual en tiempo real de ingreso de marcadores.
- **Estado Funcional:**
  - ✅ **Funciona:** Subir/bajar los goles individualmente, truncamiento lógico (`readonly=true` cuando el partido empezó), pestañas.
  - ⏳ **Falta:**
    - Botón "Guardar predicciones" levanta un alert() simulado. Se requiere un endpoint transaccional masivo de BD `POST /api/predictions` para persistir la data.
    - Traer las predicciones pre-rellenadas si el usuario ya las completó antes al cargar la page.

---

## 📊 5. Rankings Page (`/rankings`)
- **Datos Mostrados:** Gráfico vectorial de "Evolución de puntos" e "Historias", Stats macro, Tabla completa de Top 100 ("Leaderboard"). 
- **Origen de datos:** Gráfico de evolución impulsado puramente por la librería `recharts` con datos crudos temporales de prueba. Tabla inyectada de forma quemada (*hardcoded*).
- **Estado Funcional:**
  - ✅ **Funciona:** Graficación analítica `ComposedChart` totalmente asíncrona, fila del usuario logueado estéticamente amarrada al pie de la tabla.
  - ⏳ **Falta:**
    - Recibir los arreglos del chart vía Backend (`GET /api/rankings/history`).
    - API que retorne array ordenado global del Leaderboard y resuelva paginación (`GET /api/rankings/global`). 

---

## 🛡️ 6. Ligas Page (`/leagues`)
- **Datos Mostrados:** Resumen personal comparativo (+% progreso), Listado de ligas donde pertenece, Grilla interactiva para Explorar Ligas.
- **Origen de datos:** Mockups estáticos React para renderizar la pantalla dividida (Right/Left columns) dictaminada por diseño.
- **Estado Funcional:**
  - ✅ **Funciona:** Toggle (Switch visual) sin fallas entre "Mis Ligas" y el buscador "Explorar", los Call To Action con degradados apuntan visualmente bien.
  - ⏳ **Falta:** 
    - Lógica de formulario interactivo real o modal emergente ("Crear nueva liga").
    - Input para recibir "Código de Invitación".
    - `GET /api/leagues/my-leagues` y el sistema agnóstico de recomendación.

---

## 📜 7. Reglas Page (`/rules`)
- **Datos Mostrados:** Listado oficial estático de las mecánicas de puntuación y desempates.
- **Origen de datos:** Codificado directamente en cliente, textos provistos durante planeamiento.
- **Estado Funcional:**
  - ✅ **Funciona al 100%.** No requiere integración back end en fase posterior. Muestra menús de navegación con pestañas de React funcionales.
