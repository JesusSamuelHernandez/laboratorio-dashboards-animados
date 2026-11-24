# Efectos GSAP seleccionados — guía de aplicación para Claude

> **Para Claude (en el otro proyecto):** este documento contiene 29 animaciones GSAP ya probadas, elegidas por el usuario: **Parte A** (15, para tableros, reportes y mapas) y **Parte B** (14 «detalles premium»: botones, controles, tabla y KPI discretos para elementos de un reporte). Tu tarea es **aplicarlas a los elementos equivalentes de este proyecto**, no copiarlas tal cual: reemplaza los datos de ejemplo por los datos reales y respeta el estilo visual y el framework del proyecto.

Origen: laboratorio `nuevas_herramientas_animacion` (React + Vite). Muestrario de referencia: `src/p03-gsap-catalog/demos.jsx` y `p03.css` (por si tienes acceso). Todo lo necesario está inline aquí.

---

## 1. Cómo trabajar (reglas)

1. **Primero inspecciona el proyecto** (framework, estilos, componentes de KPI, gráficos, tablas, mapas) y propón una tabla *efecto → componente donde aplicarlo*. Aplica solo donde tenga sentido; no animes todo.
2. **Usa los datos reales** del proyecto. Las cifras de los ejemplos (48 215, 94.1%, etc.) son de relleno.
3. **Respeta el tema visual existente.** Los colores de los ejemplos (naranja `#ff7a1a` / aqua `#12c7c7`) son del muestrario; mapea a los tokens/variables del proyecto.
4. **Una sola instancia, limpieza total.** Todo efecto debe destruirse al desmontar (ver §3). Sin fugas de listeners, intervalos ni tweens.
5. **Rendimiento:** anima solo `transform` (x, y, scale, rotation) y `opacity` siempre que se pueda. Evita animar `width/height/top/left` salvo donde la receta lo indica (barras, acordeones).
6. **Discreción:** duraciones 0.3–0.9 s para micro-interacciones; ease `power2/power3.out`. Los bucles (`loop`) solo deben correr mientras el elemento está visible.
7. **Accesibilidad:** respeta `prefers-reduced-motion` (ver §3). Nunca ocultes información solo con animación; el estado final debe ser legible sin ella.
8. **No instales nada que no esté listado** en §2. Verifica la versión de GSAP antes de usar plugins.

---

## 2. Dependencias

```bash
npm install gsap          # >= 3.13: TODOS los plugins son gratuitos y vienen incluidos
```

Plugins usados por estos efectos: `Flip`, `DrawSVG`, `MorphSVG`, `MotionPath`, `ScrollTrigger`. Registro único (crea un módulo `gsap.js` y impórtalo siempre desde ahí):

```js
// gsap.js
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(Flip, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, ScrollTrigger)
export { gsap, Flip, ScrollTrigger }
```

Si el proyecto no usa SVG para alguna receta (p. ej. no habrá mapas), registra solo los plugins que realmente se usen.

---

## 3. Patrón de integración (aplícalo a TODAS las recetas)

Cada receta se escribe como `setup(root, { q, on, cleanup })` que devuelve un **timeline pausado** (o nada si es interactiva). `root` es el contenedor del componente; `q` es un selector acotado a él.

```js
import { gsap, ScrollTrigger } from './gsap'

export function mountEffect(root, setup, { loop = false } = {}) {
  const cleanups = []
  const h = {
    q: gsap.utils.selector(root),
    on: (el, evt, fn) => { el.addEventListener(evt, fn); cleanups.push(() => el.removeEventListener(evt, fn)) },
    cleanup: (fn) => cleanups.push(fn),
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let tl
  const ctx = gsap.context(() => { tl = setup(root, h); tl?.pause(0) }, root)

  // Reduced motion: salta al estado final y no hagas bucles.
  if (reduce && tl) { tl.progress(1).pause() }

  // Solo anima mientras es visible (ahorra CPU/GPU).
  let played = false
  const st = ScrollTrigger.create({
    trigger: root, start: 'top 90%', end: 'bottom 5%',
    onToggle: (self) => {
      if (!tl || reduce) return
      if (self.isActive) { loop ? tl.play() : !played && ((played = true), tl.restart()) }
      else if (loop) tl.pause()
    },
  })

  return () => { st.kill(); cleanups.forEach((f) => f()); ctx.revert() }   // ← llamar al desmontar
}
```

**React:**

```jsx
useLayoutEffect(() => mountEffect(ref.current, setupFn, { loop: false }), [])
```

**Vue:** `onMounted` guarda el retorno y `onBeforeUnmount` lo ejecuta. **Vanilla:** llama al retorno al destruir el componente.

Notas:
- En React, el JSX del contenido animado debe ser **estable** (no volver a renderizar el nodo que GSAP muta, p. ej. el bar race que reordena filas o los toasts creados por DOM).
- Efectos marcados **loop** → pasar `{ loop: true }`. Efectos **interactivos** no devuelven timeline (solo listeners con `on`).

### Tokens de diseño de referencia (mapear a los del proyecto)

```css
:root { --orange:#ff7a1a; --orange-d:#d85a00; --aqua:#12c7c7; --aqua-d:#0b8f98;
        --ink:#1f2937; --muted:#6b7280; --line:#f1e4d6; --panel:#fff; --bg:#fffaf4; }
```

---

## 4. PARTE A — 15 animaciones (dashboards, reportes y mapas)

Resumen de dónde aplicar cada una:

| # | Efecto | Aplicar en | Plugins | Modo |
|---|---|---|---|---|
| 01 | Odómetro de dígitos | KPI principal / cifra grande | — | una vez |
| 02 | Barras con rebote | Gráfico de barras propio (HTML/CSS) | — | una vez |
| 05 | Pulso de alerta (ping) | Marcadores/estado crítico en mapa o lista | — | bucle |
| 08 | Marcadores que caen | Carga inicial de pines/sedes en mapa | — | una vez |
| 10 | Mapa de calor con onda | Matriz de densidad/cobertura | — | una vez |
| 11 | Tarjeta KPI con reverso 3D | Tarjeta con detalle al hacer clic | — | interactivo |
| 12 | Estado que cambia (semáforo) | Chips de estado (OK/Alerta/Crítico) | — | bucle (demo) / por evento (real) |
| 13 | Skeleton → contenido | Carga de tarjetas/gráficos | — | por evento de carga |
| 15 | Notificaciones apiladas | Toasts/alertas del tablero | Flip | interactivo |
| 17 | Línea con punto seguidor | Sparklines / tendencia | DrawSVG, MotionPath | una vez |
| 20 | Tabla con fila actualizada | Tablas con datos en vivo | — | una vez / por evento |
| 22 | Ranking animado (bar race) | Rankings que cambian | Flip | bucle (demo) / por actualización (real) |
| 23 | Gráfico que se transforma | Cambio de métrica/serie en gráfico de línea | MorphSVG | interactivo |
| 28 | Conexiones entre ciudades | Mapa SVG con rutas/flujos | DrawSVG | bucle |
| 30 | Zoom de cámara a región | Mapa SVG con selección de región | — (attr) | interactivo |

