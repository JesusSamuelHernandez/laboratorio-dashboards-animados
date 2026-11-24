// Genera las portadas (HTML autocontenidos) a partir de template.html + covers/*.js.
// Uso (desde la raíz del proyecto):  node portadas/_src/build.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'
import landTopo from 'world-atlas/land-110m.json' with { type: 'json' }

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '..')
const read = (p) => fs.readFileSync(p, 'utf8')

/* ── puntos de tierra firme para el globo (rejilla casi uniforme + punto-en-polígono) ── */
function landPoints(step = 2.2) {
  const fc = feature(landTopo, landTopo.objects.land)
  const feats = fc.type === 'FeatureCollection' ? fc.features : [fc]
  // Los anillos que cruzan el antimeridiano (±180°) traen saltos de 360° que rompen el punto-en-polígono:
  // se "desenvuelven" para que las longitudes sean continuas y luego se prueba el punto con lon, lon+360 y lon-360.
  const unwrap = (ring) => {
    const out = [ring[0].slice()]
    for (let i = 1; i < ring.length; i++) {
      let d = ring[i][0] - ring[i - 1][0]
      d -= Math.round(d / 360) * 360
      out.push([out[i - 1][0] + d, ring[i][1]])
    }
    return out
  }
  const polys = []
  for (const f of feats) {
    const g = f.geometry
    const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const rings of list) polys.push(rings.map(unwrap))
  }
  const inRing = (x, y, ring) => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
    }
    return c
  }
  const inPoly = (x, y, rings) => rings.reduce((acc, r) => (inRing(x, y, r) ? !acc : acc), false)
  const inside = (x, y) => polys.some((rings) => inPoly(x, y, rings) || inPoly(x + 360, y, rings) || inPoly(x - 360, y, rings))
  // Rejilla uniforme en espiral de Fibonacci: sin filas de latitud, la densidad es igual en toda la esfera.
  const pts = [], N = Math.round(4 * Math.PI / ((step * Math.PI / 180) ** 2)), GA = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < N; i++) {
    const lat = (Math.asin(1 - (2 * (i + 0.5)) / N) * 180) / Math.PI
    if (lat < -58 || lat > 84) continue
    const lon = ((((i * GA * 180) / Math.PI) % 360) + 540) % 360 - 180
    if (inside(lon, lat)) pts.push(Math.round(lat * 10), Math.round(lon * 10))
  }
  return pts
}

