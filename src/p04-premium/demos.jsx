import { gsap, Flip, ScrollTrigger } from '../shared/gsap'

const ORANGE = '#ff7a1a'
const AQUA = '#12c7c7'
const AQUA_D = '#0b8f98'

/* Convención igual que P03: view = JSX estático, setup(root, {q,on,cleanup}) → timeline o nada (interactivo). */

const CITIES = [[40, 110, 'CDMX'], [110, 50, 'NY'], [170, 70, 'MAD'], [235, 40, 'DXB'], [265, 115, 'SYD']]
const PAIRS = [[0, 1, '8.4K'], [1, 2, '12K'], [2, 3, '9.1K'], [3, 4, '5.6K'], [1, 3, '7.2K']]
const arcD = ([a, b]) => {
  const [x1, y1] = CITIES[a], [x2, y2] = CITIES[b]
  return `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 45} ${x2} ${y2}`
}
const arcMid = ([a, b]) => {
  const [x1, y1] = CITIES[a], [x2, y2] = CITIES[b]
  return [(x1 + x2) / 2, (y1 + y2) / 2 + (Math.min(y1, y2) - 45 - (y1 + y2) / 2) / 2]
}

const ZONES = {
  NA: { x: 10, y: 20, w: 100, h: 70, n: 'Norteamérica', v: 152300, p: 94.1 },
  EU: { x: 130, y: 15, w: 60, h: 50, n: 'Europa', v: 131870, p: 91.2 },
  AS: { x: 195, y: 20, w: 95, h: 75, n: 'Asia', v: 264010, p: 89.7 },
  AF: { x: 125, y: 80, w: 60, h: 70, n: 'África', v: 64210, p: 82.4 },
  LA: { x: 55, y: 100, w: 60, h: 50, n: 'Latam', v: 98440, p: 85.3 },
  OC: { x: 215, y: 110, w: 70, h: 40, n: 'Oceanía', v: 41500, p: 93.0 },
}
const zoomLeft = (z) => {
  const W = z.w + 50, H = (W * 160) / 300
  return `${z.x + z.w / 2 - W * 0.27} ${z.y + z.h / 2 - H / 2} ${W} ${H}`
}

const DON = [{ n: 'Marítimo', v: 40, c: AQUA }, { n: 'Aéreo', v: 25, c: ORANGE }, { n: 'Terrestre', v: 22, c: '#7fe3e3' }, { n: 'Ferroviario', v: 13, c: '#ffb066' }]
const R = 38, C = 2 * Math.PI * R

const LINE = [30, 42, 38, 55, 60, 52, 70, 78, 74, 90]
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct']