> Los ejemplos con "(demo)" usan datos aleatorios/temporizadores para lucirse; en el proyecto real **dispáralos con los eventos reales** (llegada de datos, cambio de filtro, clic del usuario).

---

### 01 · Odómetro de dígitos
Cada dígito es una columna con los números 0-9 apilados; se anima el `yPercent` hasta el dígito objetivo, con cascada.

```html
<div class="odo">
  <span class="cur">$</span>
  <span class="col"><span class="reel" data-d="4"><b>0</b><b>1</b>…<b>9</b></span></span>
  <!-- una .col por dígito; las comas/símbolos son <span class="cur"> -->
</div>
```
```css
.odo{display:flex;align-items:center;font-size:46px;font-weight:700;font-variant-numeric:tabular-nums}
.col{display:inline-block;height:1em;overflow:hidden;width:.62em;text-align:center}
.reel{display:block;will-change:transform}
.reel b{display:block;height:1em;line-height:1}
```
```js
const setup = (root, { q }) =>
  gsap.timeline().fromTo(q('.reel'), { yPercent: 0 },
    { yPercent: (i, el) => -el.dataset.d * 10, duration: 1.8, ease: 'power3.out', stagger: 0.18 })
```
**Con datos reales:** genera las columnas a partir de `String(valor)` y pon `data-d` = cada dígito. Al cambiar el valor, anima `yPercent` desde el actual al nuevo (no desde 0).

### 02 · Barras con rebote
```css
.bars{display:flex;align-items:flex-end;gap:10px}
.bar-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
.bar-col i{display:block;width:100%;border-radius:6px 6px 0 0;background:var(--orange)}
```
```html
<div class="bar-col"><span class="bar-val">62</span><i style="height:62%"></i></div>
```
```js
const setup = (root, { q }) => gsap.timeline()
  .from(q('.bar-col i'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'back.out(1.6)', stagger: 0.08 })
  .from(q('.bar-val'), { y: 10, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0.3)
```
Altura por dato en `style="height:X%"`; la animación solo usa `scaleY` (barato para GPU).

### 05 · Pulso de alerta (radar ping) — BUCLE
```html
<div class="mk hot" style="left:22%;top:40%"><i class="pr"></i><i class="pr"></i><i class="pd"></i></div>
```
```css
.mk{position:absolute;width:0;height:0}
.mk i{position:absolute;border-radius:50%;transform:translate(-50%,-50%)}
.mk .pd{width:12px;height:12px;background:var(--aqua);border:2px solid #fff}
.mk .pr{width:14px;height:14px;background:rgba(18,199,199,.35)}
.mk.hot .pd{background:var(--orange)} .mk.hot .pr{background:rgba(255,122,26,.4)}
```
```js
const setup = (root, { q }) => {
  const tl = gsap.timeline({ repeat: -1 })
  q('.mk').forEach((mk, i) =>
    tl.fromTo(mk.querySelectorAll('.pr'), { scale: 1, opacity: 0.7 },
      { scale: 3.4, opacity: 0, duration: 1.8, ease: 'power2.out', stagger: 0.5 }, i * 0.25))
  return tl
}
```
Usar `.hot` solo en elementos que requieren atención (umbral de datos). No uses `repeat:-1` en tweens hijos (solo en el timeline).

### 08 · Marcadores que caen
```css
.drop-wrap{position:absolute;width:0;height:0}
.drop{position:absolute;left:-11px;top:-28px}
.drop i{display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--orange);border:3px solid #fff}
.shadow{position:absolute;left:-9px;top:-3px;width:18px;height:6px;border-radius:50%;background:rgba(0,0,0,.2)}
```
```html
<div class="drop-wrap" style="left:18%;top:40%"><div class="shadow"></div><div class="drop"><i></i></div></div>
```
```js
const setup = (root, { q }) => gsap.timeline()
  .from(q('.drop'), { y: -150, autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: { each: 0.14, from: 'random' } })
  .from(q('.shadow'), { scale: 0, autoAlpha: 0, duration: 0.5, stagger: { each: 0.14, from: 'random' } }, 0.35)
```
El pin va en `.drop` (se anima `y`) y la rotación CSS en el `<i>` hijo, para que no choquen las transformaciones.

### 10 · Mapa de calor con onda
Celdas coloreadas por valor (interpola entre dos colores con `gsap.utils.interpolate(c1, c2, valor01)`).
```css
.heat{display:grid;grid-template-columns:repeat(12,1fr);gap:4px}
.heat i{aspect-ratio:1;border-radius:4px}
```
```js
// COLS y ROWS = dimensiones reales de la matriz
const setup = (root, { q }) => gsap.timeline()
  .from(q('.heat i'), { scale: 0, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)',
    stagger: { grid: [ROWS, COLS], from: 'center', amount: 1.2 } })
  .to(q('.heat i'), { scale: 1.18, duration: 0.25, yoyo: true, repeat: 1,
    stagger: { grid: [ROWS, COLS], from: 0, amount: 1.2 } }, '+=0.2')
```
`grid: [filas, columnas]` es obligatorio para que la onda sea radial.

### 11 · Tarjeta KPI con reverso 3D — INTERACTIVA
```html
<div class="fc"><div class="fc-in">
  <div class="fc-face front">…cifra…</div>
  <div class="fc-face back">…detalle…</div>
</div></div>
```
```css
.fc{width:190px;height:120px;perspective:800px;cursor:pointer}
.fc-in{position:relative;width:100%;height:100%;transform-style:preserve-3d}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:14px;padding:14px}
.fc-face.back{transform:rotateY(180deg)}
```
```js
const setup = (root, { q, on, cleanup }) => {
  let flipped = false
  const inner = q('.fc-in')[0]
  on(q('.fc')[0], 'click', () => {
    flipped = !flipped
    gsap.to(inner, { rotationY: flipped ? 180 : 0, duration: 0.8, ease: 'power3.inOut' })
  })
  cleanup(() => gsap.killTweensOf(inner))
}
```
Hazla accesible: el contenedor debe ser `<button>` o tener `role="button"`, `tabindex="0"` y manejar Enter/Espacio.

