# Laboratorio de dashboards animados

Prototipos y muestrarios de **visualización de datos con animación**: globo 3D, GSAP, y una galería de 21 portadas con fondo animado (canvas). Todo con **datos simulados**.

> **Demo:** https://jesussamuelhernandez.github.io/laboratorio-dashboards-animados/

## Qué hay

| Ruta | Contenido |
|---|---|
| `/` | Índice con enlaces a todo |
| `p01-globe-kpi/` | Dashboard ejecutivo: globo (Globe.gl) + tarjetas KPI animadas (GSAP) |
| `p02-gsap-lab/` | Laboratorio GSAP: Flip, stagger, SplitText, DrawSVG, MorphSVG, ScrollTrigger |
| `p03-gsap-catalog/` | Muestrario de 30 animaciones para tableros y mapas (tema claro) |
| `p04-premium/` | 33 microinteracciones discretas para reportes (botones, controles, KPI, gráficos, mapas) |
| `p05-portada/` | Portada animada de anillos concéntricos |
| `p06-nodos/` | Constelaciones en órbita: 14 grupos de nodos que giran alrededor de un centro, profundidad por desenfoque, 3 temas (Sombras, Océano, Neón); clic en un nodo lo convierte en el centro del giro |
| `portadas/` | Galería de **21 portadas** con fondo animado (red, ondas, globo, lluvia, fractales, hierba…) |

Cada portada es un HTML autocontenido (canvas + JS puro). Responden al cursor, tienen modo claro/oscuro, pausa y respetan `prefers-reduced-motion`.

## Ejecutar en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (multi-página, rutas relativas)
```

Las portadas 02–21 se generan desde una plantilla común:

```bash
node portadas/_src/build.mjs    # edita los fondos en portadas/_src/covers/*.js
```

## Publicar en GitHub Pages

1. Crea el repositorio y sube la rama `main`.
2. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions**.
3. Cada `push` a `main` ejecuta `.github/workflows/deploy.yml` y publica el sitio.

## Documentación adicional

- [`GSAP_EFECTOS_SELECCIONADOS.md`](GSAP_EFECTOS_SELECCIONADOS.md): guía con recetas de las animaciones GSAP elegidas, pensada para aplicarlas en otros proyectos.

## Tecnologías y licencias

React, Vite, [GSAP](https://gsap.com) (licencia estándar sin costo), [Globe.gl](https://globe.gl), `world-atlas` y `topojson-client` (datos geográficos de dominio público). Los datos mostrados son ficticios.
