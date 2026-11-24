import { useEffect, useRef } from 'react'
import { gsap } from '../../shared/gsap'

function MagneticButton({ children }) {
  const zone = useRef(null)
  const btn = useRef(null)

  useEffect(() => {
    const z = zone.current, b = btn.current
    const xTo = gsap.quickTo(b, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    const yTo = gsap.quickTo(b, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    const move = (e) => {
      const r = z.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.4)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4)
    }
    const leave = () => { xTo(0); yTo(0) }
    z.addEventListener('mousemove', move)
    z.addEventListener('mouseleave', leave)
    return () => {
      z.removeEventListener('mousemove', move)
      z.removeEventListener('mouseleave', leave)
      gsap.killTweensOf(b)
    }
  }, [])

  return (
    <div className="mag-zone" ref={zone}>
      <button className="btn" ref={btn}>{children}</button>
    </div>
  )
}

export default function Magnetic() {
  const stage = useRef(null)
  const dot = useRef(null)

  useEffect(() => {
    const s = stage.current, d = dot.current
    gsap.set(d, { xPercent: -50, yPercent: -50, opacity: 0 })
    const xTo = gsap.quickTo(d, 'x', { duration: 0.35, ease: 'power3' })
    const yTo = gsap.quickTo(d, 'y', { duration: 0.35, ease: 'power3' })
    const move = (e) => {
      const r = s.getBoundingClientRect()
      xTo(e.clientX - r.left); yTo(e.clientY - r.top)
    }
    const enter = () => gsap.to(d, { opacity: 1, scale: 1, duration: 0.3 })
    const leave = () => gsap.to(d, { opacity: 0, scale: 0.4, duration: 0.3 })
    s.addEventListener('mousemove', move)
    s.addEventListener('mouseenter', enter)
    s.addEventListener('mouseleave', leave)
    return () => {
      s.removeEventListener('mousemove', move)
      s.removeEventListener('mouseenter', enter)
      s.removeEventListener('mouseleave', leave)
      gsap.killTweensOf(d)
    }
  }, [])

  return (
    <div className="mag-stage" ref={stage}>
      <MagneticButton>Exportar</MagneticButton>
      <MagneticButton>Filtrar</MagneticButton>
      <MagneticButton>Comparar</MagneticButton>
      <div className="follower" ref={dot} />
    </div>
  )
}