### 12 · Estado que cambia (semáforo)
Etiqueta que cambia de color y texto deslizando. **En el proyecto real**, no uses el bucle: llama a una función `setStatus(state)` cuando cambie el estado.
```html
<span class="badge"><i class="bdot"></i><em class="blabel">Operativo</em></span>
```
```css
.badge{display:inline-flex;align-items:center;gap:10px;padding:10px 20px;border-radius:99px;overflow:hidden;font-weight:700}
.bdot{width:12px;height:12px;border-radius:50%;background:currentColor}
.blabel{font-style:normal;display:inline-block;min-width:84px}
```
```js
const STATES = {
  ok:    { t: 'Operativo', bg: '#d9f7f6', fg: '#0b6f78' },
  warn:  { t: 'Alerta',    bg: '#ffe9d6', fg: '#b34700' },
  crit:  { t: 'Crítico',   bg: '#ffe0e1', fg: '#b4232a' },
}
function setStatus(root, key) {
  const s = STATES[key], badge = root.querySelector('.badge'), label = root.querySelector('.blabel'), dot = root.querySelector('.bdot')
  gsap.timeline()
    .to(badge, { backgroundColor: s.bg, color: s.fg, duration: 0.4 })
    .to(label, { yPercent: -120, autoAlpha: 0, duration: 0.18 }, '<')
    .call(() => { label.textContent = s.t })
    .fromTo(label, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.25 })
    .fromTo(dot, { scale: 1 }, { scale: 1.7, duration: 0.18, yoyo: true, repeat: 3 }, '<')
}
```
Los colores de estado deben salir de los tokens semánticos del proyecto (éxito/aviso/error).

### 13 · Skeleton → contenido
Superpón un esqueleto absoluto sobre el contenido real; al terminar la carga, desvanece el esqueleto y entra el contenido en cascada. **Dispáralo con el evento real de carga** (promesa resuelta / datos listos), no con temporizador.
```html
<div class="sk">
  <div class="real">…contenido real (varios hijos directos)…</div>
  <div class="skel"><div class="skl w60"></div><div class="skl h40"></div><span class="shine"></span></div>
</div>
```
```css
.sk{position:relative}
.skel{position:absolute;inset:0;background:#fbf6ef;padding:16px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.skl{height:14px;border-radius:6px;background:#eadfd2} .skl.w60{width:60%} .skl.h40{flex:1;height:auto}
.shine{position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.85) 50%,transparent 70%)}
```
```js
// mientras carga: brillo en bucle suave
const shimmer = gsap.fromTo('.shine', { xPercent: -100 }, { xPercent: 100, duration: 0.9, ease: 'none', repeat: -1 })
// al llegar los datos:
function reveal(root) {
  shimmer.kill()
  gsap.timeline()
    .to(root.querySelector('.skel'), { autoAlpha: 0, duration: 0.3 })
    .from(root.querySelectorAll('.real > *'), { y: 14, autoAlpha: 0, stagger: 0.12, duration: 0.5 }, '-=0.1')
}
```
Recuerda `shimmer.kill()` también al desmontar.

### 15 · Notificaciones apiladas — INTERACTIVA
Las alertas entran por un lado; las demás se reacomodan solas con **Flip**.
```html
<div class="toasts"></div>  <!-- contenedor: display:flex; flex-direction:column; gap:8px; align-items:flex-end -->
```
```css
.toast{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--aqua);border-radius:10px;padding:8px 14px;font-size:13px}
.toast.warn{border-left-color:var(--orange)}
```
```js
import { gsap, Flip } from './gsap'

export function createToaster(box, { max = 4, ttl = 3 } = {}) {
  const calls = []
  const dismiss = (el) => gsap.to(el, { x: 80, autoAlpha: 0, duration: 0.35, onComplete: () => {
    const s = Flip.getState(box.children); el.remove(); Flip.from(s, { duration: 0.35, ease: 'power2.out' })
  } })
  const push = (text, kind = '') => {
    const el = document.createElement('div')
    el.className = 'toast ' + kind
    el.textContent = text                       // textContent, nunca innerHTML con datos externos
    const s = Flip.getState(box.children)
    box.prepend(el)
    Flip.from(s, { duration: 0.4, ease: 'power2.out' })
    gsap.from(el, { x: 80, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' })
    while (box.children.length > max) box.lastElementChild.remove()
    calls.push(gsap.delayedCall(ttl, () => el.isConnected && dismiss(el)))
  }
  const destroy = () => { calls.forEach((c) => c.kill()); gsap.killTweensOf(box.children); box.replaceChildren() }
  return { push, destroy }
}
```
Usa `role="status"`/`aria-live="polite"` en el contenedor.

### 17 · Línea con punto seguidor
La tendencia se dibuja, un punto la recorre y al final aparece el cambio %.
```html
<svg viewBox="0 0 300 120" class="spark">
  <path class="sp-area" d="…misma curva… L290 120 L10 120 Z" fill="url(#grad)"/>
  <path class="sp-line" d="M10 90 C40 80 60 40 90 55 S140 100 170 60 S230 20 290 30"/>
  <circle class="sp-dot" r="6"/>
  <text class="sp-label" x="290" y="16" text-anchor="end">▲ +18%</text>
</svg>
```
```css
.sp-line{fill:none;stroke:var(--aqua-d);stroke-width:3;stroke-linecap:round}
.sp-dot{fill:#fff;stroke:var(--orange);stroke-width:3}
```
```js
const setup = (root, { q }) => {
  const line = q('.sp-line')[0]
  return gsap.timeline()
    .fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 2, ease: 'power2.inOut' })
    .fromTo(q('.sp-dot'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0)
    .to(q('.sp-dot'), { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5] }, duration: 2, ease: 'power2.inOut' }, 0)
    .from(q('.sp-area'), { autoAlpha: 0, duration: 0.8 }, 1.4)
    .from(q('.sp-label'), { y: 10, autoAlpha: 0, duration: 0.4, ease: 'back.out(2)' }, '-=0.4')
}
```
**Con datos reales:** genera el `d` del path a partir de la serie (escala X/Y al viewBox). Usa `preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke` si el SVG debe estirarse.

### 20 · Tabla con fila actualizada
Filas entran en cascada; una celda cambia de valor con destello. **Para datos en vivo**, reutiliza la parte del destello (`flashCell`) cuando cambie un valor.
```js
const setup = (root, { q }) => {
  const rows = q('tbody tr')
  return gsap.timeline().from(rows, { x: -24, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' })
}

function flashCell(row, cell, from, to, fmt = (v) => v.toFixed(1) + '%') {
  const o = { v: from }
  gsap.timeline()
    .fromTo(row, { backgroundColor: 'rgba(255,122,26,0)' }, { backgroundColor: 'rgba(255,122,26,.22)', duration: 0.35, yoyo: true, repeat: 1 })
    .to(o, { v: to, duration: 0.7, ease: 'power2.out', onUpdate: () => { cell.textContent = fmt(o.v) } }, '<')
    .fromTo(cell, { color: '#1f2937' }, { color: '#0b8f98', fontWeight: 700, duration: 0.3 }, '<')
}
```
Usa `font-variant-numeric: tabular-nums` en las celdas numéricas para que no “baile” el ancho.