const COVERS = [
  { file: '02-red.html', src: '02-red.js', doc: 'Portada 02 · Red de datos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Redes', l1: 'Todo está', l2: '<em>conectado</em>',
    lead: 'Nodos que se buscan y enlaces que laten: la forma de una organización cuando sus datos se hablan entre sí.' },
  { file: '03-ondas.html', src: '03-ondas.js', doc: 'Portada 03 · Ondas de señal', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Señales', l1: 'La señal', l2: '<em>entre el ruido</em>',
    lead: 'Capas de información que ondulan y se leen muestra a muestra: tendencias, picos y calma. Haz clic para lanzar una onda.' },
  { file: '04-barras.html', src: '04-barras.js', doc: 'Portada 04 · Barras vivas', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Indicadores', l1: 'Pulso de', l2: '<em>negocio</em>',
    lead: 'Cada barra, un indicador en vivo. Mueve el cursor para levantar la señal o haz clic para lanzar una onda de actividad.' },
  { file: '05-globo.html', src: '05-globo.js', doc: 'Portada 05 · Globo de puntos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Mapas', l1: 'El mundo', l2: '<em>en una vista</em>',
    lead: 'Operaciones globales como arcos de luz entre ciudades. Arrastra el globo para girarlo.' },
  { file: '06-flujo.html', src: '06-flujo.js', doc: 'Portada 06 · Campo de flujo', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Flujos', l1: 'Flujos de', l2: '<em>información</em>',
    lead: 'Miles de partículas siguiendo el campo de los datos. Tu cursor es un remolino.' },
  { file: '07-lluvia.html', src: '07-lluvia.js', doc: 'Portada 07 · Lluvia', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Lluvia', l1: 'Cada gota', l2: '<em>deja su huella</em>',
    lead: 'Gotas de información que caen y se expanden en anillos que se cruzan. Roza el agua con el cursor o haz clic para una gran gota.' },
  { file: '08-sismografo.html', src: '08-sismografo.js', doc: 'Portada 08 · Sismógrafo', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Tiempo real', l1: 'Pulso en', l2: '<em>tiempo real</em>',
    lead: 'Cinco canales de señal con eventos que aparecen, vibran y se desvanecen. Haz clic para provocar un evento en todos.' },
  { file: '09-interferencia.html', src: '09-interferencia.js', doc: 'Portada 09 · Interferencia', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Ondas', l1: 'Donde las ondas', l2: '<em>se encuentran</em>',
    lead: 'Crestas y valles que se suman y se anulan. Tu cursor es una fuente más; el clic lanza un pulso.' },
  { file: '10-burbujas.html', src: '10-burbujas.js', doc: 'Portada 10 · Burbujas de datos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Burbujas', l1: 'Tamaño es', l2: '<em>importancia</em>',
    lead: 'Cada burbuja, una categoría: su tamaño sigue al dato y el cursor las aparta. Haz clic para sacudirlas.' },
  { file: '11-treemap.html', src: '11-treemap.js', doc: 'Portada 11 · Treemap vivo', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Mosaico', l1: 'Todo el negocio', l2: '<em>en un mosaico</em>',
    lead: 'Áreas proporcionales que se reacomodan cuando los valores cambian. Haz clic para reordenar el mercado.' },
  { file: '12-sankey.html', src: '12-sankey.js', doc: 'Portada 12 · Sankey animado', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Flujos', l1: 'Del origen', l2: '<em>al destino</em>',
    lead: 'Caudales que fluyen entre fuentes, procesos y consumidores. El grosor es volumen; las partículas, tráfico.' },
  { file: '13-calor.html', src: '13-calor.js', doc: 'Portada 13 · Mapa de calor', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Matriz', l1: 'Calor en', l2: '<em>cada celda</em>',
    lead: 'Una matriz de actividad barrida por una línea de tiempo. Pasa el cursor para leer una celda; haz clic para lanzar una onda.' },
  { file: '14-radar.html', src: '14-radar.js', doc: 'Portada 14 · Radar de métricas', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Radar', l1: 'Todas las métricas', l2: '<em>de un vistazo</em>',
    lead: 'Tres series sobre ocho ejes que se transforman, con un haz que revela cada vértice. Acércate a un eje para leerlo.' },
  { file: '15-clusteres.html', src: '15-clusteres.js', doc: 'Portada 15 · Clústeres', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Clústeres', l1: 'Los datos', l2: '<em>se agrupan</em>',
    lead: 'Puntos que migran entre grupos mientras los centroides se mueven. Acércate a un grupo para ver su detalle.' },
  { file: '16-colisiones.html', src: '16-colisiones.js', doc: 'Portada 16 · Colisiones que explotan', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Colisiones', l1: 'Cada choque', l2: '<em>es un estallido</em>',
    lead: 'Meteoritos que cruzan el cielo y, al colisionar, estallan como fuegos artificiales. Haz clic para lanzar dos pares contra el cursor.' },
  { file: '17-pipeline.html', src: '17-pipeline.js', doc: 'Portada 17 · Pipeline de datos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Pipeline', l1: 'Datos en', l2: '<em>circulación</em>',
    lead: 'Eventos que fluyen despacio por las etapas de un pipeline; donde se acumula cola, el nodo se vuelve naranja. Haz clic para provocar una ráfaga.' },
  { file: '18-circuitos.html', src: '18-circuitos.js', doc: 'Portada 18 · Circuitos como ciudad', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Circuitos', l1: 'La ciudad', l2: '<em>de los datos</em>',
    lead: 'Una placa vista desde el aire: chips como edificios y pulsos que recorren sus avenidas. Acerca el cursor para iluminarlos; haz clic para una sobrecarga.' },
  { file: '19-julia.html', src: '19-julia.js', doc: 'Portada 19 · Fractal de Julia', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Fractales', l1: 'Infinito', l2: '<em>en cada detalle</em>',
    lead: 'Un conjunto de Julia que respira. Mueve el cursor para cambiar su forma; haz clic para cambiar de familia.' },
  { file: '20-arbol.html', src: '20-arbol.js', doc: 'Portada 20 · Árbol fractal de datos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Fractales', l1: 'Ramificar', l2: '<em>para crecer</em>',
    lead: 'Un árbol fractal con savia de datos que sube por sus ramas. El cursor mueve el viento; el clic siembra uno nuevo.' },
  { file: '21-hierba.html', src: '21-hierba.js', doc: 'Portada 21 · Hierba de datos', theme: 'light',
    eyebrow: 'Laboratorio de visualización · Naturaleza', l1: 'Datos que', l2: '<em>se mecen</em>',
    lead: 'Un prado de briznas que ondula despacio con el viento; las semillas son puntos de dato. Acerca el cursor para apartar la hierba.' },
]

const tpl = read(path.join(here, 'template.html'))
const land = JSON.stringify(landPoints())
for (const c of COVERS) {
  let script = read(path.join(here, 'covers', c.src))
  script = script.replace('__LAND__', () => land)
  const html = tpl
    .replace('__COVER_SCRIPT__', () => script)
    .replaceAll('__THEME__', c.theme).replace('__DOC_TITLE__', c.doc).replace('__EYEBROW__', c.eyebrow)
    .replace('__LINE1__', c.l1).replace('__LINE2__', c.l2).replace('__LEAD__', c.lead)
  fs.writeFileSync(path.join(out, c.file), html)
  console.log('✓', c.file, (html.length / 1024).toFixed(0) + ' KB')
}

/* ── 01: la de anillos concéntricos (P05) con enlace de regreso a la galería ── */
let rings = read(path.resolve(out, '..', 'p05-portada', 'index.html'))
rings = rings
  .replace(/<title>[^<]*<\/title>/, '<title>Portada 01 · Anillos concéntricos</title>')
  .replace('.ctrl button {', '.ctrl button, .ctrl a { text-decoration: none; }\n    .ctrl button, .ctrl a {')
  .replace('.ctrl button:hover {', '.ctrl a:hover, .ctrl button:hover {')
  .replace('<button id="b-pause"', '<a href="index.html">☰ Portadas</a>\n    <button id="b-pause"')
  .replace(".from('.hud span, .ctrl button',", ".from('.hud span, .ctrl button, .ctrl a',")
fs.writeFileSync(path.join(out, '01-anillos.html'), rings)
console.log('✓ 01-anillos.html')
