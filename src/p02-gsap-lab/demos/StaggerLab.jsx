import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../shared/gsap'

const COLS = 14
const ROWS = 6
const FROM = ['start', 'center', 'edges', 'end', 'random']

export default function StaggerLab() {
  const wrap = useRef(null)
  const [from, setFrom] = useState('center')
  const tween = useRef(null)

  const play = (origin) => {
    tween.current?.kill()
    tween.current = gsap.fromTo(
      wrap.current.children,
      { scale: 0.2, opacity: 0.2, backgroundColor: '#1d2a44' },
      {
        scale: 1,
        opacity: 1,
        backgroundColor: '#4aa3ff',
        duration: 0.9,
        ease: 'back.out(2.5)',
        stagger: { grid: [ROWS, COLS], from: origin, amount: 1.1 },
        // vuelve al reposo tras la onda
        onComplete: () => gsap.to(wrap.current.children, { backgroundColor: '#1d2a44', duration: 0.8, stagger: { grid: [ROWS, COLS], from: origin, amount: 0.8 } }),
      },
    )
  }

  useEffect(() => {
    play(from)
    return () => tween.current?.kill()
  }, [from])

  return (
    <>
      <div className="controls">
        <div className="chips">
          {FROM.map((f) => (
            <button key={f} className={`chip${from === f ? ' active' : ''}`} onClick={() => (from === f ? play(f) : setFrom(f))}>
              from: {f}
            </button>
          ))}
        </div>
      </div>
      <div className="dots" ref={wrap} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <i key={i} onClick={() => play(i)} />
        ))}
      </div>
    </>
  )
}