### 22 · Ranking animado (bar race)
Filas que se reordenan según el valor; las barras crecen y las filas intercambian lugar con **Flip**. En el proyecto real, llama a `update(newValues)` cuando lleguen datos (no con temporizador).
```html
<div class="race">
  <div class="rrow" data-v="90"><span class="rname">Asia</span><span class="rtrack"><i style="width:90%"></i></span><b class="rval">90</b></div>
  <!-- una .rrow por elemento -->
</div>
```
```css
.rrow{display:grid;grid-template-columns:96px 1fr 30px;align-items:center;gap:8px;font-size:12px}
.rtrack{height:14px;background:#f0e8dd;border-radius:99px;overflow:hidden}
.rtrack i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--orange),#ffb066)}
.rval{text-align:right;font-variant-numeric:tabular-nums}
```
```js
import { gsap, Flip } from './gsap'

export function createRace(container) {
  const rows = [...container.querySelectorAll('.rrow')]
  const state = rows.map((r) => ({ r, v: +r.dataset.v, shown: +r.dataset.v }))
  return function update(values /* { nombre: valor } */, max = 100) {
    state.forEach((s) => { s.v = values[s.r.querySelector('.rname').textContent] ?? s.v })
    const before = Flip.getState(rows)
    ;[...state].sort((a, b) => b.v - a.v).forEach((s) => container.appendChild(s.r))
    Flip.from(before, { duration: 0.8, ease: 'power2.inOut' })
    state.forEach((s) => {
      gsap.to(s.r.querySelector('.rtrack i'), { width: (s.v / max) * 100 + '%', duration: 0.8, ease: 'power2.inOut' })
      gsap.to(s, { shown: s.v, duration: 0.8, onUpdate: () => { s.r.querySelector('.rval').textContent = Math.round(s.shown) } })
    })
  }
}
```
Aquí sí se anima `width` (es la excepción); mantén pocas filas (≤ 10).

### 23 · Gráfico que se transforma — INTERACTIVA
Al cambiar de métrica, la línea se deforma hacia la nueva serie y cambia de color (MorphSVG). **Requisito:** todas las series con el **mismo número de puntos**.
```js
const SETS = {
  a: { color: '#ff7a1a', data: [30, 42, 38, 55, 60, 52, 70, 78, 74, 90] },
  b: { color: '#12c7c7', data: [60, 58, 70, 66, 50, 62, 48, 40, 52, 35] },
}
const line = (data) => data.map((v, i) => `${i ? 'L' : 'M'}${10 + i * 31.1} ${110 - v}`).join(' ')
const area = (data) => `${line(data)} L290 120 L10 120 Z`

function switchSeries(root, key) {
  const s = SETS[key]
  gsap.to(root.querySelector('.mp-line'), { morphSVG: line(s.data), stroke: s.color, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' })
  gsap.to(root.querySelector('.mp-area'), { morphSVG: area(s.data), fill: s.color, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' })
}
```
```html
<svg viewBox="0 0 300 120" preserveAspectRatio="none">
  <path class="mp-area" d="…" fill-opacity=".15"/>
  <path class="mp-line" d="…" fill="none" stroke-width="3" vector-effect="non-scaling-stroke"/>
</svg>
```
`overwrite: 'auto'` permite cambiar de serie a mitad de animación sin saltos.

### 28 · Conexiones entre ciudades — BUCLE
Arcos que se trazan en cascada, ciudades que aparecen y luego un trazo discontinuo en movimiento simula flujo.
```js
// Arco curvo entre dos puntos (control point por encima del más alto)
const arc = ([x1, y1], [x2, y2]) => `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 45} ${x2} ${y2}`
```
```html
<svg viewBox="0 0 300 160">
  <!-- por cada conexión, 3 paths con el MISMO d: -->
  <path class="arc-base" d="…"/><path class="arc-fg" d="…"/><path class="arc-flow" d="…"/>
  <g class="city"><circle cx="40" cy="110" r="5" class="city-c"/><text …>CDMX</text></g>
</svg>
```
```css
.arc-base{fill:none;stroke:#cdeceb;stroke-width:1.5}
.arc-fg{fill:none;stroke:var(--orange);stroke-width:2;stroke-linecap:round}
.arc-flow{fill:none;stroke:#fff;stroke-width:2;stroke-dasharray:3 12;stroke-linecap:round;opacity:0}
.map-svg circle{transform-box:fill-box;transform-origin:center}   /* necesario para escalar círculos SVG */
```
```js
const setup = (root, { q }) =>
  gsap.timeline({ repeat: -1, repeatDelay: 0.8 })
    .from(q('.city'), { scale: 0, duration: 0.4, ease: 'back.out(3)', stagger: 0.1 })
    .fromTo(q('.arc-fg'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.25 }, 0.3)
    .fromTo(q('.arc-flow'), { autoAlpha: 0, strokeDashoffset: 0 }, { autoAlpha: 1, strokeDashoffset: -90, duration: 3, ease: 'none' }, '>-0.2')
```
Variante sin bucle (recomendada si el mapa es principal): quita `repeat/repeatDelay` y deja el flujo con un `gsap.to(...strokeDashoffset, {repeat:-1})` pausado fuera de pantalla.

### 30 · Zoom de cámara a una región — INTERACTIVA
Clic en una región: se anima el `viewBox` del SVG (la “cámara”) y el resto se atenúa; clic fuera para volver.
```js
// zona = { x, y, w, h } en coordenadas del viewBox; relación del viewBox = 300:160
const zoomBox = ({ x, y, w, h }) => {
  const W = w + 30, H = (W * 160) / 300
  return `${x + w / 2 - W / 2} ${y + h / 2 - H / 2} ${W} ${H}`
}

const setup = (root, { q, on, cleanup }) => {
  const svg = q('.map-svg')[0], zones = q('.zone')
  let current = null
  const go = (k) => {
    current = k
    gsap.to(svg, { attr: { viewBox: k ? zoomBox(ZONES[k]) : '0 0 300 160' }, duration: 1, ease: 'power3.inOut', overwrite: 'auto' })
    gsap.to(zones, { opacity: (i, el) => (!k || el.dataset.k === k ? 1 : 0.25), duration: 0.5, overwrite: 'auto' })
  }
  zones.forEach((z) => on(z, 'click', (e) => { e.stopPropagation(); go(current === z.dataset.k ? null : z.dataset.k) }))
  on(svg, 'click', () => current && go(null))
  cleanup(() => gsap.killTweensOf([svg, zones]))
}
```
Usa `vector-effect: non-scaling-stroke` en los trazos de las regiones para que no engorden al hacer zoom. Si el mapa es un globo 3D (Globe.gl) o Mapbox/Leaflet, **no uses esta receta**: usa la cámara nativa (`pointOfView` / `flyTo`) y anima solo la UI alrededor.

