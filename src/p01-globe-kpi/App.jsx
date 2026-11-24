import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useStore } from '../shared/store'
import { REGIONS } from '../shared/mock/logistics'
import { store, METRICS, selectMetric, selectRegion, currentAgg } from './state'
import GlobeView from './GlobeView'
import KpiCard from './KpiCard'
import RegionPanel from './RegionPanel'

export default function App() {
  const root = useRef(null)
  const region = useStore(store, (s) => s.region)
  const metric = useStore(store, (s) => s.metric)
  const agg = currentAgg(region)

  // Entrada escalonada (stagger) de tarjetas y paneles.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.kpi-card', { x: -50, autoAlpha: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', delay: 0.2 })
      gsap.from('.panel.right', { x: 50, autoAlpha: 0, duration: 0.7, ease: 'power3.out', delay: 0.3 })
      gsap.from('.topbar', { y: -20, autoAlpha: 0, duration: 0.6 })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="shell" ref={root}>
      <header className="topbar">
        <h1>Red logística global</h1>
        <span className="crumb">{region ? REGIONS[region].name : 'Vista global'}</span>
        {region && <button className="reset" onClick={() => selectRegion(region)}>↺ Global</button>}
      </header>
      <aside className="panel left">
        {Object.keys(METRICS).map((k) => (
          <KpiCard key={k} metric={k} value={agg[k]} active={metric === k} onClick={() => selectMetric(k)} />
        ))}
      </aside>
      <main className="center"><GlobeView /></main>
      <RegionPanel region={region} metric={metric} onSelect={selectRegion} />
    </div>
  )
}
