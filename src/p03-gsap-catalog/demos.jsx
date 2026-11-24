import { gsap, Flip, Draggable, ScrollTrigger } from '../shared/gsap'

const ORANGE = '#ff7a1a'
const AQUA = '#12c7c7'
const RED = '#e5484d'

/*
 * Cada demo: { id, title, tag: 'dashboard'|'mapa'|'ambos', desc, plugins, loop?, view, setup }
 * - view: elemento JSX estático (React no lo vuelve a tocar → seguro mutarlo con GSAP).
 * - setup(root, { q, on, cleanup }): devuelve un timeline (pausado, lo controla la tarjeta)
 *   o nada si la demo es interactiva (se maneja con eventos vía `on`).
 */

const MAP_BG = 'stage map'

// Serie → polilínea (mismo nº de puntos para poder hacer morph).
const MP_SETS = {
  a: { label: 'Envíos', color: ORANGE, data: [30, 42, 38, 55, 60, 52, 70, 78, 74, 90] },
  b: { label: 'Ingresos', color: AQUA, data: [60, 58, 70, 66, 50, 62, 48, 40, 52, 35] },
  c: { label: 'Retrasos', color: RED, data: [20, 35, 25, 80, 30, 28, 55, 22, 18, 24] },
}
const mpLine = (data) => data.map((v, i) => `${i ? 'L' : 'M'}${10 + i * 31.1} ${110 - v}`).join(' ')
const mpArea = (data) => `${mpLine(data)} L290 120 L10 120 Z`

const CITIES = [[40, 110, 'CDMX'], [110, 50, 'NY'], [170, 70, 'MAD'], [235, 40, 'DXB'], [265, 115, 'SYD']]
const ARCS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4], [1, 3]].map(([a, b]) => {
  const [x1, y1] = CITIES[a], [x2, y2] = CITIES[b]
  return `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 45} ${x2} ${y2}`
})

const ZONES = {
  NA: { x: 10, y: 20, w: 100, h: 70, n: 'Norteamérica' },
  EU: { x: 130, y: 15, w: 60, h: 50, n: 'Europa' },
  AS: { x: 195, y: 20, w: 95, h: 75, n: 'Asia' },
  AF: { x: 125, y: 80, w: 60, h: 70, n: 'África' },
  LA: { x: 55, y: 100, w: 60, h: 50, n: 'Latam' },
  OC: { x: 215, y: 110, w: 70, h: 40, n: 'Oceanía' },
}
const zoomBox = ({ x, y, w, h }) => {
  const W = w + 30, H = (W * 160) / 300
  return `${x + w / 2 - W / 2} ${y + h / 2 - H / 2} ${W} ${H}`
}
const bars = [62, 85, 48, 92, 70, 55, 78, 40]
const regions = ['Norteamérica', 'Europa', 'Asia', 'Latam', 'África', 'Oceanía']

const odoItems = ['4', '8', ',', '2', '1', '5']
const heatCells = Array.from({ length: 60 }, (_, i) => {
  const x = i % 12, y = Math.floor(i / 12)
  return Math.max(0, Math.min(1, 0.5 + 0.35 * Math.sin(x / 2.2) + 0.25 * Math.cos(y * 1.3 + x / 4)))
})