---

## 4B. PARTE B — 14 detalles premium (botones, controles, tabla, KPI)

Microinteracciones **discretas** para los elementos de un reporte. Casi todas son **interactivas** (no devuelven timeline; usan `on(...)` del patrón de §3). Reglas comunes a esta parte:

- Aplícalas a los **componentes reales** (botón primario, selector de periodo, tabs, filtros, tabla…); no crees componentes nuevos solo para animar.
- Todo elemento interactivo debe ser un `<button>`/`<input>` nativo y funcionar con **teclado y foco**: donde la receta use `mouseenter/mouseleave`, añade también `focus/blur`.
- Si el proyecto ya tiene estilos de botón/tabs/switch, **conserva su aspecto**: la receta aporta solo el comportamiento (los CSS mostrados son el mínimo para que funcione).
- Las posiciones calculadas con `offsetLeft/offsetWidth` (píldora, subrayado) deben **recalcularse en `resize`** y tras cargar fuentes (`document.fonts.ready`).

| # | Efecto | Aplicar en | Plugins |
|---|---|---|---|
| P01 | Botón con relleno que barre | Botón secundario / exportar | — |
| P03 | Botón: cargando → éxito | Botón que lanza una acción asíncrona (generar/guardar) | DrawSVG |
| P04 | Botón con flecha que avanza | Enlaces “Ver más / Ver detalle” | — |
| P05 | Borde con luz recorriendo | Acción principal o dato nuevo destacado (usar con moderación) | — |
| P07 | Copiar → confirmación | Botones de copiar enlace/valor | DrawSVG |
| P08 | Control segmentado con píldora | Selector de periodo/vista (Día-Semana-Mes) | — |
| P09 | Pestañas con subrayado deslizante | Tabs de secciones | — |
| P10 | Interruptor con rebote leve | Switches de configuración/comparación | — |
| P11 | Casillas con check dibujado | Filtros múltiples | DrawSVG |
| P12 | Buscador que se expande | Búsqueda en cabecera/tabla | — |
| P13 | Menú desplegable escalonado | Selectores/dropdowns | — |
| P19 | Notificación con pop y campana | Contador de alertas | — |
| P21 | Podio top 3 | Top 3 de un ranking | — |
| P26 | Tabla ordenable con Flip | Tablas con orden por columna | Flip |

### P01 · Botón con relleno que barre
```html
<button class="x-btn x-sweep"><i class="x-fill"></i><span>Exportar reporte</span></button>
```
```css
.x-btn{position:relative;overflow:hidden;border-radius:10px;padding:10px 22px;font-weight:600}
.x-sweep{background:#fff;border:1.5px solid var(--orange);color:var(--orange-d)}
.x-sweep span{position:relative;z-index:1}
.x-fill{position:absolute;inset:0;background:var(--orange)}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const b = q('.x-btn')[0], fill = q('.x-fill')[0], txt = q('.x-sweep span')[0]
  gsap.set(fill, { yPercent: 101 })
  const tl = gsap.timeline({ paused: true })
    .to(fill, { yPercent: 0, duration: 0.35, ease: 'power3.out' })
    .to(txt, { color: '#fff', duration: 0.2 }, 0)
  on(b, 'mouseenter', () => tl.play()); on(b, 'mouseleave', () => tl.reverse())
  on(b, 'focus', () => tl.play());      on(b, 'blur', () => tl.reverse())
  cleanup(() => tl.kill())
}
```
`play()/reverse()` sobre un mismo timeline evita saltos si el cursor entra y sale rápido.

### P03 · Botón: cargando → éxito
Se contrae a círculo, gira mientras procesa y dibuja un check. **En el proyecto real**, el tramo “procesando” debe durar lo que tarde la promesa (ver nota).
```html
<button class="x-btn x-stat">
  <span class="x-lab">Generar reporte</span>
  <span class="x-spin"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></span>
  <svg class="x-chk" viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg>
</button>
```
```css
.x-stat{width:170px;height:42px;padding:0;display:grid;place-items:center;background:var(--orange);color:#fff;border:0}
.x-stat > *{grid-area:1/1}
.x-spin{width:22px;height:22px;display:block} .x-spin svg{width:100%;height:100%}
.x-spin circle{fill:none;stroke:#fff;stroke-width:3;stroke-dasharray:40 20;stroke-linecap:round}
.x-chk{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const btn = q('.x-stat')[0], lab = q('.x-lab')[0], spin = q('.x-spin')[0], chk = q('.x-chk')[0]
  gsap.set([spin, chk], { autoAlpha: 0 })
  const tl = gsap.timeline({ paused: true })
    .to(lab, { autoAlpha: 0, duration: 0.15 })
    .to(btn, { width: 42, duration: 0.3, ease: 'power3.inOut' }, 0)
    .to(spin, { autoAlpha: 1, duration: 0.15 })
    .to(spin, { rotation: 540, duration: 1.1, ease: 'none' }, '<')   // ← sustituir por giro en bucle mientras la promesa está pendiente
    .to(spin, { autoAlpha: 0, duration: 0.1 })
    .to(btn, { backgroundColor: '#12c7c7', duration: 0.25 }, '<')
    .set(chk, { autoAlpha: 1 })
    .fromTo(chk.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' })
    .to(btn, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 }, '<')
    .to({}, { duration: 1 })
    .to(chk, { autoAlpha: 0, duration: 0.15 })
    .to(btn, { width: 170, backgroundColor: '#ff7a1a', duration: 0.3, ease: 'power3.inOut' }, '<')
    .to(lab, { autoAlpha: 1, duration: 0.2 })
  on(btn, 'click', () => { if (!tl.isActive()) tl.restart() })
  cleanup(() => tl.kill())
}
```
**Nota (real):** divide en dos timelines: `start` (contraer + girar en bucle, `repeat:-1`) al hacer clic, y `finish(ok)` (check/éxito o error) cuando la promesa resuelva. Deshabilita el botón mientras esté activo y añade `aria-busy`. Fija el ancho inicial con el ancho real del botón (no 170 px).

### P04 · Botón con flecha que avanza
```html
<button class="x-btn x-link"><span class="x-t">Ver detalle de sede</span>
  <svg class="x-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button>
```
```css
.x-link{background:none;color:var(--aqua-d);border:1.5px solid var(--aqua);display:inline-flex;align-items:center;gap:8px;overflow:visible}
.x-arrow{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const b = q('.x-link')[0], t = q('.x-t')[0], a = q('.x-arrow')[0]
  const enter = () => { gsap.to(a, { x: 7, duration: 0.4, ease: 'back.out(2.5)', overwrite: 'auto' }); gsap.to(t, { x: -3, duration: 0.3, overwrite: 'auto' }) }
  const leave = () => gsap.to([a, t], { x: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
  on(b, 'mouseenter', enter); on(b, 'mouseleave', leave); on(b, 'focus', enter); on(b, 'blur', leave)
  cleanup(() => gsap.killTweensOf([a, t]))
}
```

