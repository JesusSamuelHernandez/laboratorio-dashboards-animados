import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap, Flip } from '../../shared/gsap'
import { HUBS, REGIONS } from '../../shared/mock/logistics'

const SORTS = {
  shipments: { label: 'Envíos', fmt: (v) => v.toLocaleString('es-MX'), dir: -1 },
  onTime: { label: 'A tiempo', fmt: (v) => v.toFixed(1) + '%', dir: -1 },
  delayHrs: { label: 'Retraso', fmt: (v) => v.toFixed(1) + ' h', dir: 1 },
}

export default function FlipGrid() {
  const [region, setRegion] = useState('ALL')
  const [sort, setSort] = useState('shipments')
  const grid = useRef(null)
  const saved = useRef(null)

  // Todas las tarjetas permanecen en el DOM; se ocultan con clase y se ordenan con CSS `order`.
  const order = useMemo(() => {
    const s = SORTS[sort]
    const ranked = [...HUBS].sort((a, b) => s.dir * (b[sort] - a[sort]) * -1)
    return Object.fromEntries(ranked.map((h, i) => [h.id, i]))
  }, [sort])
  const max = useMemo(() => Math.max(...HUBS.map((h) => h[sort])), [sort])

  // Captura el estado ANTES de cambiar el estado de React…
  const change = (fn) => {
    saved.current = Flip.getState(grid.current.children)
    fn()
  }

  // …y anima desde ese estado DESPUÉS de que React pinte el nuevo layout.
  useLayoutEffect(() => {
    if (!saved.current) return
    const anim = Flip.from(saved.current, {
      duration: 0.8,
      ease: 'power2.inOut',
      absolute: true,
      stagger: 0.02,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.3 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.5, duration: 0.4 }),
    })
    saved.current = null
    return () => anim.kill()
  }, [region, sort])

  return (
    <>
      <div className="controls">
        <div className="chips">
          {['ALL', ...Object.keys(REGIONS)].map((r) => (
            <button key={r} className={`chip${region === r ? ' active' : ''}`} onClick={() => change(() => setRegion(r))}>
              {r === 'ALL' ? 'Todas' : REGIONS[r].name}
            </button>
          ))}
        </div>
        <div className="chips">
          {Object.entries(SORTS).map(([k, s]) => (
            <button key={k} className={`chip alt${sort === k ? ' active' : ''}`} onClick={() => change(() => setSort(k))}>
              Ordenar: {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flip-grid" ref={grid}>
        {HUBS.map((h) => (
          <div
            key={h.id}
            className={`hub-card${region !== 'ALL' && h.region !== region ? ' hidden' : ''}`}
            style={{ order: order[h.id] }}
          >
            <b>{h.name}</b>
            <small>{REGIONS[h.region].name}</small>
            <div className="bar"><i style={{ width: `${(h[sort] / max) * 100}%` }} /></div>
            <span>{SORTS[sort].fmt(h[sort])}</span>
          </div>
        ))}
      </div>
    </>
  )
}
