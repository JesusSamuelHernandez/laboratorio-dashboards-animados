import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../shared/gsap'

const W = 300, H = 80, N = 24

// Serie → path polilínea (mismo nº de puntos siempre, requisito cómodo para MorphSVG).
function toPath(series) {
  const min = Math.min(...series), max = Math.max(...series)
  const pts = series.map((v, i) => [(i / (N - 1)) * W, H - 6 - ((v - min) / (max - min || 1)) * (H - 12)])
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

function LiveKpi({ label, start, vol, fmt, higherIsBetter = true, live }) {
  const card = useRef(null)
  const num = useRef(null)
  const path = useRef(null)
  const st = useRef({
    v: start,
    shown: start,
    series: Array.from({ length: N }, (_, i) => start * (1 + Math.sin(i / 3) * vol + (Math.random() - 0.5) * vol)),
  })

  // Montaje: valor inicial + línea que se "dibuja" (DrawSVG).
  useEffect(() => {
    const s = st.current
    num.current.textContent = fmt(s.shown)
    path.current.setAttribute('d', toPath(s.series))
    const t = gsap.from(path.current, { drawSVG: 0, duration: 1.6, ease: 'power2.out' })
    return () => t.kill()
  }, [])

  // Simulación en vivo.
  useEffect(() => {
    if (!live) return
    const s = st.current
    const tick = () => {
      const prev = s.v
      s.v = prev * (1 + (Math.random() - 0.46) * vol * 2)
      s.series = [...s.series.slice(1), s.v]
      const good = (s.v >= prev) === higherIsBetter
      gsap.to(s, { shown: s.v, duration: 0.9, ease: 'power2.out', overwrite: 'auto', onUpdate: () => { num.current.textContent = fmt(s.shown) } })
      gsap.to(path.current, { morphSVG: toPath(s.series), duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' })
      gsap.fromTo(card.current, { boxShadow: `0 0 0 2px ${good ? '#2fd08a' : '#ff5c6c'}` }, { boxShadow: '0 0 0 0px rgba(0,0,0,0)', duration: 1.2 })
    }
    const id = setInterval(tick, 1800)
    return () => { clearInterval(id); gsap.killTweensOf([s, path.current, card.current]) }
  }, [live])

  return (
    <div className="live-kpi" ref={card}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" ref={num} />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path ref={path} fill="none" stroke="#4aa3ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

export default function LiveKpis() {
  const [live, setLive] = useState(false)
  return (
    <>
      <div className="controls">
        <button className={`chip${live ? ' active' : ''}`} onClick={() => setLive((v) => !v)}>
          {live ? '● En vivo' : '○ Simular datos en vivo'}
        </button>
      </div>
      <div className="live-grid">
        <LiveKpi label="Ingresos / hora" start={412} vol={0.04} fmt={(v) => '$' + v.toFixed(1) + ' K'} live={live} />
        <LiveKpi label="Envíos activos" start={18420} vol={0.03} fmt={(v) => Math.round(v).toLocaleString('es-MX')} live={live} />
        <LiveKpi label="Retraso medio" start={9.4} vol={0.06} fmt={(v) => v.toFixed(1) + ' h'} higherIsBetter={false} live={live} />
      </div>
    </>
  )
}