### P05 · Borde con luz recorriendo — BUCLE
Un destello cónico gira detrás de la cara del botón. Úsalo en **un solo** elemento por pantalla.
```html
<div class="x-beam"><i class="x-beam-spin"></i><span class="x-beam-face">Ver resumen ejecutivo</span></div>
```
```css
.x-beam{position:relative;border-radius:12px;padding:2px;overflow:hidden;display:inline-block}
.x-beam-spin{position:absolute;left:50%;top:50%;width:260px;height:260px;background:conic-gradient(from 0deg,transparent 0 62%,var(--aqua) 82%,var(--orange) 100%)}
.x-beam-face{position:relative;display:block;background:#fff;border-radius:10px;padding:10px 22px;font-weight:600}
```
```js
const setup = (root, { q }) => {
  const s = q('.x-beam-spin')[0]
  gsap.set(s, { xPercent: -50, yPercent: -50 })
  return gsap.timeline({ repeat: -1 }).fromTo(s, { rotation: 0 }, { rotation: 360, duration: 4, ease: 'none' })
}
```
Hacerlo con `mountEffect(..., { loop: true })`. Con `prefers-reduced-motion` queda estático. El “botón” real debe ir dentro de `.x-beam-face` (o ser él) para que el foco/clic funcionen.

### P07 · Copiar → confirmación
```html
<button class="x-btn x-copy"><span class="x-ico">
  <svg class="x-i1" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>
  <svg class="x-i2" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>
  <span class="x-ctext">Copiar enlace</span></button>
```
```css
.x-copy{display:inline-flex;align-items:center;gap:10px;background:var(--orange);color:#fff;border:0}
.x-ico{position:relative;width:18px;height:18px;display:block}
.x-ico svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const b = q('.x-copy')[0], i1 = q('.x-i1')[0], i2 = q('.x-i2')[0], t = q('.x-ctext')[0]
  gsap.set(i2, { autoAlpha: 0, scale: 0.4 })
  const tl = gsap.timeline({ paused: true })
    .to(i1, { scale: 0.3, rotation: -90, autoAlpha: 0, duration: 0.2 })
    .call(() => { t.textContent = '¡Copiado!' })
    .to(b, { backgroundColor: '#12c7c7', duration: 0.2 }, '<')
    .to(i2, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' })
    .fromTo(i2.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, '<')
    .to({}, { duration: 1.2 })
    .to(i2, { autoAlpha: 0, scale: 0.4, duration: 0.2 })
    .call(() => { t.textContent = 'Copiar enlace' })
    .to(b, { backgroundColor: '#ff7a1a', duration: 0.2 }, '<')
    .to(i1, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' })
  on(b, 'click', async () => {
    try { await navigator.clipboard.writeText(VALOR_A_COPIAR) } catch { return }   // solo confirmar si realmente copió
    if (!tl.isActive()) tl.restart()
  })
  cleanup(() => tl.kill())
}
```
Añade `aria-live="polite"` al texto para anunciar “¡Copiado!”. Los textos deben venir de i18n si el proyecto lo usa.

### P08 · Control segmentado con píldora
```html
<div class="x-seg"><i class="x-pill"></i><button class="on">Día</button><button>Semana</button><button>Mes</button></div>
```
```css
.x-seg{position:relative;display:inline-flex;background:#efe5d8;border-radius:12px;padding:4px}
.x-seg button{position:relative;z-index:1;background:none;border:0;padding:7px 14px;font-weight:600;color:var(--muted);border-radius:9px;transition:color .2s}
.x-seg button.on{color:var(--ink)}
.x-pill{position:absolute;left:0;top:4px;bottom:4px;width:50px;background:#fff;border-radius:9px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const pill = q('.x-pill')[0], btns = q('.x-seg button')
  const place = (b, anim) => gsap[anim ? 'to' : 'set'](pill, { x: b.offsetLeft, width: b.offsetWidth, duration: 0.45, ease: 'back.out(1.3)', overwrite: 'auto' })
  const current = () => btns.find((b) => b.classList.contains('on'))
  place(current(), false)
  btns.forEach((b) => on(b, 'click', () => { btns.forEach((x) => x.classList.toggle('on', x === b)); place(b, true) /* + emitir el cambio de periodo al proyecto */ }))
  on(window, 'resize', () => place(current(), false))
  cleanup(() => gsap.killTweensOf(pill))
}
```
(`on` se usa con `window` igual que con elementos.) Usa `role="radiogroup"` / `aria-pressed` según el caso.

### P09 · Pestañas con subrayado deslizante
```html
<div class="x-tabbar"><button class="on">Resumen</button><button>Detalle</button><button>Historial</button><i class="x-ind"></i></div>
<div class="x-panel"><b>48 215</b><span>envíos este mes</span></div>
```
```css
.x-tabbar{position:relative;display:flex;gap:6px;border-bottom:1px solid var(--line)}
.x-tabbar button{background:none;border:0;padding:8px 12px;color:var(--muted);font-weight:600}
.x-tabbar button.on{color:var(--orange-d)}
.x-ind{position:absolute;left:0;bottom:-1px;height:3px;width:60px;background:var(--orange);border-radius:3px}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const ind = q('.x-ind')[0], tabs = q('.x-tabbar button'), panel = q('.x-panel')[0]
  const place = (b, anim) => gsap[anim ? 'to' : 'set'](ind, { x: b.offsetLeft, width: b.offsetWidth, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
  place(tabs[0], false)
  tabs.forEach((b, i) => on(b, 'click', () => {
    tabs.forEach((x) => x.classList.toggle('on', x === b)); place(b, true)
    gsap.timeline()
      .to(panel.children, { y: -8, autoAlpha: 0, duration: 0.15, stagger: 0.03 })
      .call(() => renderPanel(i))                                  // ← el proyecto pinta aquí el contenido real de la pestaña i
      .fromTo(panel.children, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' })
  }))
  cleanup(() => gsap.killTweensOf([ind, ...panel.children]))
}
```
Si el contenido de cada pestaña es complejo, anima solo el **contenedor** (`panel`) en vez de sus hijos. Usa `role="tablist"/"tab"/"tabpanel"`.