export const DEMOS = [
  {
    id: 'odometro', title: 'Odómetro de dígitos', tag: 'dashboard', plugins: ['timeline', 'stagger'],
    desc: 'Cada dígito rueda como un contador mecánico. Ideal para el KPI principal.',
    view: (
      <div className="stage center">
        <div className="odo">
          <span className="cur">$</span>
          {odoItems.map((d, i) =>
            d === ',' ? <span key={i} className="cur">,</span> : (
              <span className="col" key={i}>
                <span className="reel" data-d={d}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <b key={n}>{n}</b>)}</span>
              </span>
            ),
          )}
          <span className="cur">K</span>
        </div>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline().fromTo(q('.reel'), { yPercent: 0 }, { yPercent: (i, el) => -el.dataset.d * 10, duration: 1.8, ease: 'power3.out', stagger: 0.18 }),
  },
  {
    id: 'barras', title: 'Barras con rebote', tag: 'dashboard', plugins: ['stagger', 'ease'],
    desc: 'Las barras crecen en cascada con un leve rebote y sus valores aparecen después.',
    view: (
      <div className="stage bars">
        {bars.map((v, i) => (
          <div key={i} className="bar-col"><span className="bar-val">{v}</span><i style={{ height: v + '%' }} /></div>
        ))}
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .from(q('.bar-col i'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'back.out(1.6)', stagger: 0.08 })
        .from(q('.bar-val'), { y: 10, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0.3),
  },
  {
    id: 'anillo', title: 'Anillo de progreso', tag: 'dashboard', plugins: ['DrawSVG'],
    desc: 'Cumplimiento de meta: el trazo se dibuja y el porcentaje cuenta al mismo ritmo.',
    view: (
      <div className="stage center">
        <div className="ring-wrap">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" className="ring-bg" />
            <circle cx="60" cy="60" r="50" className="ring-fg" />
          </svg>
          <span className="ring-num">78%</span>
        </div>
      </div>
    ),
    setup: (root, { q }) => {
      const num = q('.ring-num')[0], o = { v: 0 }
      return gsap.timeline()
        .fromTo(q('.ring-fg'), { drawSVG: '0%' }, { drawSVG: '78%', duration: 1.8, ease: 'power3.out' })
        .to(o, { v: 78, duration: 1.8, ease: 'power3.out', onUpdate: () => { num.textContent = Math.round(o.v) + '%' } }, 0)
    },
  },
  {
    id: 'gauge', title: 'Medidor con aguja', tag: 'dashboard', plugins: ['DrawSVG', 'elastic'],
    desc: 'Aguja con rebote elástico y arco que se llena. Para SLA, temperatura, capacidad.',
    view: (
      <div className="stage center">
        <svg viewBox="0 0 200 120" className="gauge">
          <defs>
            <linearGradient id="gg1" x1="0" x2="1"><stop offset="0" stopColor={AQUA} /><stop offset="1" stopColor={ORANGE} /></linearGradient>
          </defs>
          <path className="g-bg" d="M20 100 A80 80 0 0 1 180 100" />
          <path className="g-fg" d="M20 100 A80 80 0 0 1 180 100" stroke="url(#gg1)" />
          <line className="g-needle" x1="100" y1="100" x2="100" y2="34" />
          <circle cx="100" cy="100" r="7" className="g-hub" />
        </svg>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .fromTo(q('.g-needle'), { rotation: -90, svgOrigin: '100 100' }, { rotation: 40, svgOrigin: '100 100', duration: 1.8, ease: 'elastic.out(1,0.5)' })
        .fromTo(q('.g-fg'), { drawSVG: '0%' }, { drawSVG: '72%', duration: 1.2, ease: 'power3.out' }, 0),
  },
  {
    id: 'ping', title: 'Pulso de alerta (radar ping)', tag: 'mapa', loop: true, plugins: ['timeline', 'stagger'],
    desc: 'Anillos que se expanden desde cada marcador. El naranja marca el que requiere atención.',
    view: (
      <div className={MAP_BG}>
        {[{ x: 22, y: 40, hot: 1 }, { x: 58, y: 28 }, { x: 72, y: 66 }, { x: 36, y: 74 }].map((m, i) => (
          <div key={i} className={`mk${m.hot ? ' hot' : ''}`} style={{ left: m.x + '%', top: m.y + '%' }}>
            <i className="pr" /><i className="pr" /><i className="pd" />
          </div>
        ))}
      </div>
    ),
    setup: (root, { q }) => {
      const tl = gsap.timeline({ repeat: -1 })
      q('.mk').forEach((mk, i) =>
        tl.fromTo(mk.querySelectorAll('.pr'), { scale: 1, opacity: 0.7 }, { scale: 3.4, opacity: 0, duration: 1.8, ease: 'power2.out', stagger: 0.5 }, i * 0.25))
      return tl
    },
  },
  {
    id: 'ruta', title: 'Vehículo recorriendo una ruta', tag: 'mapa', loop: true, plugins: ['MotionPath', 'DrawSVG'],
    desc: 'Un punto sigue la curva mientras la ruta se traza detrás. Seguimiento de flota o envíos.',
    view: (
      <div className={MAP_BG}>
        <svg viewBox="0 0 300 160" className="map-svg">
          <path className="route-bg" d="M20 130 C80 20, 160 20, 150 90 S250 150, 280 30" />
          <path className="route-fg" d="M20 130 C80 20, 160 20, 150 90 S250 150, 280 30" />
          <circle cx="20" cy="130" r="5" className="origin" />
          <circle cx="280" cy="30" r="5" className="dest" />
          <circle className="mover" r="7" />
        </svg>
      </div>
    ),
    setup: (root, { q }) => {
      const path = q('.route-bg')[0]
      return gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
        .fromTo(q('.route-fg'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 3, ease: 'power1.inOut' })
        .fromTo(q('.mover'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0)
        .to(q('.mover'), { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 3, ease: 'power1.inOut' }, 0)
        .to(q('.mover'), { scale: 1.6, autoAlpha: 0, duration: 0.4 })
    },
  },
  {
    id: 'ruta-pines', title: 'Ruta con paradas', tag: 'mapa', plugins: ['DrawSVG', 'timeline'],
    desc: 'La línea se traza y cada parada aparece justo cuando el trazo la alcanza.',
    view: (
      <div className={MAP_BG}>
        <svg viewBox="0 0 300 160" className="map-svg">
          <path className="route-fg" d="M25 120 L90 60 L160 95 L230 40 L280 70" />
          {[[25, 120, 'A'], [90, 60, 'B'], [160, 95, 'C'], [230, 40, 'D'], [280, 70, 'E']].map(([x, y, t]) => (
            <g key={t} className="stop">
              <circle cx={x} cy={y} r="9" className="stop-c" />
              <text x={x} y={y + 3.5} textAnchor="middle" className="stop-t">{t}</text>
            </g>
          ))}
        </svg>
      </div>
    ),
    setup: (root, { q }) => {
      const tl = gsap.timeline()
      tl.fromTo(q('.route-fg'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.4, ease: 'none' })
      q('.stop').forEach((s, i) => tl.from(s, { scale: 0, duration: 0.45, ease: 'back.out(3)' }, [0, 0.68, 1.27, 1.95, 2.3][i]))
      return tl
    },
  },
  {
    id: 'pines-caida', title: 'Marcadores que caen', tag: 'mapa', plugins: ['stagger', 'bounce'],
    desc: 'Los pines caen con rebote y su sombra se asienta. Para cargar sedes o incidentes.',
    view: (
      <div className={MAP_BG}>
        {[[18, 40], [34, 66], [52, 34], [66, 62], [80, 38], [46, 78]].map(([x, y], i) => (
          <div key={i} className="drop-wrap" style={{ left: x + '%', top: y + '%' }}>
            <div className="shadow" />
            <div className="drop"><i /></div>
          </div>
        ))}
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .from(q('.drop'), { y: -150, autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: { each: 0.14, from: 'random' } })
        .from(q('.shadow'), { scale: 0, autoAlpha: 0, duration: 0.5, stagger: { each: 0.14, from: 'random' } }, 0.35),
  },
  {
    id: 'callout', title: 'Ficha que se despliega del pin', tag: 'mapa', plugins: ['clipPath', 'timeline'],
    desc: 'Un pin se activa, una línea lo conecta y la ficha de detalle se revela con recorte.',
    view: (
      <div className={MAP_BG}>
        <div className="co-pin" />
        <div className="co-line" />
        <div className="co-box">
          <b>Hub Róterdam</b>
          <span>12 480 envíos · 94% a tiempo</span>
          <em>Ver detalle →</em>
        </div>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .from(q('.co-pin'), { scale: 0, duration: 0.5, ease: 'back.out(3)' })
        .from(q('.co-line'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.4, ease: 'power2.out' })
        .fromTo(q('.co-box'), { clipPath: 'inset(0 100% 0 0 round 12px)' }, { clipPath: 'inset(0 0% 0 0 round 12px)', duration: 0.6, ease: 'power3.out' })
        .from(q('.co-box > *'), { y: 8, autoAlpha: 0, stagger: 0.1, duration: 0.35 }, '-=0.25'),
  },
  {
    id: 'heat', title: 'Mapa de calor con onda', tag: 'ambos', plugins: ['stagger grid'],
    desc: 'Celdas que aparecen desde el centro y una onda de brillo. Para cobertura o densidad.',
    view: (
      <div className="stage center">
        <div className="heat">
          {heatCells.map((v, i) => (
            <i key={i} style={{ background: gsap.utils.interpolate(AQUA, ORANGE, v) }} />
          ))}
        </div>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .from(q('.heat i'), { scale: 0, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)', stagger: { grid: [5, 12], from: 'center', amount: 1.2 } })
        .to(q('.heat i'), { scale: 1.18, duration: 0.25, yoyo: true, repeat: 1, stagger: { grid: [5, 12], from: 0, amount: 1.2 } }, '+=0.2'),
  },
  {
    id: 'flipcard', title: 'Tarjeta KPI con reverso 3D', tag: 'dashboard', interactive: true, plugins: ['rotationY'],
    desc: 'Clic para voltear: frente con la cifra, reverso con el detalle.',
    view: (
      <div className="stage center">
        <div className="fc">
          <div className="fc-in">
            <div className="fc-face front"><small>Retraso medio</small><b>9.4 h</b><span>Clic para ver detalle</span></div>
            <div className="fc-face back"><small>Peor sede</small><b>Lagos</b><span>14.2 h · 62% a tiempo</span></div>
          </div>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      let flipped = false
      const inner = q('.fc-in')[0]
      on(q('.fc')[0], 'click', () => {
        flipped = !flipped
        gsap.to(inner, { rotationY: flipped ? 180 : 0, duration: 0.8, ease: 'power3.inOut' })
      })
      cleanup(() => gsap.killTweensOf(inner))
    },
  },
  {
    id: 'badge', title: 'Estado que cambia (semáforo)', tag: 'dashboard', loop: true, plugins: ['timeline'],
    desc: 'La etiqueta cambia de color y el texto se desliza al pasar de OK a alerta a crítico.',
    view: (
      <div className="stage center">
        <span className="badge"><i className="bdot" /><em className="blabel">Operativo</em></span>
      </div>
    ),
    setup: (root, { q }) => {
      const badge = q('.badge')[0], label = q('.blabel')[0], dot = q('.bdot')[0]
      const states = [
        { t: 'Operativo', bg: '#d9f7f6', fg: '#0b6f78' },
        { t: 'Alerta', bg: '#ffe9d6', fg: '#b34700' },
        { t: 'Crítico', bg: '#ffe0e1', fg: '#b4232a' },
      ]
      const tl = gsap.timeline({ repeat: -1 })
      states.forEach((s) => {
        tl.to(badge, { backgroundColor: s.bg, color: s.fg, duration: 0.4 })
          .to(label, { yPercent: -120, autoAlpha: 0, duration: 0.18 }, '<')
          .call(() => { label.textContent = s.t })
          .fromTo(label, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.25 })
          .fromTo(dot, { scale: 1 }, { scale: 1.7, duration: 0.18, yoyo: true, repeat: 3 }, '<')
          .to({}, { duration: 1 })
      })
      return tl
    },
  },
  {
    id: 'skeleton', title: 'Carga con skeleton → contenido', tag: 'dashboard', loop: true, plugins: ['timeline'],
    desc: 'Esqueleto con brillo mientras carga y luego el contenido real entra escalonado.',
    view: (
      <div className="stage sk">
        <div className="real">
          <b>Entregas a tiempo</b>
          <div className="rbars">{[70, 85, 60, 92, 78].map((v, i) => <i key={i} style={{ height: v + '%' }} />)}</div>
          <span>Actualizado hace 1 min</span>
        </div>
        <div className="skel">
          <div className="skl w60" /><div className="skl h40" /><div className="skl w40" />
          <span className="shine" />
        </div>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline({ repeat: -1, repeatDelay: 1.2 })
        .fromTo(q('.shine'), { xPercent: -100 }, { xPercent: 100, duration: 0.9, ease: 'none', repeat: 1 })
        .to(q('.skel'), { autoAlpha: 0, duration: 0.3 })
        .from(q('.real > *'), { y: 14, autoAlpha: 0, stagger: 0.12, duration: 0.5 }, '-=0.1')
        .to({}, { duration: 1.5 }),
  },
  {
    id: 'spotlight', title: 'Foco: atenuar al resto', tag: 'ambos', interactive: true, plugins: ['hover'],
    desc: 'Al pasar sobre una región el resto se atenúa. Sirve en mapas, tablas y leyendas.',
    view: (
      <div className="stage spot">
        {regions.map((r, i) => (
          <div key={r} className="tile"><small>{r}</small><b>{(40 + i * 13) % 97}%</b></div>
        ))}
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const tiles = q('.tile')
      tiles.forEach((t) => {
        on(t, 'mouseenter', () => {
          gsap.to(tiles.filter((x) => x !== t), { opacity: 0.3, scale: 0.94, duration: 0.35, overwrite: 'auto' })
          gsap.to(t, { opacity: 1, scale: 1.06, duration: 0.35, overwrite: 'auto' })
        })
        on(t, 'mouseleave', () => gsap.to(tiles, { opacity: 1, scale: 1, duration: 0.35, overwrite: 'auto' }))
      })
      cleanup(() => gsap.killTweensOf(tiles))
    },
  },
  {
    id: 'toasts', title: 'Notificaciones apiladas', tag: 'dashboard', interactive: true, plugins: ['Flip'],
    desc: 'Las alertas entran desde un lado y las demás se reacomodan solas con Flip.',
    view: (
      <div className="stage toast-stage">
        <button className="btn sm">+ Nueva alerta</button>
        <div className="toasts" />
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const box = q('.toasts')[0]
      const msgs = ['Retraso en Lagos', 'Meta cumplida: Europa', 'Ruta desviada #482', 'Nuevo hub: Auckland', 'Capacidad al 92%']
      let n = 0
      const calls = []
      const dismiss = (el) =>
        gsap.to(el, { x: 80, autoAlpha: 0, duration: 0.35, onComplete: () => {
          const s = Flip.getState(box.children); el.remove(); Flip.from(s, { duration: 0.35, ease: 'power2.out' })
        } })
      const push = () => {
        const el = document.createElement('div')
        el.className = 'toast' + (n % 2 ? ' warn' : '')
        el.innerHTML = `<i></i><span>${msgs[n++ % msgs.length]}</span>`
        const s = Flip.getState(box.children)
        box.prepend(el)
        Flip.from(s, { duration: 0.4, ease: 'power2.out' })
        gsap.from(el, { x: 80, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' })
        while (box.children.length > 4) box.lastElementChild.remove()
        calls.push(gsap.delayedCall(3, () => el.isConnected && dismiss(el)))
      }
      on(q('.btn')[0], 'click', push)
      calls.push(gsap.delayedCall(0.4, push))
      cleanup(() => { calls.forEach((c) => c.kill()); gsap.killTweensOf(box.children); box.replaceChildren() })
    },
  },
  {
    id: 'scramble', title: 'Texto que se descifra', tag: 'ambos', loop: true, plugins: ['ScrambleText'],
    desc: 'Al cambiar de filtro o región el título se “descifra” letra por letra.',
    view: (
      <div className="stage center">
        <div className="scr"><small>Región seleccionada</small><h4 className="scr-t">Norteamérica</h4></div>
      </div>
    ),
    setup: (root, { q }) => {
      const el = q('.scr-t')[0]
      const tl = gsap.timeline({ repeat: -1 })
      ;['Europa', 'Asia-Pacífico', 'Latinoamérica', 'Norteamérica'].forEach((w) =>
        tl.to(el, { scrambleText: { text: w, chars: 'upperCase', revealDelay: 0.2, speed: 0.6 }, duration: 1.1 }).to({}, { duration: 1.2 }))
      return tl
    },
  },
  {
    id: 'sparkline', title: 'Línea con punto seguidor', tag: 'dashboard', plugins: ['DrawSVG', 'MotionPath'],
    desc: 'Se dibuja la tendencia, un punto la recorre y al final aparece el cambio porcentual.',
    view: (
      <div className="stage center">
        <svg viewBox="0 0 300 120" className="spark">
          <defs>
            <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={AQUA} stopOpacity=".35" /><stop offset="1" stopColor={AQUA} stopOpacity="0" /></linearGradient>
          </defs>
          <path className="sp-area" d="M10 90 C40 80 60 40 90 55 S140 100 170 60 S230 20 290 30 L290 120 L10 120 Z" fill="url(#sg1)" />
          <path className="sp-line" d="M10 90 C40 80 60 40 90 55 S140 100 170 60 S230 20 290 30" />
          <circle className="sp-dot" r="6" />
          <text className="sp-label" x="290" y="16" textAnchor="end">▲ +18%</text>
        </svg>
      </div>
    ),
    setup: (root, { q }) => {
      const line = q('.sp-line')[0]
      return gsap.timeline()
        .fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 2, ease: 'power2.inOut' })
        .fromTo(q('.sp-dot'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0)
        .to(q('.sp-dot'), { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5] }, duration: 2, ease: 'power2.inOut' }, 0)
        .from(q('.sp-area'), { autoAlpha: 0, duration: 0.8 }, 1.4)
        .from(q('.sp-label'), { y: 10, autoAlpha: 0, duration: 0.4, ease: 'back.out(2)' }, '-=0.4')
    },
  },
  {
    id: 'acordeon', title: 'Panel expandible', tag: 'dashboard', interactive: true, plugins: ['height:auto'],
    desc: 'Filas que se despliegan con altura automática. Solo una abierta a la vez.',
    view: (
      <div className="stage acc">
        {['Retrasos por sede', 'Costos por ruta', 'Incidentes abiertos'].map((t, i) => (
          <div className="acc-item" key={t}>
            <button className="acc-h"><span>{t}</span><i>⌄</i></button>
            <div className="acc-b"><p>{['Lagos y El Cairo concentran el 41% de los retrasos del mes.', 'Shanghái → Róterdam sube 6% por congestión portuaria.', '3 incidentes abiertos, 1 crítico en Johannesburgo.'][i]}</p></div>
          </div>
        ))}
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const items = q('.acc-item')
      const toggle = (it, open) => {
        gsap.to(it.querySelector('.acc-b'), { height: open ? 'auto' : 0, duration: 0.5, ease: 'power3.inOut' })
        gsap.to(it.querySelector('.acc-h i'), { rotation: open ? 180 : 0, duration: 0.4 })
        it.classList.toggle('open', open)
      }
      gsap.set(q('.acc-b'), { height: 0 })
      items.forEach((it) => on(it.querySelector('.acc-h'), 'click', () => {
        const willOpen = !it.classList.contains('open')
        items.forEach((o) => o !== it && o.classList.contains('open') && toggle(o, false))
        toggle(it, willOpen)
      }))
      toggle(items[0], true)
      cleanup(() => gsap.killTweensOf(root.querySelectorAll('.acc-b, .acc-h i')))
    },
  },
  {
    id: 'radar', title: 'Barrido de radar', tag: 'mapa', loop: true, plugins: ['timeline'],
    desc: 'Un haz barre el área y cada objetivo destella cuando el haz lo cruza.',
    view: (
      <div className="stage center">
        <div className="radar">
          <i className="rg g1" /><i className="rg g2" />
          <div className="sweep" />
          {[[40, 0.6], [130, 0.35], [215, 0.75], [280, 0.5]].map(([a, r]) => (
            <b key={a} className="blip" data-a={a}
              style={{ left: 50 + 50 * r * Math.sin((a * Math.PI) / 180) + '%', top: 50 - 50 * r * Math.cos((a * Math.PI) / 180) + '%' }} />
          ))}
        </div>
      </div>
    ),
    setup: (root, { q }) => {
      const tl = gsap.timeline({ repeat: -1 })
      tl.fromTo(q('.sweep'), { rotation: 0 }, { rotation: 360, duration: 4, ease: 'none' }, 0)
      q('.blip').forEach((b) =>
        tl.fromTo(b, { scale: 0.3, autoAlpha: 0.95 }, { scale: 2, autoAlpha: 0, duration: 1, ease: 'power2.out', immediateRender: false }, (b.dataset.a / 360) * 4))
      return tl
    },
  },
  {
    id: 'tabla', title: 'Tabla con fila actualizada', tag: 'dashboard', plugins: ['stagger', 'highlight'],
    desc: 'Filas que entran en cascada y una celda que cambia de valor con destello.',
    view: (
      <div className="stage tbl">
        <table>
          <thead><tr><th>Región</th><th>Envíos</th><th>A tiempo</th></tr></thead>
          <tbody>
            {[['Norteamérica', '152 300', '94.1'], ['Europa', '131 870', '91.2'], ['Asia', '264 010', '89.7'], ['Latam', '98 440', '85.3']].map(([a, b, c]) => (
              <tr key={a}><td>{a}</td><td>{b}</td><td className="val">{c}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    setup: (root, { q }) => {
      const rows = q('tbody tr'), cell = rows[1].querySelector('.val'), o = { v: 91.2 }
      return gsap.timeline()
        .from(rows, { x: -24, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' })
        .fromTo(rows[1], { backgroundColor: 'rgba(255,122,26,0)' }, { backgroundColor: 'rgba(255,122,26,.22)', duration: 0.35, yoyo: true, repeat: 1 }, '+=0.3')
        .to(o, { v: 93.8, duration: 0.7, ease: 'power2.out', onUpdate: () => { cell.textContent = o.v.toFixed(1) + '%' } }, '<')
        .fromTo(cell, { color: '#1f2937' }, { color: '#0b8f98', fontWeight: 700, duration: 0.3 }, '<')
    },
  },
  {
    id: 'drag', title: 'Widgets arrastrables con inercia', tag: 'ambos', interactive: true, plugins: ['Draggable', 'Inertia'],
    desc: 'Arrastra y suelta: se levantan al tomarlos y siguen con inercia al soltar.',
    view: (
      <div className="stage drag">
        {[['Envíos', '48 215', 8, 14], ['SLA', '94%', 44, 46], ['Costo', '$2.4M', 70, 12]].map(([t, v, x, y]) => (
          <div className="dw" key={t} style={{ left: x + '%', top: y + '%' }}><small>{t}</small><b>{v}</b></div>
        ))}
      </div>
    ),
    setup: (root, { q, cleanup }) => {
      const inst = Draggable.create(q('.dw'), {
        type: 'x,y', bounds: root.querySelector('.drag'), inertia: true,
        onPress() { gsap.to(this.target, { scale: 1.06, boxShadow: '0 18px 30px rgba(255,122,26,.28)', duration: 0.2 }) },
        onRelease() { gsap.to(this.target, { scale: 1, boxShadow: '0 4px 12px rgba(0,0,0,.08)', duration: 0.3 }) },
      })
      cleanup(() => inst.forEach((d) => d.kill()))
    },
  },
  {
    id: 'race', title: 'Ranking animado (bar race)', tag: 'dashboard', loop: true, plugins: ['Flip', 'counter'],
    desc: 'El ranking se reordena en vivo: las barras crecen y las filas intercambian lugar.',
    view: (
      <div className="stage race">
        {regions.slice(0, 5).map((r, i) => (
          <div className="rrow" key={r} data-v={90 - i * 11}>
            <span className="rname">{r}</span>
            <span className="rtrack"><i style={{ width: 90 - i * 11 + '%' }} /></span>
            <b className="rval">{90 - i * 11}</b>
          </div>
        ))}
      </div>
    ),
    setup: (root, { q }) => {
      const rows = q('.rrow')
      const state = rows.map((r) => ({ r, v: +r.dataset.v, shown: +r.dataset.v }))
      const step = () => {
        state.forEach((s) => { s.v = Math.max(15, Math.min(100, s.v + (Math.random() - 0.5) * 40)) })
        const before = Flip.getState(rows)
        ;[...state].sort((a, b) => b.v - a.v).forEach((s) => root.querySelector('.race').appendChild(s.r))
        Flip.from(before, { duration: 0.8, ease: 'power2.inOut' })
        state.forEach((s) => {
          gsap.to(s.r.querySelector('.rtrack i'), { width: s.v + '%', duration: 0.8, ease: 'power2.inOut' })
          gsap.to(s, { shown: s.v, duration: 0.8, onUpdate: () => { s.r.querySelector('.rval').textContent = Math.round(s.shown) } })
        })
      }
      return gsap.timeline({ repeat: -1 }).call(step).to({}, { duration: 2 })
    },
  },

  // ───────── Lo que CSS no hace bien ─────────
  {
    id: 'morph', title: 'Gráfico que se transforma', tag: 'dashboard', interactive: true, plugins: ['MorphSVG'],
    desc: 'Al cambiar de métrica la línea se deforma hacia la nueva serie (y cambia de color) en lugar de saltar.',
    view: (
      <div className="stage morph">
        <div className="mini-chips">
          {Object.entries(MP_SETS).map(([k, s]) => <button key={k} data-k={k} className={k === 'a' ? 'on' : ''}>{s.label}</button>)}
        </div>
        <svg viewBox="0 0 300 120" preserveAspectRatio="none">
          <path className="mp-area" d={mpArea(MP_SETS.a.data)} fill={ORANGE} fillOpacity=".15" />
          <path className="mp-line" d={mpLine(MP_SETS.a.data)} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const line = q('.mp-line')[0], area = q('.mp-area')[0], btns = q('.mini-chips button')
      btns.forEach((b) => on(b, 'click', () => {
        const s = MP_SETS[b.dataset.k]
        btns.forEach((x) => x.classList.toggle('on', x === b))
        gsap.to(line, { morphSVG: mpLine(s.data), stroke: s.color, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' })
        gsap.to(area, { morphSVG: mpArea(s.data), fill: s.color, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' })
      }))
      cleanup(() => gsap.killTweensOf([line, area]))
    },
  },
  {
    id: 'scrub', title: 'Línea de tiempo controlada por slider', tag: 'ambos', interactive: true, plugins: ['timeline', 'progress()'],
    desc: 'Arrastra el slider para “viajar en el tiempo”: puntos, hora y total responden al instante, hacia adelante o atrás.',
    view: (
      <div className="stage scrubw">
        <div className="sc-top"><span className="sc-time">06:00</span><b className="sc-val">0</b></div>
        <div className="sc-dots">
          {[0.9, 0.5, 1.1, 0.7, 1.3, 0.6, 1, 0.8, 1.2, 0.55].map((s, i) => <i key={i} data-s={s} />)}
        </div>
        <input className="sc-range" type="range" min="0" max="100" defaultValue="0" />
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const dots = q('.sc-dots i'), time = q('.sc-time')[0], val = q('.sc-val')[0], o = { v: 0, t: 6 }
      const tl = gsap.timeline({ paused: true })
        .fromTo(dots, { scale: 0.2, backgroundColor: AQUA }, { scale: (i, el) => +el.dataset.s, backgroundColor: ORANGE, ease: 'none', stagger: { each: 0.08 } })
        .to(o, { v: 48215, t: 22, ease: 'none', duration: tl_dur(dots), onUpdate: () => { val.textContent = Math.round(o.v).toLocaleString('es-MX'); time.textContent = String(Math.round(o.t)).padStart(2, '0') + ':00' } }, 0)
      const range = q('.sc-range')[0]
      on(range, 'input', () => gsap.to(tl, { progress: range.value / 100, duration: 0.35, ease: 'power2.out', overwrite: true }))
      gsap.to(tl, { progress: 0.45, duration: 1.4, ease: 'power2.inOut', delay: 0.3, onUpdate: () => { range.value = tl.progress() * 100 } })
      cleanup(() => { gsap.killTweensOf(tl); tl.kill() })
    },
  },
  {
    id: 'scroll-scrub', title: 'Animación ligada al scroll', tag: 'dashboard', interactive: true, plugins: ['ScrollTrigger scrub'],
    desc: 'Desplázate dentro del recuadro: la barra y la cifra avanzan exactamente con el scroll (no es tiempo, es posición).',
    view: (
      <div className="stage scroller">
        <div className="sx-inner">
          <div className="sx-sticky"><small>Avance del mes</small><b className="sx-val">0%</b><div className="sx-bar"><i /></div></div>
          <p className="sx-hint">↓ desplázate dentro de este recuadro ↓</p>
        </div>
      </div>
    ),
    setup: (root, { q }) => {
      const sc = q('.scroller')[0] || root.querySelector('.scroller'), val = q('.sx-val')[0], o = { v: 0 }
      const tl = gsap.timeline({ defaults: { ease: 'none' } })
        .fromTo(q('.sx-bar i'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1 })
        .to(o, { v: 100, onUpdate: () => { val.textContent = Math.round(o.v) + '%' } }, 0)
        .fromTo(q('.sx-val'), { color: AQUA }, { color: ORANGE }, 0)
      ScrollTrigger.create({ scroller: sc, trigger: q('.sx-inner')[0], start: 'top top', end: 'bottom bottom', scrub: 0.4, animation: tl })
    },
  },
  {
    id: 'tilt', title: 'Tarjeta con inclinación 3D', tag: 'dashboard', interactive: true, plugins: ['quickTo', 'transformPerspective'],
    desc: 'La tarjeta se inclina hacia el cursor con un brillo que la sigue. Suave y sin “tirones”.',
    view: (
      <div className="stage center tilt-stage">
        <div className="tilt"><small>Ingresos</small><b>$2.4M</b><span>▲ 12% vs mes anterior</span><i className="glare" /></div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = q('.tilt-stage')[0] || root.querySelector('.tilt-stage'), card = q('.tilt')[0], glare = q('.glare')[0]
      gsap.set(card, { transformPerspective: 600 })
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3' })
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3' })
      const gx = gsap.quickTo(glare, 'x', { duration: 0.4, ease: 'power3' })
      const gy = gsap.quickTo(glare, 'y', { duration: 0.4, ease: 'power3' })
      on(stage, 'mousemove', (e) => {
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
        ry(px * 28); rx(-py * 28); gx(px * r.width); gy(py * r.height)
      })
      on(stage, 'mouseleave', () => { rx(0); ry(0); gx(0); gy(0) })
      cleanup(() => gsap.killTweensOf([card, glare]))
    },
  },
  {
    id: 'parallax', title: 'Parallax de capas en el mapa', tag: 'mapa', interactive: true, plugins: ['quickTo'],
    desc: 'Al mover el cursor, cada capa se desplaza distinto y el mapa gana profundidad.',
    view: (
      <div className="stage plx">
        <div className="pl l1" data-d="0.15" />
        <div className="pl l2" data-d="0.4"><i className="bl a" /><i className="bl b" /><i className="bl c" /></div>
        <div className="pl l3" data-d="0.9">
          {[[22, 38], [48, 58], [70, 30], [60, 74]].map(([x, y], i) => <b key={i} className="pn" style={{ left: x + '%', top: y + '%' }} />)}
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = root.querySelector('.plx'), layers = q('.pl')
      const tos = layers.map((l) => ({ x: gsap.quickTo(l, 'x', { duration: 0.7, ease: 'power3' }), y: gsap.quickTo(l, 'y', { duration: 0.7, ease: 'power3' }), d: +l.dataset.d }))
      on(stage, 'mousemove', (e) => {
        const r = stage.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
        tos.forEach((t) => { t.x(-px * 36 * t.d); t.y(-py * 36 * t.d) })
      })
      on(stage, 'mouseleave', () => tos.forEach((t) => { t.x(0); t.y(0) }))
      cleanup(() => gsap.killTweensOf(layers))
    },
  },
  {
    id: 'arcos', title: 'Conexiones entre ciudades', tag: 'mapa', loop: true, plugins: ['DrawSVG', 'stagger', 'dash flow'],
    desc: 'Arcos que se trazan en cascada y luego muestran flujo de tráfico con trazo discontinuo en movimiento.',
    view: (
      <div className={MAP_BG}>
        <svg viewBox="0 0 300 160" className="map-svg">
          {ARCS.map((d, i) => <path key={'b' + i} d={d} className="arc-base" />)}
          {ARCS.map((d, i) => <path key={'f' + i} d={d} className="arc-fg" />)}
          {ARCS.map((d, i) => <path key={'w' + i} d={d} className="arc-flow" />)}
          {CITIES.map(([x, y, n]) => (
            <g key={n} className="city"><circle cx={x} cy={y} r="5" className="city-c" /><text x={x} y={y + 15} textAnchor="middle" className="city-t">{n}</text></g>
          ))}
        </svg>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline({ repeat: -1, repeatDelay: 0.8 })
        .from(q('.city'), { scale: 0, duration: 0.4, ease: 'back.out(3)', stagger: 0.1 })
        .fromTo(q('.arc-fg'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.25 }, 0.3)
        .fromTo(q('.arc-flow'), { autoAlpha: 0, strokeDashoffset: 0 }, { autoAlpha: 1, strokeDashoffset: -90, duration: 3, ease: 'none' }, '>-0.2'),
  },
  {
    id: 'lista-grid', title: 'Cambiar vista lista ↔ cuadrícula', tag: 'dashboard', interactive: true, plugins: ['Flip'],
    desc: 'Los elementos viajan a su nueva posición en vez de “teletransportarse”. Con CSS puro es imposible.',
    view: (
      <div className="stage lg">
        <div className="mini-chips"><button data-v="grid" className="on">Cuadrícula</button><button data-v="list">Lista</button></div>
        <div className="lg-box grid">
          {['Róterdam', 'Shanghái', 'Singapur', 'Sídney', 'Dubái', 'Lagos'].map((n, i) => (
            <div className="lg-item" key={n}><b>{n}</b><span>{(98 - i * 4.3).toFixed(1)}%</span></div>
          ))}
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const box = q('.lg-box')[0], items = q('.lg-item'), btns = q('.mini-chips button'), anims = []
      btns.forEach((b) => on(b, 'click', () => {
        const mode = b.dataset.v
        if (box.classList.contains(mode)) return
        btns.forEach((x) => x.classList.toggle('on', x === b))
        const state = Flip.getState(items)
        box.classList.toggle('grid', mode === 'grid'); box.classList.toggle('list', mode === 'list')
        anims.push(Flip.from(state, { duration: 0.6, ease: 'power2.inOut', stagger: 0.04, absolute: true }))
      }))
      cleanup(() => anims.forEach((a) => a.kill()))
    },
  },
  {
    id: 'zoom', title: 'Zoom de cámara a una región', tag: 'mapa', interactive: true, plugins: ['attr viewBox'],
    desc: 'Clic en una región: la “cámara” del mapa SVG se acerca con ease suave y el resto se atenúa. Clic fuera para volver.',
    view: (
      <div className={MAP_BG}>
        <svg viewBox="0 0 300 160" className="map-svg zoom-svg">
          {Object.entries(ZONES).map(([k, z]) => (
            <g key={k} className="zone" data-k={k}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="14" className="zone-r" />
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle" className="zone-t">{z.n}</text>
            </g>
          ))}
        </svg>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const svg = q('.zoom-svg')[0], zones = q('.zone')
      let current = null
      const go = (k) => {
        current = k
        gsap.to(svg, { attr: { viewBox: k ? zoomBox(ZONES[k]) : '0 0 300 160' }, duration: 1, ease: 'power3.inOut', overwrite: 'auto' })
        gsap.to(zones, { opacity: (i, el) => (!k || el.dataset.k === k ? 1 : 0.25), duration: 0.5, overwrite: 'auto' })
      }
      zones.forEach((z) => on(z, 'click', (e) => { e.stopPropagation(); go(current === z.dataset.k ? null : z.dataset.k) }))
      on(svg, 'click', () => current && go(null))
      cleanup(() => gsap.killTweensOf([svg, zones]))
    },
  },
]

// duración total de una cascada de N elementos con each=0.08 (para alinear contadores con el stagger)
function tl_dur(els) { return 0.08 * (els.length - 1) + 0.5 }
