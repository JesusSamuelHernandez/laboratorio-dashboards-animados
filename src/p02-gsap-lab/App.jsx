import { useLayoutEffect, useRef } from 'react'
import { gsap, SplitText, ScrollTrigger } from '../shared/gsap'
import FlipGrid from './demos/FlipGrid'
import StaggerLab from './demos/StaggerLab'
import LiveKpis from './demos/LiveKpis'
import Magnetic from './demos/Magnetic'

export default function App() {
  const root = useRef(null)
  const tl = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1) SplitText + timeline en el hero
      const split = SplitText.create('.hero-title', { type: 'chars' })
      tl.current = gsap
        .timeline()
        .from(split.chars, { yPercent: 120, rotateX: -80, opacity: 0, stagger: 0.03, duration: 0.9, ease: 'power4.out' })
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-tags span', { scale: 0.6, opacity: 0, stagger: 0.08, ease: 'back.out(2)' }, '-=0.3')

      // 2) ScrollTrigger.batch: las secciones entran al hacer scroll
      gsap.set('.lab-section', { autoAlpha: 0, y: 50 })
      ScrollTrigger.batch('.lab-section', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }),
      })
    }, root)
    return () => ctx.revert() // mata tweens, SplitText y ScrollTriggers
  }, [])

  return (
    <div className="lab" ref={root}>
      <header className="hero">
        <h1 className="hero-title">GSAP Lab</h1>
        <p className="hero-sub">Animación de interfaz guiada por datos: Flip, Stagger, SplitText, DrawSVG, MorphSVG, ScrollTrigger y quickTo.</p>
        <div className="hero-tags">
          <span>Flip</span><span>Stagger</span><span>SplitText</span><span>DrawSVG</span><span>MorphSVG</span><span>ScrollTrigger</span>
        </div>
        <button className="btn" onClick={() => tl.current?.restart()}>↺ Repetir intro</button>
      </header>

      <section className="lab-section">
        <h2>01 · Filtros y orden con <code>Flip</code></h2>
        <p>Las tarjetas se reacomodan con transiciones fluidas al filtrar por región u ordenar por métrica.</p>
        <FlipGrid />
      </section>

      <section className="lab-section">
        <h2>02 · Patrones de <code>stagger</code></h2>
        <p>Elige el origen de la onda, o haz clic en cualquier celda para que parta desde ahí.</p>
        <StaggerLab />
      </section>

      <section className="lab-section">
        <h2>03 · KPIs en vivo: contadores, <code>DrawSVG</code> y <code>MorphSVG</code></h2>
        <p>Activa la simulación: los números ruedan, la línea se transforma y la tarjeta destella verde o rojo según el cambio.</p>
        <LiveKpis />
      </section>

      <section className="lab-section">
        <h2>04 · Micro-interacciones con <code>quickTo</code></h2>
        <p>Botones magnéticos con retorno elástico y un seguidor de cursor suave.</p>
        <Magnetic />
      </section>
    </div>
  )
}