### P10 · Interruptor con rebote leve
```html
<button class="x-sw" role="switch" aria-checked="false"><i class="x-knob"></i></button>
```
```css
.x-sw{position:relative;width:50px;height:28px;border:0;border-radius:99px;background:#d9cfc2;padding:0}
.x-knob{position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.25)}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const sw = q('.x-sw')[0], knob = q('.x-knob')[0]
  let checked = false
  on(sw, 'click', () => {
    checked = !checked; sw.setAttribute('aria-checked', checked)
    gsap.to(knob, { x: checked ? 22 : 0, duration: 0.55, ease: 'elastic.out(1,0.6)', overwrite: 'auto' })
    gsap.fromTo(knob, { scaleX: 1.35 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' })
    gsap.to(sw, { backgroundColor: checked ? '#12c7c7' : '#d9cfc2', duration: 0.25 })
  })
  cleanup(() => gsap.killTweensOf([sw, knob]))
}
```
Si el switch es un `<input type="checkbox">` del proyecto, escucha `change` y lee `input.checked` en lugar de llevar tu propio estado.

### P11 · Casillas con check dibujado
```html
<div class="x-cb on"><span class="x-box"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><label>Retrasos críticos</label></div>
```
```css
.x-cb{display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none}
.x-box{width:22px;height:22px;border:2px solid #e4d6c6;border-radius:7px;background:#fff;display:grid;place-items:center}
.x-box svg{width:14px;height:14px;fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const rows = q('.x-cb')
  const paint = (r, state, anim) => {
    const box = r.querySelector('.x-box'), p = r.querySelector('path')
    gsap.to(box, { backgroundColor: state ? '#ff7a1a' : '#fff', borderColor: state ? '#ff7a1a' : '#e4d6c6', duration: anim ? 0.2 : 0 })
    gsap.to(p, { drawSVG: state ? '100%' : '0%', duration: anim ? 0.3 : 0, ease: 'power2.out' })
    if (anim && state) gsap.fromTo(box, { scale: 0.8 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' })
  }
  rows.forEach((r) => { paint(r, r.classList.contains('on'), false); on(r, 'click', () => { r.classList.toggle('on'); paint(r, r.classList.contains('on'), true) }) })
  cleanup(() => gsap.killTweensOf(root.querySelectorAll('.x-box, .x-box path')))
}
```
Con checkboxes reales: oculta el `<input>` visualmente (no con `display:none`), mantén `<label for>` y reacciona a `change`.

### P12 · Buscador que se expande
```html
<div class="x-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>
  <input type="text" aria-label="Buscar sede"/><span class="x-slabel">Buscar sede…</span></div>
```
```css
.x-search{position:relative;width:60%;height:44px;background:#fff;border:1.5px solid var(--line);border-radius:12px;display:flex;align-items:center;padding:0 12px}
.x-search svg{width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2;stroke-linecap:round}
.x-search input{flex:1;border:0;outline:0;background:none;font:inherit;padding:8px 8px 0 10px;height:100%;min-width:0}
.x-slabel{position:absolute;left:40px;top:12px;color:var(--muted);pointer-events:none;transform-origin:left center}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const wrap = q('.x-search')[0], input = q('input')[0], lab = q('.x-slabel')[0]
  const open = (v) => {
    gsap.to(wrap, { width: v ? '92%' : '60%', boxShadow: v ? '0 0 0 4px rgba(18,199,199,.25)' : '0 0 0 0px rgba(18,199,199,0)', duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    gsap.to(lab, { y: v ? -18 : 0, scale: v ? 0.78 : 1, color: v ? '#0b8f98' : '#6b7280', duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  }
  on(input, 'focus', () => open(true))
  on(input, 'blur', () => !input.value && open(false))
  cleanup(() => gsap.killTweensOf([wrap, lab]))
}
```
Anima el ancho solo si el contenedor tiene espacio; en cabeceras apretadas expande hacia un lado (`transform-origin`) o usa `flex-basis`. Si el input ya trae `placeholder`, quita `.x-slabel` y anima solo el halo.

### P13 · Menú desplegable escalonado
```html
<div class="x-dd">
  <button class="x-ddb"><span>Región: Todas</span><i>⌄</i></button>
  <div class="x-menu"><button>Todas</button><button>Norteamérica</button>…</div>
</div>
```
```css
.x-dd{position:relative}
.x-ddb{width:190px;display:flex;justify-content:space-between;align-items:center;background:#fff;border:1.5px solid var(--line);border-radius:10px;padding:9px 12px}
.x-ddb i{font-style:normal;color:var(--orange)}
.x-menu{position:absolute;left:0;top:calc(100% + 6px);width:190px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px;box-shadow:0 14px 28px rgba(0,0,0,.12);z-index:3}
.x-menu button{display:block;width:100%;text-align:left;background:none;border:0;padding:8px 10px;border-radius:8px}
```
```js
const setup = (root, { q, on, cleanup }) => {
  const btn = q('.x-ddb')[0], menu = q('.x-menu')[0], items = q('.x-menu button'), lab = q('.x-ddb span')[0], chev = q('.x-ddb i')[0]
  gsap.set(menu, { autoAlpha: 0 })
  let open = false
  const show = (v) => {
    open = v
    gsap.to(chev, { rotation: v ? 180 : 0, duration: 0.3 })
    if (v) {
      gsap.fromTo(menu, { autoAlpha: 0, y: -8, scaleY: 0.88, transformOrigin: '50% 0' }, { autoAlpha: 1, y: 0, scaleY: 1, duration: 0.3, ease: 'power3.out' })
      gsap.fromTo(items, { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05, delay: 0.05 })
    } else gsap.to(menu, { autoAlpha: 0, y: -6, duration: 0.2 })
  }
  on(btn, 'click', (e) => { e.stopPropagation(); show(!open) })
  items.forEach((it) => on(it, 'click', () => { lab.textContent = 'Región: ' + it.textContent; show(false) /* + emitir selección */ }))
  on(document, 'click', () => open && show(false))          // cerrar al hacer clic fuera
  on(document, 'keydown', (e) => e.key === 'Escape' && open && show(false))
  cleanup(() => gsap.killTweensOf([menu, chev, ...items]))
}
```
Si el proyecto ya usa un dropdown de librería (Radix, Headless UI, Material…), **no lo reemplaces**: anima su panel con `autoAlpha/y/stagger` cuando se abra (en el evento de apertura de la librería).

### P19 · Notificación con pop y campana
```html
<span class="x-bell"><svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17zM10 20a2 2 0 0 0 4 0"/></svg><b class="x-bd">3</b></span>
```
```css
.x-bell{position:relative;width:40px;height:40px;display:grid;place-items:center;background:#fff;border:1px solid var(--line);border-radius:12px}
.x-bell svg{width:22px;height:22px;fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.x-bd{position:absolute;right:-7px;top:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:var(--orange);color:#fff;font-size:11px;display:grid;place-items:center;border:2px solid var(--bg)}
```
```js
// Llamar a onNewAlert(n) cuando llegue una alerta real; setCount(0) al limpiar.
export function createBell(root) {
  const bell = root.querySelector('.x-bell svg'), bd = root.querySelector('.x-bd')
  return {
    onNewAlert(n) {
      bd.textContent = n
      gsap.fromTo(bd, { scale: 1.8 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,0.4)', overwrite: 'auto' })
      gsap.fromTo(bell, { rotation: 0 }, { keyframes: { rotation: [-16, 13, -9, 5, 0], easeEach: 'power1.inOut' }, duration: 0.7, transformOrigin: '50% 0%', overwrite: 'auto' })
    },
    setCount(n) { bd.textContent = n; gsap.to(bd, { scale: n ? 1 : 0, duration: 0.25, overwrite: 'auto' }) },
    destroy() { gsap.killTweensOf([bell, bd]) },
  }
}
```
Anuncia con `aria-live="polite"` el cambio de contador. Evita sacudir la campana más de una vez cada ~2 s si llegan alertas en ráfaga.

