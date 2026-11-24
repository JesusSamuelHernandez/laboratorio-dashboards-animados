import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../shared/gsap'

const TAG = {
  dashboard: 'Dashboard', mapa: 'Mapa', ambos: 'Dashboard + Mapa',
  boton: 'Botón', control: 'Control', kpi: 'KPI / Tarjeta', grafico: 'Gráfico', reporte: 'Reporte',
}

export default function DemoCard({ def, index, picked, hidden, onPick }) {
  const card = useRef(null)
  const body = useRef(null)
  const tlRef = useRef(null)

  // Cada demo vive aislada: gsap.context + listeners propios, todo se limpia al desmontar.
  useLayoutEffect(() => {
    const cleanups = []
    const h = {
      q: gsap.utils.selector(body),
      on: (el, evt, fn) => { el.addEventListener(evt, fn); cleanups.push(() => el.removeEventListener(evt, fn)) },
      cleanup: (fn) => cleanups.push(fn),
    }
    let tl
    const ctx = gsap.context(() => {
      tl = def.setup(body.current, h)
      tl?.pause(0)
    }, body)
    tlRef.current = tl

    // Solo anima mientras la tarjeta está a la vista (ahorra GPU/CPU).
    let played = false
    const st = ScrollTrigger.create({
      trigger: card.current,
      start: 'top 90%',
      end: 'bottom 5%',
      onToggle: (self) => {
        if (!tl) return
        if (self.isActive) {
          if (def.loop) tl.play()
          else if (!played) { played = true; tl.restart() }
        } else if (def.loop) tl.pause()
      },
    })
    return () => {
      st.kill()
      cleanups.forEach((f) => f())
      ctx.revert()
      tlRef.current = null
    }
  }, [])

  return (
    <article ref={card} className={`demo${picked ? ' picked' : ''}${hidden ? ' hidden' : ''}`} data-id={def.id}>
      <header>
        <span className="num">{String(index + 1).padStart(2, '0')}</span>
        <h3>{def.title}</h3>
        <span className={`tag ${def.tag}`}>{TAG[def.tag] ?? def.tag}</span>
      </header>
      <div className="demo-body" ref={body}>{def.view}</div>
      <p className="desc">{def.desc}</p>
      <footer>
        <div className="plugins">{def.plugins.map((p) => <span key={p}>{p}</span>)}</div>
        <div className="actions">
          {def.interactive
            ? <span className="hint">Interactivo</span>
            : <button className="ghost" onClick={() => tlRef.current?.restart()}>↺ Repetir</button>}
          <button className={`pick${picked ? ' on' : ''}`} onClick={() => onPick(def.id)}>
            {picked ? '★ Me sirve' : '☆ Me sirve'}
          </button>
        </div>
      </footer>
    </article>
  )
}