const Arrow = () => (<svg className="x-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg>)

export const DEMOS = [
  /* ───────── BOTONES ───────── */
  {
    id: 'btn-sweep', title: 'Botón con relleno que barre', tag: 'boton', interactive: true, plugins: ['timeline play/reverse'],
    desc: 'Al pasar el cursor el color sube desde abajo; al salir se retira en reversa sin saltos.',
    view: (<div className="stage center"><button className="x-btn x-sweep"><i className="x-fill" /><span>Exportar reporte</span></button></div>),
    setup: (root, { q, on, cleanup }) => {
      const b = q('.x-btn')[0], fill = q('.x-fill')[0], txt = q('.x-sweep span')[0]
      gsap.set(fill, { yPercent: 101 })
      const tl = gsap.timeline({ paused: true }).to(fill, { yPercent: 0, duration: 0.35, ease: 'power3.out' }).to(txt, { color: '#fff', duration: 0.2 }, 0)
      on(b, 'mouseenter', () => tl.play()); on(b, 'mouseleave', () => tl.reverse())
      cleanup(() => tl.kill())
    },
  },
  {
    id: 'btn-ripple', title: 'Botón con onda desde el clic', tag: 'boton', interactive: true, plugins: ['DOM dinámico'],
    desc: 'Una onda sutil nace exactamente donde haces clic. Confirma la acción sin ruido.',
    view: (<div className="stage center"><button className="x-btn x-fillbtn">Aplicar filtros</button></div>),
    setup: (root, { q, on, cleanup }) => {
      const b = q('.x-btn')[0]
      on(b, 'click', (e) => {
        const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('i')
        d.className = 'x-rip'
        Object.assign(d.style, { left: e.clientX - r.left + 'px', top: e.clientY - r.top + 'px', width: s + 'px', height: s + 'px' })
        b.appendChild(d)
        gsap.fromTo(d, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0.35 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => d.remove() })
      })
      cleanup(() => b.querySelectorAll('.x-rip').forEach((n) => n.remove()))
    },
  },
  {
    id: 'btn-status', title: 'Botón: cargando → éxito', tag: 'boton', interactive: true, plugins: ['timeline', 'DrawSVG'],
    desc: 'Se contrae a círculo, gira mientras procesa y dibuja un check al terminar. Luego se restablece.',
    view: (
      <div className="stage center">
        <button className="x-btn x-stat">
          <span className="x-lab">Generar reporte</span>
          <span className="x-spin"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg></span>
          <svg className="x-chk" viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg>
        </button>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const btn = q('.x-stat')[0], lab = q('.x-lab')[0], spin = q('.x-spin')[0], chk = q('.x-chk')[0]
      gsap.set([spin, chk], { autoAlpha: 0 })
      const tl = gsap.timeline({ paused: true })
        .to(lab, { autoAlpha: 0, duration: 0.15 })
        .to(btn, { width: 42, duration: 0.3, ease: 'power3.inOut' }, 0)
        .to(spin, { autoAlpha: 1, duration: 0.15 })
        .to(spin, { rotation: 540, duration: 1.1, ease: 'none' }, '<')
        .to(spin, { autoAlpha: 0, duration: 0.1 })
        .to(btn, { backgroundColor: AQUA, duration: 0.25 }, '<')
        .set(chk, { autoAlpha: 1 })
        .fromTo(chk.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' })
        .to(btn, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 }, '<')
        .to({}, { duration: 1 })
        .to(chk, { autoAlpha: 0, duration: 0.15 })
        .to(btn, { width: 170, backgroundColor: ORANGE, duration: 0.3, ease: 'power3.inOut' }, '<')
        .to(lab, { autoAlpha: 1, duration: 0.2 })
      on(btn, 'click', () => { if (!tl.isActive()) tl.restart() })
      cleanup(() => tl.kill())
    },
  },
  {
    id: 'btn-arrow', title: 'Botón con flecha que avanza', tag: 'boton', interactive: true, plugins: ['hover'],
    desc: 'La flecha se desliza y el texto cede un poco. Un detalle mínimo para enlaces “Ver más”.',
    view: (<div className="stage center"><button className="x-btn x-link"><span className="x-t">Ver detalle de sede</span><Arrow /></button></div>),
    setup: (root, { q, on, cleanup }) => {
      const b = q('.x-link')[0], t = q('.x-t')[0], a = q('.x-arrow')[0]
      on(b, 'mouseenter', () => { gsap.to(a, { x: 7, duration: 0.4, ease: 'back.out(2.5)', overwrite: 'auto' }); gsap.to(t, { x: -3, duration: 0.3, overwrite: 'auto' }) })
      on(b, 'mouseleave', () => gsap.to([a, t], { x: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' }))
      cleanup(() => gsap.killTweensOf([a, t]))
    },
  },
  {
    id: 'btn-beam', title: 'Borde con luz recorriendo', tag: 'boton', loop: true, plugins: ['rotation loop'],
    desc: 'Un destello recorre el contorno. Útil para destacar la acción principal o un dato nuevo.',
    view: (<div className="stage center"><div className="x-beam"><i className="x-beam-spin" /><span className="x-beam-face">Ver resumen ejecutivo</span></div></div>),
    setup: (root, { q }) => {
      const s = q('.x-beam-spin')[0]
      gsap.set(s, { xPercent: -50, yPercent: -50 })
      return gsap.timeline({ repeat: -1 }).fromTo(s, { rotation: 0 }, { rotation: 360, duration: 4, ease: 'none' })
    },
  },
  {
    id: 'btn-magnet', title: 'Magnético sutil + presión', tag: 'boton', interactive: true, plugins: ['quickTo'],
    desc: 'Se acerca apenas al cursor (no exagerado) y “se hunde” al presionar, con rebote al soltar.',
    view: (<div className="stage center"><div className="x-zone"><button className="x-btn x-fillbtn">Comparar periodos</button></div></div>),
    setup: (root, { q, on, cleanup }) => {
      const z = q('.x-zone')[0], b = q('.x-btn')[0]
      const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' })
      on(z, 'mousemove', (e) => { const r = z.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.18); yTo((e.clientY - (r.top + r.height / 2)) * 0.25) })
      on(z, 'mouseleave', () => { xTo(0); yTo(0) })
      on(b, 'pointerdown', () => gsap.to(b, { scale: 0.95, duration: 0.12, overwrite: 'auto' }))
      on(b, 'pointerup', () => gsap.to(b, { scale: 1, duration: 0.45, ease: 'back.out(3)', overwrite: 'auto' }))
      cleanup(() => gsap.killTweensOf(b))
    },
  },
  {
    id: 'btn-copy', title: 'Copiar → confirmación', tag: 'boton', interactive: true, plugins: ['DrawSVG', 'timeline'],
    desc: 'El icono de copiar se transforma en un check y el texto cambia; vuelve solo a los 1.5 s.',
    view: (
      <div className="stage center">
        <button className="x-btn x-copy">
          <span className="x-ico">
            <svg className="x-i1" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
            <svg className="x-i2" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
          </span>
          <span className="x-ctext">Copiar enlace</span>
        </button>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const b = q('.x-copy')[0], i1 = q('.x-i1')[0], i2 = q('.x-i2')[0], t = q('.x-ctext')[0]
      gsap.set(i2, { autoAlpha: 0, scale: 0.4 })
      const tl = gsap.timeline({ paused: true })
        .to(i1, { scale: 0.3, rotation: -90, autoAlpha: 0, duration: 0.2 })
        .call(() => { t.textContent = '¡Copiado!' })
        .to(b, { backgroundColor: AQUA, duration: 0.2 }, '<')
        .to(i2, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' })
        .fromTo(i2.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, '<')
        .to({}, { duration: 1.2 })
        .to(i2, { autoAlpha: 0, scale: 0.4, duration: 0.2 })
        .call(() => { t.textContent = 'Copiar enlace' })
        .to(b, { backgroundColor: ORANGE, duration: 0.2 }, '<')
        .to(i1, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' })
      on(b, 'click', () => { if (!tl.isActive()) tl.restart() })
      cleanup(() => tl.kill())
    },
  },

  /* ───────── CONTROLES ───────── */
  {
    id: 'seg', title: 'Control segmentado con píldora', tag: 'control', interactive: true, plugins: ['x / width'],
    desc: 'La selección es una píldora que se desliza y se ajusta al ancho de cada opción.',
    view: (
      <div className="stage center">
        <div className="x-seg"><i className="x-pill" /><button className="on">Día</button><button>Semana</button><button>Mes</button><button>Año</button></div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const pill = q('.x-pill')[0], btns = q('.x-seg button')
      const place = (b, anim) => gsap[anim ? 'to' : 'set'](pill, { x: b.offsetLeft, width: b.offsetWidth, duration: 0.45, ease: 'back.out(1.3)', overwrite: 'auto' })
      place(btns[0], false)
      btns.forEach((b) => on(b, 'click', () => { btns.forEach((x) => x.classList.toggle('on', x === b)); place(b, true) }))
      cleanup(() => gsap.killTweensOf(pill))
    },
  },
  {
    id: 'tabs', title: 'Pestañas con subrayado deslizante', tag: 'control', interactive: true, plugins: ['x / width', 'crossfade'],
    desc: 'El indicador viaja entre pestañas y el contenido cambia con un fundido corto.',
    view: (
      <div className="stage x-tabs">
        <div className="x-tabbar"><button className="on">Resumen</button><button>Detalle</button><button>Historial</button><i className="x-ind" /></div>
        <div className="x-panel"><b>48 215</b><span>envíos este mes</span></div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const ind = q('.x-ind')[0], tabs = q('.x-tabbar button'), panel = q('.x-panel')[0]
      const data = [['48 215', 'envíos este mes'], ['94.1%', 'entregas a tiempo'], ['+12.4%', 'vs. mes anterior']]
      const place = (b, anim) => gsap[anim ? 'to' : 'set'](ind, { x: b.offsetLeft, width: b.offsetWidth, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
      place(tabs[0], false)
      tabs.forEach((b, i) => on(b, 'click', () => {
        tabs.forEach((x) => x.classList.toggle('on', x === b)); place(b, true)
        gsap.timeline().to(panel.children, { y: -8, autoAlpha: 0, duration: 0.15, stagger: 0.03 })
          .call(() => { panel.children[0].textContent = data[i][0]; panel.children[1].textContent = data[i][1] })
          .fromTo(panel.children, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' })
      }))
      cleanup(() => gsap.killTweensOf([ind, ...panel.children]))
    },
  },
  {
    id: 'switch', title: 'Interruptor con rebote leve', tag: 'control', interactive: true, plugins: ['elastic'],
    desc: 'La perilla se estira al moverse y el riel cambia de color. Pequeño, pero se siente táctil.',
    view: (<div className="stage center"><div className="x-swrow"><button className="x-sw"><i className="x-knob" /></button><span>Comparar con mes anterior</span></div></div>),
    setup: (root, { q, on, cleanup }) => {
      const sw = q('.x-sw')[0], knob = q('.x-knob')[0]
      let on_ = false
      on(sw, 'click', () => {
        on_ = !on_
        gsap.to(knob, { x: on_ ? 22 : 0, duration: 0.55, ease: 'elastic.out(1,0.6)', overwrite: 'auto' })
        gsap.fromTo(knob, { scaleX: 1.35 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' })
        gsap.to(sw, { backgroundColor: on_ ? AQUA : '#d9cfc2', duration: 0.25 })
      })
      cleanup(() => gsap.killTweensOf([sw, knob]))
    },
  },
  {
    id: 'checks', title: 'Casillas con check dibujado', tag: 'control', interactive: true, plugins: ['DrawSVG'],
    desc: 'El check se traza al marcar y la casilla “late” un instante. Ideal para filtros múltiples.',
    view: (
      <div className="stage x-checks">
        {['Retrasos críticos', 'Solo sedes activas', 'Incluir proyecciones'].map((t, i) => (
          <div className={`x-cb${i === 0 ? ' on' : ''}`} key={t}>
            <span className="x-box"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" /></svg></span><label>{t}</label>
          </div>
        ))}
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const rows = q('.x-cb')
      const paint = (r, state, anim) => {
        const box = r.querySelector('.x-box'), p = r.querySelector('path')
        gsap.to(box, { backgroundColor: state ? ORANGE : '#fff', borderColor: state ? ORANGE : '#e4d6c6', duration: anim ? 0.2 : 0 })
        gsap.to(p, { drawSVG: state ? '100%' : '0%', duration: anim ? 0.3 : 0, ease: 'power2.out' })
        if (anim && state) gsap.fromTo(box, { scale: 0.8 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' })
      }
      rows.forEach((r) => { paint(r, r.classList.contains('on'), false); on(r, 'click', () => { r.classList.toggle('on'); paint(r, r.classList.contains('on'), true) }) })
      cleanup(() => gsap.killTweensOf(root.querySelectorAll('.x-box, .x-box path')))
    },
  },
  {
    id: 'search', title: 'Buscador que se expande', tag: 'control', interactive: true, plugins: ['label flotante'],
    desc: 'Al enfocar crece, el rótulo sube a la esquina y aparece un halo. Al vaciarse, vuelve a su tamaño.',
    view: (
      <div className="stage center">
        <div className="x-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>
          <input type="text" aria-label="Buscar sede" /><span className="x-slabel">Buscar sede…</span>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const wrap = q('.x-search')[0], input = q('input')[0], lab = q('.x-slabel')[0]
      const open = (v) => {
        gsap.to(wrap, { width: v ? '92%' : '60%', boxShadow: v ? '0 0 0 4px rgba(18,199,199,.25)' : '0 0 0 0px rgba(18,199,199,0)', duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
        gsap.to(lab, { y: v ? -18 : 0, scale: v ? 0.78 : 1, color: v ? AQUA_D : '#6b7280', duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
      }
      on(input, 'focus', () => open(true))
      on(input, 'blur', () => !input.value && open(false))
      cleanup(() => gsap.killTweensOf([wrap, lab]))
    },
  },
  {
    id: 'dropdown', title: 'Menú desplegable escalonado', tag: 'control', interactive: true, plugins: ['stagger'],
    desc: 'El menú se abre desde su origen y sus opciones entran una tras otra.',
    view: (
      <div className="stage x-dd">
        <button className="x-ddb"><span>Región: Todas</span><i>⌄</i></button>
        <div className="x-menu">{['Todas', 'Norteamérica', 'Europa', 'Asia', 'Latam'].map((r) => <button key={r}>{r}</button>)}</div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const btn = q('.x-ddb')[0], menu = q('.x-menu')[0], items = q('.x-menu button'), lab = q('.x-ddb span')[0], chev = q('.x-ddb i')[0], stage = q('.x-dd')[0]
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
      items.forEach((it) => on(it, 'click', () => { lab.textContent = 'Región: ' + it.textContent; show(false) }))
      on(stage, 'click', () => open && show(false))
      cleanup(() => gsap.killTweensOf([menu, chev, ...items]))
    },
  },
  {
    id: 'tooltip', title: 'Tooltip que se desliza entre iconos', tag: 'control', interactive: true, plugins: ['x animado'],
    desc: 'Un único tooltip viaja de un icono a otro en vez de aparecer y desaparecer. Se siente continuo.',
    view: (
      <div className="stage x-tt">
        {[['⤓', 'Descargar CSV'], ['⟳', 'Actualizar datos'], ['⚙', 'Configurar vista'], ['⤢', 'Pantalla completa']].map(([i, t]) => <button className="x-ib" key={t} data-tip={t}>{i}</button>)}
        <div className="x-tip">Tooltip</div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = q('.x-tt')[0], tip = q('.x-tip')[0], btns = q('.x-ib')
      gsap.set(tip, { autoAlpha: 0, xPercent: -50, scale: 0.9 })
      let visible = false
      btns.forEach((b) => {
        on(b, 'mouseenter', () => {
          tip.textContent = b.dataset.tip
          const s = stage.getBoundingClientRect(), r = b.getBoundingClientRect()
          const x = r.left - s.left + r.width / 2, y = r.top - s.top - 40
          if (!visible) { gsap.set(tip, { x, y: y + 6 }); visible = true }
          gsap.to(tip, { x, y, autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
        })
      })
      on(stage, 'mouseleave', () => { visible = false; gsap.to(tip, { autoAlpha: 0, scale: 0.9, duration: 0.2, overwrite: 'auto' }) })
      cleanup(() => gsap.killTweensOf(tip))
    },
  },

  /* ───────── KPI / TARJETAS ───────── */
  {
    id: 'card-hover', title: 'Tarjeta con elevación y acento', tag: 'kpi', interactive: true, plugins: ['timeline play/reverse'],
    desc: 'Se eleva, una barra de acento crece en el costado, el icono gira y la flecha avanza.',
    view: (
      <div className="stage center">
        <div className="x-card">
          <i className="x-accent" />
          <span className="x-cico">◎</span>
          <small>Hub Róterdam</small><b>12 480 envíos</b>
          <span className="x-clink">Ver detalle <Arrow /></span>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const card = q('.x-card')[0], bar = q('.x-accent')[0], ico = q('.x-cico')[0], arr = q('.x-card .x-arrow')[0]
      gsap.set(bar, { scaleY: 0, transformOrigin: '50% 0' })
      const tl = gsap.timeline({ paused: true })
        .to(card, { y: -5, boxShadow: '0 18px 30px rgba(255,122,26,.2)', duration: 0.3, ease: 'power2.out' })
        .to(bar, { scaleY: 1, duration: 0.3 }, 0)
        .to(ico, { rotation: -10, scale: 1.12, duration: 0.35, ease: 'back.out(2)' }, 0)
        .to(arr, { x: 6, duration: 0.3 }, 0)
      on(card, 'mouseenter', () => tl.play()); on(card, 'mouseleave', () => tl.reverse())
      cleanup(() => tl.kill())
    },
  },
  {
    id: 'glow', title: 'Resplandor que sigue al cursor', tag: 'kpi', interactive: true, plugins: ['CSS variables'],
    desc: 'Cada tarjeta ilumina el punto donde está el cursor. Es el detalle que más “premium” se percibe.',
    view: (
      <div className="stage x-glowgrid">
        {[['Envíos', '48 215'], ['A tiempo', '94.1%'], ['Retraso', '9.4 h'], ['Ingresos', '$2.4M']].map(([a, b]) => (<div className="x-sg" key={a}><small>{a}</small><b>{b}</b></div>))}
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = q('.x-glowgrid')[0], cards = q('.x-sg')
      on(stage, 'mousemove', (e) => cards.forEach((c) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px') }))
      on(stage, 'mouseenter', () => gsap.to(cards, { '--o': 1, duration: 0.4 }))
      on(stage, 'mouseleave', () => gsap.to(cards, { '--o': 0, duration: 0.4 }))
      cleanup(() => gsap.killTweensOf(cards))
    },
  },
  {
    id: 'ticker', title: 'Cifra que sube o baja (ticker)', tag: 'kpi', interactive: true, plugins: ['yPercent', 'direccional'],
    desc: 'El valor nuevo entra desde abajo si subió y desde arriba si bajó, con un indicador que rebota.',
    view: (
      <div className="stage center">
        <div className="x-tk">
          <small>Entregas a tiempo</small>
          <div className="x-tk-row"><div className="x-tk-win"><span>94.1%</span></div><em className="x-chip">—</em></div>
          <div className="x-tk-btns"><button className="x-mini up">▲ +1.4</button><button className="x-mini down">▼ −1.4</button></div>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const win = q('.x-tk-win')[0], chip = q('.x-chip')[0]
      let v = 94.1
      const change = (dir) => {
        v += dir * 1.4
        const old = win.lastElementChild, nu = document.createElement('span')
        nu.textContent = v.toFixed(1) + '%'; win.appendChild(nu)
        gsap.fromTo(nu, { yPercent: dir * 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' })
        gsap.to(old, { yPercent: -dir * 110, autoAlpha: 0, duration: 0.45, ease: 'power3.out', onComplete: () => old.remove() })
        chip.textContent = dir > 0 ? '▲ 1.4' : '▼ 1.4'
        gsap.fromTo(chip, { backgroundColor: dir > 0 ? '#bff3ee' : '#ffd6d8', y: dir > 0 ? 8 : -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.5)' })
        gsap.to(chip, { backgroundColor: dir > 0 ? '#e3f9f8' : '#ffe9ea', color: dir > 0 ? AQUA_D : '#b4232a', duration: 0.8 })
      }
      on(q('.up')[0], 'click', () => change(1)); on(q('.down')[0], 'click', () => change(-1))
      cleanup(() => { gsap.killTweensOf(win.children); gsap.killTweensOf(chip) })
    },
  },
  {
    id: 'progress', title: 'Barras de avance con brillo', tag: 'kpi', plugins: ['stagger', 'counter'],
    desc: 'Las barras se llenan en cascada con su porcentaje y un brillo cruza al terminar.',
    view: (
      <div className="stage x-prog">
        {[['Cumplimiento SLA', 94], ['Capacidad usada', 72], ['Meta trimestral', 58]].map(([t, v]) => (
          <div className="x-pr" key={t}><div className="x-prl"><span>{t}</span><b>0%</b></div><div className="x-prt"><i data-v={v}><u className="x-shine" /></i></div></div>
        ))}
      </div>
    ),
    setup: (root, { q }) => {
      const fills = q('.x-prt i'), nums = q('.x-prl b'), shines = q('.x-shine')
      const tl = gsap.timeline().fromTo(fills, { width: '0%' }, { width: (i, el) => el.dataset.v + '%', duration: 1.2, ease: 'power3.out', stagger: 0.15 })
      fills.forEach((f, i) => { const o = { v: 0 }; tl.to(o, { v: +f.dataset.v, duration: 1.2, ease: 'power3.out', onUpdate: () => { nums[i].textContent = Math.round(o.v) + '%' } }, i * 0.15) })
      tl.fromTo(shines, { xPercent: -120 }, { xPercent: 260, duration: 0.9, ease: 'power1.inOut', stagger: 0.15 }, '-=0.3')
      return tl
    },
  },
  {
    id: 'badge', title: 'Notificación con pop y campana', tag: 'kpi', interactive: true, plugins: ['keyframes', 'elastic'],
    desc: 'Cada alerta nueva hace “pop” en el contador y la campana se sacude.',
    view: (
      <div className="stage center">
        <div className="x-bellrow">
          <span className="x-bell"><svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17zM10 20a2 2 0 0 0 4 0" /></svg><b className="x-bd">3</b></span>
          <button className="x-mini add">+ Alerta</button><button className="x-mini clr">Limpiar</button>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const bell = q('.x-bell svg')[0], bd = q('.x-bd')[0]
      let n = 3
      const paint = () => { bd.textContent = n; gsap.to(bd, { scale: n ? 1 : 0, duration: 0.25, overwrite: 'auto' }) }
      on(q('.add')[0], 'click', () => {
        n++; bd.textContent = n
        gsap.fromTo(bd, { scale: 1.8 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,0.4)', overwrite: 'auto' })
        gsap.fromTo(bell, { rotation: 0 }, { keyframes: { rotation: [-16, 13, -9, 5, 0], easeEach: 'power1.inOut' }, duration: 0.7, transformOrigin: '50% 0%', overwrite: 'auto' })
      })
      on(q('.clr')[0], 'click', () => { n = 0; paint() })
      cleanup(() => gsap.killTweensOf([bell, bd]))
    },
  },
  {
    id: 'live', title: 'Indicador «en vivo» discreto', tag: 'kpi', loop: true, plugins: ['timeline loop'],
    desc: 'Un punto con halo respira y el “hace N s” se reinicia con un destello al llegar datos nuevos.',
    view: (
      <div className="stage center">
        <div className="x-live"><span className="x-lv"><i className="x-lr" /><i className="x-ld" /></span><b>En vivo</b><small className="x-ts">actualizado hace 0 s</small></div>
      </div>
    ),
    setup: (root, { q }) => {
      const ring = q('.x-lr')[0], ts = q('.x-ts')[0]
      let s = 0
      return gsap.timeline({ repeat: -1 })
        .call(() => { s = (s + 1) % 6; ts.textContent = `actualizado hace ${s} s`; if (!s) gsap.fromTo(ts, { color: AQUA_D, fontWeight: 700 }, { color: '#6b7280', fontWeight: 400, duration: 0.9 }) }, null, 0)
        .fromTo(ring, { scale: 1, opacity: 0.55 }, { scale: 2.8, opacity: 0, duration: 1.2, ease: 'power2.out' }, 0)
    },
  },
  {
    id: 'podium', title: 'Podio top 3', tag: 'kpi', plugins: ['timeline', 'bounce', 'counter'],
    desc: 'Variante del ranking: las columnas suben, el primer lugar al final, y la medalla cae con rebote.',
    view: (
      <div className="stage x-podium">
        {[['2', 'Europa', 131870, 62], ['1', 'Asia', 264010, 92], ['3', 'Norteamérica', 98440, 44]].map(([p, n, v, h]) => (
          <div className="x-pc" key={p} data-v={v}>
            <div className="x-pn"><em className="x-medal">{p}</em><span>{n}</span><b>0</b></div>
            <i className="x-pbar" style={{ height: h + '%' }} />
          </div>
        ))}
      </div>
    ),
    setup: (root, { q }) => {
      const cols = q('.x-pc'), tl = gsap.timeline()
      const order = [0, 2, 1]
      order.forEach((ci, k) => {
        const c = cols[ci], o = { v: 0 }, num = c.querySelector('b')
        tl.from(c.querySelector('.x-pbar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'power3.out' }, k * 0.3)
          .from(c.querySelector('.x-pn'), { y: 40, autoAlpha: 0, duration: 0.5 }, k * 0.3 + 0.4)
          .from(c.querySelector('.x-medal'), { y: -50, autoAlpha: 0, duration: 0.7, ease: 'bounce.out' }, k * 0.3 + 0.55)
          .to(o, { v: +c.dataset.v, duration: 0.9, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(o.v).toLocaleString('es-MX') } }, k * 0.3 + 0.4)
      })
      return tl
    },
  },

  /* ───────── GRÁFICOS ───────── */
  {
    id: 'donut', title: 'Dona interactiva', tag: 'grafico', plugins: ['attr', 'stroke-dasharray'],
    desc: 'La dona se dibuja al entrar; al pasar sobre un segmento (o la leyenda) crece y el centro muestra su valor.',
    view: (
      <div className="stage x-donut">
        <div className="x-dwrap">
          <svg viewBox="0 0 100 100">
            {DON.map((d, i) => {
              const start = DON.slice(0, i).reduce((s, x) => s + x.v, 0)
              return <circle key={d.n} className="x-seg-c" cx="50" cy="50" r={R} stroke={d.c} strokeWidth="14" data-i={i}
                data-len={(d.v / 100) * C - 2} style={{ strokeDashoffset: -((start / 100) * C) }} />
            })}
          </svg>
          <div className="x-dc"><b>100%</b><small>Total</small></div>
        </div>
        <ul className="x-legend">{DON.map((d, i) => <li key={d.n} data-i={i}><i style={{ background: d.c }} />{d.n}<b>{d.v}%</b></li>)}</ul>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const segs = q('.x-seg-c'), lis = q('.x-legend li'), big = q('.x-dc b')[0], sm = q('.x-dc small')[0]
      const show = (i) => {
        segs.forEach((s, j) => gsap.to(s, { attr: { 'stroke-width': j === i ? 20 : 14 }, opacity: j === i ? 1 : 0.35, duration: 0.25, overwrite: 'auto' }))
        lis.forEach((l, j) => gsap.to(l, { x: j === i ? 4 : 0, opacity: j === i ? 1 : 0.5, duration: 0.25, overwrite: 'auto' }))
        big.textContent = DON[i].v + '%'; sm.textContent = DON[i].n
      }
      const reset = () => {
        gsap.to(segs, { attr: { 'stroke-width': 14 }, opacity: 1, duration: 0.25, overwrite: 'auto' }); gsap.to(lis, { x: 0, opacity: 1, duration: 0.25, overwrite: 'auto' })
        big.textContent = '100%'; sm.textContent = 'Total'
      }
      ;[...segs, ...lis].forEach((el) => { on(el, 'mouseenter', () => show(+el.dataset.i)); on(el, 'mouseleave', reset) })
      cleanup(() => gsap.killTweensOf([...segs, ...lis]))
      return gsap.timeline().fromTo(segs, { strokeDasharray: (i, el) => `0 ${C}` }, { strokeDasharray: (i, el) => `${el.dataset.len} ${C - el.dataset.len}`, duration: 1, ease: 'power3.out', stagger: 0.15 })
        .from(q('.x-legend li'), { x: 14, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0.3)
    },
  },
  {
    id: 'crosshair', title: 'Línea con cruz y tooltip', tag: 'grafico', interactive: true, plugins: ['quickTo'],
    desc: 'La guía vertical, el punto y el tooltip siguen al cursor y se “imantan” al dato más cercano.',
    view: (
      <div className="stage x-ch">
        <svg viewBox="0 0 300 120" preserveAspectRatio="none">
          <path d={LINE.map((v, i) => `${i ? 'L' : 'M'}${10 + i * 31.1} ${110 - v}`).join(' ')} fill="none" stroke={AQUA_D} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="x-vl" /><i className="x-pt" /><div className="x-ctip">—</div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = q('.x-ch')[0], svg = q('.x-ch svg')[0], vl = q('.x-vl')[0], pt = q('.x-pt')[0], tip = q('.x-ctip')[0]
      gsap.set([vl, pt, tip], { autoAlpha: 0 }); gsap.set(pt, { xPercent: -50, yPercent: -50 }); gsap.set(tip, { xPercent: -50 })
      const X = { vl: gsap.quickTo(vl, 'x', { duration: 0.25, ease: 'power3' }), pt: gsap.quickTo(pt, 'x', { duration: 0.25, ease: 'power3' }), tip: gsap.quickTo(tip, 'x', { duration: 0.25, ease: 'power3' }) }
      const Y = { pt: gsap.quickTo(pt, 'y', { duration: 0.25, ease: 'power3' }), tip: gsap.quickTo(tip, 'y', { duration: 0.25, ease: 'power3' }) }
      on(stage, 'mousemove', (e) => {
        const r = svg.getBoundingClientRect(), s = stage.getBoundingClientRect()
        const vx = ((e.clientX - r.left) / r.width) * 300
        const i = Math.max(0, Math.min(LINE.length - 1, Math.round((vx - 10) / 31.1)))
        const px = r.left - s.left + ((10 + i * 31.1) / 300) * r.width, py = r.top - s.top + ((110 - LINE[i]) / 120) * r.height
        tip.textContent = `${MONTHS[i]} · ${LINE[i]}`
        X.vl(px); X.pt(px); X.tip(px); Y.pt(py); Y.tip(py - 34)
      })
      on(stage, 'mouseenter', () => gsap.to([vl, pt, tip], { autoAlpha: 1, duration: 0.25 }))
      on(stage, 'mouseleave', () => gsap.to([vl, pt, tip], { autoAlpha: 0, duration: 0.25 }))
      cleanup(() => gsap.killTweensOf([vl, pt, tip]))
    },
  },
  {
    id: 'dots', title: 'Puntos que cambian de vista', tag: 'grafico', interactive: true, plugins: ['stagger', 'layout por datos'],
    desc: 'Los mismos puntos se reorganizan entre dispersión, línea y columnas: el cambio de gráfico se “entiende”.',
    view: (
      <div className="stage x-dots">
        <div className="mini-chips"><button data-m="scatter">Dispersión</button><button data-m="line" className="on">Línea</button><button data-m="cols">Columnas</button></div>
        <div className="x-dotbox">{Array.from({ length: 14 }, (_, i) => <i key={i} className={i % 3 === 0 ? 'o' : ''} />)}</div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const box = q('.x-dotbox')[0], dots = q('.x-dotbox i'), btns = q('.mini-chips button')
      const vals = [30, 44, 38, 58, 52, 66, 60, 74, 70, 82, 78, 90, 86, 96]
      const lay = (m) => {
        const W = box.clientWidth - 16, H = box.clientHeight - 16
        return dots.map((d, i) => {
          if (m === 'line') return { x: (i / 13) * W, y: H - (vals[i] / 100) * H }
          if (m === 'cols') { const c = i % 3, k = Math.floor(i / 3); return { x: (c + 0.5) * (W / 3) - 8 + (k % 2) * 10 - 5, y: H - (k + 1) * (H / 6) } }
          return { x: ((i * 37) % 100) / 100 * W, y: ((i * 53) % 100) / 100 * H }
        })
      }
      const go = (m, dur = 0.9) => { const p = lay(m); gsap.to(dots, { x: (i) => p[i].x, y: (i) => p[i].y, duration: dur, ease: 'power3.inOut', stagger: { each: 0.03, from: 'start' }, overwrite: 'auto' }) }
      const p0 = lay('scatter'); gsap.set(dots, { x: (i) => p0[i].x, y: (i) => p0[i].y }); gsap.delayedCall(0.4, () => go('line'))
      btns.forEach((b) => on(b, 'click', () => { btns.forEach((x) => x.classList.toggle('on', x === b)); go(b.dataset.m) }))
      cleanup(() => gsap.killTweensOf(dots))
    },
  },
  {
    id: 'calendar', title: 'Calendario de calor con onda', tag: 'grafico', plugins: ['stagger grid', 'hover ripple'],
    desc: 'Variante del mapa de calor: aparece en diagonal y, al pasar el cursor, las vecinas se agrandan en onda.',
    view: (
      <div className="stage center">
        <div className="x-cal">{Array.from({ length: 154 }, (_, i) => {
          const x = i % 22, y = Math.floor(i / 22), v = Math.max(0, Math.min(1, 0.45 + 0.4 * Math.sin(x / 2.6 + y) * Math.cos(x / 5)))
          return <i key={i} style={{ background: gsap.utils.interpolate('#e3f9f8', v > 0.6 ? ORANGE : AQUA, Math.pow(v, 1.4)) }} />
        })}</div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const box = q('.x-cal')[0], cells = q('.x-cal i'), COLS = 22
      on(box, 'mouseover', (e) => {
        const i = cells.indexOf(e.target); if (i < 0) return
        const cx = i % COLS, cy = Math.floor(i / COLS)
        gsap.to(cells, { scale: (j) => { const d = Math.hypot((j % COLS) - cx, Math.floor(j / COLS) - cy); return d < 3.4 ? 1 + 0.7 * (1 - d / 3.4) : 1 }, duration: 0.3, overwrite: 'auto' })
      })
      on(box, 'mouseleave', () => gsap.to(cells, { scale: 1, duration: 0.4, overwrite: 'auto' }))
      cleanup(() => gsap.killTweensOf(cells))
      return gsap.timeline().from(cells, { scale: 0, autoAlpha: 0, duration: 0.4, ease: 'back.out(2)', stagger: { grid: [7, 22], from: 0, amount: 1.3 } })
    },
  },

  /* ───────── TABLA ───────── */
  {
    id: 'sort', title: 'Tabla ordenable con Flip', tag: 'reporte', interactive: true, plugins: ['Flip'],
    desc: 'Al ordenar por columna, las filas se desplazan a su nuevo lugar y la flecha del encabezado gira.',
    view: (
      <div className="stage x-sort">
        <table>
          <thead><tr><th data-k="n">Sede <i>↑</i></th><th data-k="s">Envíos <i>↑</i></th><th data-k="p">A tiempo <i>↑</i></th></tr></thead>
          <tbody>
            {[['Róterdam', 12480, 94.1], ['Shanghái', 21030, 89.7], ['Madrid', 6120, 91.2], ['Lagos', 5210, 82.4], ['Sídney', 4380, 93.0]].map(([n, s, p]) => (
              <tr key={n} data-n={n} data-s={s} data-p={p}><td>{n}</td><td>{s.toLocaleString('es-MX')}</td><td>{p}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const body = q('tbody')[0], ths = q('th'), dirs = {}
      const anims = []
      ths.forEach((th) => on(th, 'click', () => {
        const k = th.dataset.k, dir = (dirs[k] = -(dirs[k] || -1))
        const rows = [...body.children], state = Flip.getState(rows)
        rows.sort((a, b) => (k === 'n' ? a.dataset.n.localeCompare(b.dataset.n) : a.dataset[k] - b.dataset[k]) * dir).forEach((r) => body.appendChild(r))
        anims.push(Flip.from(state, { duration: 0.55, ease: 'power2.inOut' }))
        ths.forEach((t) => t.classList.toggle('on', t === th))
        gsap.to(th.querySelector('i'), { rotation: dir > 0 ? 0 : 180, duration: 0.3 })
      }))
      cleanup(() => anims.forEach((a) => a.kill()))
    },
  },

  /* ───────── MAPAS ───────── */
  {
    id: 'cluster', title: 'Clúster que se abre en pines', tag: 'mapa', interactive: true, plugins: ['timeline play/reverse', 'stagger'],
    desc: 'La burbuja “12” se abre en pines con rebote y se vuelve a plegar al hacer clic de nuevo.',
    view: (
      <div className="stage map x-cl">
        <div className="x-cluster"><b>12</b></div>
        {Array.from({ length: 8 }, (_, i) => <i key={i} className={`x-cp${i % 2 ? ' a' : ''}`} />)}
        <span className="x-cl-hint">Clic para abrir / cerrar</span>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const stage = q('.x-cl')[0], bubble = q('.x-cluster')[0], pins = q('.x-cp')
      const tl = gsap.timeline({ paused: true })
        .to(bubble, { scale: 0.2, autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
        .fromTo(pins, { x: 0, y: 0, scale: 0 }, { x: (i) => Math.cos((i / 8) * Math.PI * 2) * 78, y: (i) => Math.sin((i / 8) * Math.PI * 2) * 52, scale: 1, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.04 }, 0.1)
      on(stage, 'click', () => (tl.progress() === 0 || tl.reversed() ? tl.play() : tl.reverse()))
      cleanup(() => tl.kill())
    },
  },
  {
    id: 'arc-particles', title: 'Arcos con partículas y volumen', tag: 'mapa', loop: true, plugins: ['MotionPath', 'stagger'],
    desc: 'Partículas viajan por cada arco y una etiqueta con el volumen aparece sobre la ruta.',
    view: (
      <div className="stage map">
        <svg viewBox="0 0 300 160" className="map-svg">
          {PAIRS.map((p, i) => <path key={'b' + i} d={arcD(p)} className="arc-base pa-base" />)}
          {CITIES.map(([x, y, n]) => (<g key={n} className="city"><circle cx={x} cy={y} r="5" className="city-c" /><text x={x} y={y + 15} textAnchor="middle" className="city-t">{n}</text></g>))}
          {PAIRS.map((p, i) => { const [mx, my] = arcMid(p); return (<g key={'l' + i} className="vol"><rect x={mx - 14} y={my - 8} width="28" height="14" rx="7" className="vol-r" /><text x={mx} y={my + 2.5} textAnchor="middle" className="vol-t">{p[2]}</text></g>) })}
          {PAIRS.flatMap((p, i) => [0, 1].map((k) => <circle key={`p${i}${k}`} r="2.6" className="pa-dot" data-i={i} />))}
        </svg>
      </div>
    ),
    setup: (root, { q }) => {
      const paths = q('.pa-base'), tl = gsap.timeline({ repeat: -1 })
      tl.from(q('.vol'), { scale: 0, transformOrigin: 'center', duration: 0.4, ease: 'back.out(3)', stagger: 0.1 }, 0)
      q('.pa-dot').forEach((d, n) => {
        const p = paths[+d.dataset.i], t = 0.2 + (+d.dataset.i) * 0.25 + (n % 2) * 1.1
        tl.fromTo(d, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, t)
          .to(d, { motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] }, duration: 2, ease: 'none' }, t)
          .to(d, { autoAlpha: 0, duration: 0.15 }, t + 1.85)
      })
      tl.to({}, { duration: 0.4 })
      return tl
    },
  },
  {
    id: 'zoom-panel', title: 'Zoom a región con panel de detalle', tag: 'mapa', interactive: true, plugins: ['attr viewBox', 'counter'],
    desc: 'Al elegir una región la cámara se acerca, aparece un panel lateral con sus cifras y la ruta de navegación se actualiza.',
    view: (
      <div className="stage map x-zp-stage">
        <div className="x-crumb">Global</div>
        <svg viewBox="0 0 300 160" className="map-svg x-zsvg">
          {Object.entries(ZONES).map(([k, z]) => (
            <g key={k} className="zone" data-k={k}><rect x={z.x} y={z.y} width={z.w} height={z.h} rx="14" className="zone-r" /><text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle" className="zone-t">{z.n}</text></g>
          ))}
        </svg>
        <div className="x-zp"><small>Región</small><h4>—</h4><b className="x-zv">0</b><span>envíos / mes</span><em className="x-zpc">0%</em><span>a tiempo</span></div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const svg = q('.x-zsvg')[0], zones = q('.zone'), panel = q('.x-zp')[0], crumb = q('.x-crumb')[0], h = q('.x-zp h4')[0], v = q('.x-zv')[0], pc = q('.x-zpc')[0]
      gsap.set(panel, { xPercent: 105 })
      let cur = null; const o = { v: 0, p: 0 }
      const go = (k) => {
        cur = k
        gsap.to(svg, { attr: { viewBox: k ? zoomLeft(ZONES[k]) : '0 0 300 160' }, duration: 1, ease: 'power3.inOut', overwrite: 'auto' })
        gsap.to(zones, { opacity: (i, el) => (!k || el.dataset.k === k ? 1 : 0.25), duration: 0.5, overwrite: 'auto' })
        gsap.to(panel, { xPercent: k ? 0 : 105, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
        crumb.textContent = k ? `Global › ${ZONES[k].n}` : 'Global'
        if (k) { h.textContent = ZONES[k].n; gsap.to(o, { v: ZONES[k].v, p: ZONES[k].p, duration: 1, ease: 'power2.out', overwrite: true, onUpdate: () => { v.textContent = Math.round(o.v).toLocaleString('es-MX'); pc.textContent = o.p.toFixed(1) + '%' } }) }
      }
      zones.forEach((z) => on(z, 'click', (e) => { e.stopPropagation(); go(cur === z.dataset.k ? null : z.dataset.k) }))
      on(q('.x-zp-stage')[0], 'click', () => cur && go(null))
      cleanup(() => gsap.killTweensOf([svg, zones, panel, o]))
    },
  },

  /* ───────── REPORTE / FEEDBACK ───────── */
  {
    id: 'toast-undo', title: 'Aviso con temporizador y «Deshacer»', tag: 'reporte', interactive: true, plugins: ['timeline', 'delayedCall'],
    desc: 'El aviso muestra una barra que se agota; pulsar “Deshacer” detiene el tiempo y confirma.',
    view: (
      <div className="stage x-tp-stage"><button className="x-mini del">Eliminar fila</button><div className="x-tpbox" /></div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const box = q('.x-tpbox')[0]; let cur = null
      const close = (el) => gsap.to(el, { y: 14, autoAlpha: 0, duration: 0.3, onComplete: () => el.remove() })
      on(q('.del')[0], 'click', () => {
        if (cur) { cur.tl.kill(); cur.el.remove() }
        const el = document.createElement('div'); el.className = 'x-tp'
        el.innerHTML = '<span>Fila eliminada</span><button>Deshacer</button><i class="x-tbar"></i>'; box.appendChild(el)
        const tl = gsap.timeline({ onComplete: () => close(el) })
          .from(el, { y: 20, autoAlpha: 0, duration: 0.4, ease: 'back.out(2)' })
          .fromTo(el.querySelector('.x-tbar'), { scaleX: 1 }, { scaleX: 0, duration: 4, ease: 'none', transformOrigin: '0 50%' })
        el.querySelector('button').addEventListener('click', () => {
          tl.kill(); el.querySelector('span').textContent = 'Fila restaurada ✓'; el.querySelector('button').remove()
          gsap.to(el.querySelector('.x-tbar'), { autoAlpha: 0, duration: 0.2 }); gsap.delayedCall(0.9, () => close(el))
        })
        cur = { el, tl }
      })
      cleanup(() => { cur?.tl.kill(); box.replaceChildren() })
    },
  },
  {
    id: 'approve', title: 'Estado → aprobado con destello', tag: 'reporte', interactive: true, plugins: ['DrawSVG', 'partículas'],
    desc: 'Al aprobar, el punto se convierte en check, el chip cambia de color y salen unas chispas discretas.',
    view: (
      <div className="stage center">
        <div className="x-apr">
          <span className="x-sc"><span className="x-scic"><i className="x-scd" /><svg className="x-sck" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" /></svg></span><em>Pendiente de revisión</em></span>
          <button className="x-mini ok">Aprobar</button>
        </div>
      </div>
    ),
    setup: (root, { q, on, cleanup }) => {
      const chip = q('.x-sc')[0], dot = q('.x-scd')[0], chk = q('.x-sck')[0], ic = q('.x-scic')[0], txt = q('.x-sc em')[0], btn = q('.ok')[0]
      gsap.set(chk, { autoAlpha: 0 }); let done = false
      on(btn, 'click', () => {
        done = !done
        const tl = gsap.timeline()
        if (done) {
          tl.to(chip, { backgroundColor: '#d9f7f6', color: '#0b6f78', duration: 0.3 })
            .to(dot, { scale: 0, duration: 0.15 }, 0).set(chk, { autoAlpha: 1 })
            .fromTo(chk.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 })
            .call(() => { txt.textContent = 'Aprobado' }, null, 0.1)
          for (let i = 0; i < 6; i++) {
            const s = document.createElement('i'); s.className = 'x-burst'; ic.appendChild(s)
            const a = (i / 6) * Math.PI * 2
            gsap.fromTo(s, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(a) * 20, y: Math.sin(a) * 20, scale: 0, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => s.remove() })
          }
          btn.textContent = 'Revertir'
        } else {
          tl.to(chk, { autoAlpha: 0, duration: 0.15 }).to(dot, { scale: 1, duration: 0.25, ease: 'back.out(3)' }).to(chip, { backgroundColor: '#ffe9d6', color: '#b34700', duration: 0.3 }, 0)
            .call(() => { txt.textContent = 'Pendiente de revisión' }, null, 0.1)
          btn.textContent = 'Aprobar'
        }
      })
      cleanup(() => gsap.killTweensOf([chip, dot, chk]))
    },
  },
  {
    id: 'hdr-reveal', title: 'Encabezado de reporte (entrada)', tag: 'reporte', plugins: ['timeline', 'stagger'],
    desc: 'La primera impresión de un reporte: etiqueta que se asienta, título que sube con máscara, línea que se traza y KPIs en cascada.',
    view: (
      <div className="stage x-hdr">
        <small className="x-eyebrow">REPORTE MENSUAL · NOVIEMBRE 2026</small>
        <div className="x-mask"><h4 className="x-title">Desempeño logístico global</h4></div>
        <i className="x-hline" />
        <p className="x-sub">Cobertura, puntualidad y costos por región.</p>
        <div className="x-hk">{[['48 215', 'envíos'], ['94.1%', 'a tiempo'], ['$2.4M', 'ingresos']].map(([a, b]) => <div key={b}><b>{a}</b><span>{b}</span></div>)}</div>
      </div>
    ),
    setup: (root, { q }) =>
      gsap.timeline()
        .from(q('.x-eyebrow'), { letterSpacing: '0.4em', autoAlpha: 0, duration: 0.8, ease: 'power3.out' })
        .from(q('.x-title'), { yPercent: 110, duration: 0.8, ease: 'power4.out' }, 0.15)
        .from(q('.x-hline'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.7, ease: 'power3.inOut' }, 0.5)
        .from(q('.x-sub'), { y: 10, autoAlpha: 0, duration: 0.5 }, 0.8)
        .from(q('.x-hk > div'), { y: 14, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, 1),
  },
  {
    id: 'sticky', title: 'Encabezado que se contrae al scroll', tag: 'reporte', interactive: true, plugins: ['ScrollTrigger scrub'],
    desc: 'Al bajar, el título se reduce, el subtítulo se desvanece y aparece una sombra. Gana espacio sin perder contexto.',
    view: (
      <div className="stage x-stk">
        <div className="x-stk-hd"><h4>Desempeño logístico</h4><p>Noviembre 2026 · Todas las regiones</p></div>
        <div className="x-stk-body">{Array.from({ length: 10 }, (_, i) => <div key={i} className="x-stk-row"><span>Sede {i + 1}</span><b>{(95 - i * 1.3).toFixed(1)}%</b></div>)}</div>
      </div>
    ),
    setup: (root, { q }) => {
      const sc = q('.x-stk')[0]
      const tl = gsap.timeline({ defaults: { ease: 'none' } })
        .to(q('.x-stk-hd h4'), { fontSize: 15 })
        .to(q('.x-stk-hd p'), { autoAlpha: 0, height: 0, marginTop: 0 }, 0)
        .to(q('.x-stk-hd'), { paddingTop: 8, paddingBottom: 8, boxShadow: '0 6px 14px rgba(0,0,0,.08)' }, 0)
      ScrollTrigger.create({ scroller: sc, trigger: q('.x-stk-body')[0], start: 'top 70px', end: '+=70', scrub: 0.3, animation: tl })
    },
  },
]