### P21 · Podio top 3
Las columnas suben (la 2.ª, la 3.ª y por último la 1.ª), la medalla cae con rebote y las cifras cuentan.
```html
<div class="x-podium">
  <div class="x-pc" data-v="131870"><div class="x-pn"><em class="x-medal">2</em><span>Europa</span><b>0</b></div><i class="x-pbar" style="height:62%"></i></div>
  <div class="x-pc" data-v="264010"><div class="x-pn"><em class="x-medal">1</em><span>Asia</span><b>0</b></div><i class="x-pbar" style="height:92%"></i></div>
  <div class="x-pc" data-v="98440"><div class="x-pn"><em class="x-medal">3</em><span>Norteamérica</span><b>0</b></div><i class="x-pbar" style="height:44%"></i></div>
</div>  <!-- orden visual: 2.º, 1.º, 3.º; altura de barra proporcional al valor -->
```
```css
.x-podium{display:flex;justify-content:center;align-items:flex-end;gap:10px;height:200px;padding:12px 16px 0}
.x-pc{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
.x-pn{text-align:center;display:flex;flex-direction:column;align-items:center;font-size:12px;padding-bottom:6px}
.x-medal{font-style:normal;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#ffb066,var(--orange));color:#fff;font-weight:700;display:grid;place-items:center;font-size:12px;margin-bottom:4px}
.x-pbar{width:100%;border-radius:8px 8px 0 0;background:linear-gradient(var(--aqua),#b9efef)}
```
```js
const setup = (root, { q }) => {
  const cols = q('.x-pc'), tl = gsap.timeline()
  ;[0, 2, 1].forEach((ci, k) => {                       // orden de aparición: 2.º, 3.º, 1.º
    const c = cols[ci], o = { v: 0 }, num = c.querySelector('b')
    tl.from(c.querySelector('.x-pbar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'power3.out' }, k * 0.3)
      .from(c.querySelector('.x-pn'), { y: 40, autoAlpha: 0, duration: 0.5 }, k * 0.3 + 0.4)
      .from(c.querySelector('.x-medal'), { y: -50, autoAlpha: 0, duration: 0.7, ease: 'bounce.out' }, k * 0.3 + 0.55)
      .to(o, { v: +c.dataset.v, duration: 0.9, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(o.v).toLocaleString('es-MX') } }, k * 0.3 + 0.4)
  })
  return tl
}
```
Ordena los datos por valor y colócalos en el orden 2-1-3; calcula `height` de la barra como `valor/máximo*100%`. Formatea números con el locale del proyecto.

### P26 · Tabla ordenable con Flip
```html
<table><thead><tr><th data-k="n">Sede <i>↑</i></th><th data-k="s">Envíos <i>↑</i></th><th data-k="p">A tiempo <i>↑</i></th></tr></thead>
<tbody><tr data-n="Róterdam" data-s="12480" data-p="94.1"><td>Róterdam</td><td>12 480</td><td>94.1%</td></tr>…</tbody></table>
```
```css
.x-sort th{text-align:left;padding:8px;color:var(--muted);font-weight:600;cursor:pointer;user-select:none}
.x-sort th.on{color:var(--orange-d)} .x-sort th i{display:inline-block;font-style:normal}
.x-sort td{padding:10px 8px;font-variant-numeric:tabular-nums;background:#fbf6ef}   /* fondo opaco: evita ver filas superpuestas al moverse */
```
```js
import { gsap, Flip } from './gsap'

const setup = (root, { q, on, cleanup }) => {
  const body = q('tbody')[0], ths = q('th'), dirs = {}, anims = []
  ths.forEach((th) => on(th, 'click', () => {
    const k = th.dataset.k, dir = (dirs[k] = -(dirs[k] || -1))      // alterna asc/desc
    const rows = [...body.children], state = Flip.getState(rows)
    rows.sort((a, b) => (k === 'n' ? a.dataset.n.localeCompare(b.dataset.n) : a.dataset[k] - b.dataset[k]) * dir)
        .forEach((r) => body.appendChild(r))
    anims.push(Flip.from(state, { duration: 0.55, ease: 'power2.inOut' }))
    ths.forEach((t) => t.classList.toggle('on', t === th))
    gsap.to(th.querySelector('i'), { rotation: dir > 0 ? 0 : 180, duration: 0.3 })
  }))
  cleanup(() => anims.forEach((a) => a.kill()))
}
```
Si el proyecto ordena con un framework/librería de tabla (React Table, AG Grid, etc.): captura `Flip.getState(rows)` **antes** del cambio de orden y llama a `Flip.from` en el efecto posterior al render (mismo patrón antes/después). En tablas muy grandes (>100 filas) anima solo las visibles. Añade `aria-sort` al `th` activo.

---

## 5. Checklist de entrega (para Claude)

- [ ] Tabla propuesta *efecto → componente* presentada al usuario antes de editar.
- [ ] Plugins registrados una sola vez en un módulo común.
- [ ] Cada efecto con limpieza al desmontar (`ctx.revert()`, listeners, `delayedCall`, intervalos).
- [ ] Datos reales conectados (sin cifras de ejemplo).
- [ ] Colores mapeados a los tokens del proyecto; estados semánticos coherentes.
- [ ] `prefers-reduced-motion` respetado; estado final legible sin animación.
- [ ] Bucles solo corren con el elemento visible.
- [ ] Probado en navegador: sin errores en consola, sin saltos al cambiar filtros a mitad de animación.
- [ ] Resumen final: qué efecto quedó dónde y qué se descartó (con motivo).

## 6. Fuera de esta lista

Las demás animaciones de los muestrarios (P03 y P04) no fueron seleccionadas y **no deben aplicarse** salvo que el usuario lo pida. Esto incluye, del P04, entre otras: onda desde el clic, magnético sutil, tooltip deslizante, tarjeta con elevación, resplandor del cursor, ticker, barras con brillo, indicador en vivo, dona, cruz de línea, puntos que cambian de vista, calendario de calor, clúster, arcos con partículas, zoom con panel, aviso con «Deshacer», aprobado, encabezado de reporte y encabezado que se contrae.
