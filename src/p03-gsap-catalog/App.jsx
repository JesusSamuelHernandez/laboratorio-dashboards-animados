import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, Flip, ScrollTrigger } from '../shared/gsap'
import { DEMOS as P03_DEMOS } from './demos'
import DemoCard from './DemoCard'

const P03_FILTERS = [['all', 'Todas'], ['dashboard', 'Dashboard'], ['mapa', 'Mapa'], ['picked', 'Seleccionadas']]

function loadPicks(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')) } catch { return new Set() }
}

// Catálogo reutilizable: P03 y P04 lo usan con distintas props.
export default function App({
  demos = P03_DEMOS,
  filters = P03_FILTERS,
  storageKey = 'p03-picks',
  title = 'Muestrario GSAP',
  accent = 'para tableros y mapas',
  intro = 'animaciones listas para reutilizar. Marca con ★ las que te sirvan y copia la lista para decidir cuáles integramos.',
}) {
  const [filter, setFilter] = useState('all')
  const [picks, setPicks] = useState(() => loadPicks(storageKey))
  const [copied, setCopied] = useState(false)
  const grid = useRef(null)
  const saved = useRef(null)

  const persist = (set) => { try { localStorage.setItem(storageKey, JSON.stringify([...set])) } catch { /* sin storage */ } }

  // Captura el layout antes de cambiar el estado; Flip anima el reacomodo después.
  const change = (fn) => { saved.current = Flip.getState(grid.current.children); fn() }

  const togglePick = (id) => {
    const apply = () => setPicks((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); persist(n); return n })
    filter === 'picked' ? change(apply) : apply()
  }
  const clearPicks = () => {
    const apply = () => { setPicks(new Set()); persist(new Set()) }
    filter === 'picked' ? change(apply) : apply()
  }

  const isHidden = (d) => (filter === 'picked' ? !picks.has(d.id) : filter !== 'all' && d.tag !== filter && d.tag !== 'ambos')

  useLayoutEffect(() => {
    if (!saved.current) return
    const anim = Flip.from(saved.current, {
      duration: 0.7, ease: 'power2.inOut', absolute: true, stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
    saved.current = null
    return () => anim.kill()
  }, [filter, picks])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.top > *', { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [])

  const copy = async () => {
    const list = demos.filter((d) => picks.has(d.id)).map((d) => `${String(demos.indexOf(d) + 1).padStart(2, '0')} ${d.title}`).join('\n')
    try { await navigator.clipboard.writeText(list || '(sin selección)'); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* sin permiso */ }
  }

  return (
    <div className="page">
      <section className="top">
        <h1>{title} <em>{accent}</em></h1>
        <p>{demos.length} {intro}</p>
      </section>

      <div className="toolbar">
        <div className="chips">
          {filters.map(([k, label]) => (
            <button key={k} className={`chip${filter === k ? ' active' : ''}`} onClick={() => change(() => setFilter(k))}>
              {label}{k === 'picked' ? ` (${picks.size})` : ''}
            </button>
          ))}
        </div>
        <div className="tb-actions">
          <button className="ghost" onClick={clearPicks} disabled={!picks.size}>Limpiar</button>
          <button className="primary" onClick={copy} disabled={!picks.size}>{copied ? '✓ Copiado' : 'Copiar selección'}</button>
        </div>
      </div>

      <main className="grid" ref={grid}>
        {demos.map((d, i) => (
          <DemoCard key={d.id} def={d} index={i} picked={picks.has(d.id)} hidden={isHidden(d)} onPick={togglePick} />
        ))}
      </main>
    </div>
  )
}
