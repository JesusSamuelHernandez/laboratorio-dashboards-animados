import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { METRICS } from './state'
import { GLOBAL } from '../shared/mock/logistics'

export default function KpiCard({ metric, value, active, onClick }) {
  const m = METRICS[metric]
  const cardRef = useRef(null)
  const numRef = useRef(null)
  const shown = useRef({ v: 0 })

  // Contador animado (escribe directo al DOM: sin re-render por frame).
  useEffect(() => {
    const tween = gsap.to(shown.current, {
      v: value,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => { if (numRef.current) numRef.current.textContent = m.fmt(shown.current.v) },
    })
    const pulse = gsap.fromTo(cardRef.current, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' })
    return () => { tween.kill(); pulse.kill() }
  }, [value, m])

  const diff = ((value - GLOBAL[metric]) / GLOBAL[metric]) * 100
  const good = (diff >= 0) === m.higherIsBetter
  const flat = Math.abs(diff) < 0.05

  return (
    <button ref={cardRef} className={`kpi-card${active ? ' active' : ''}`} onClick={onClick}>
      <span className="kpi-label">{m.label}</span>
      <span className="kpi-value" ref={numRef}>{m.fmt(0)}</span>
      <span className={`kpi-delta ${flat ? '' : good ? 'good' : 'bad'}`}>
        {flat ? 'Promedio global' : `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toFixed(1)}% vs global`}
      </span>
    </button>
  )
}
