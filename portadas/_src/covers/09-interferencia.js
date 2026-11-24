/* INTERFERENCIA: una malla de puntos se agranda o se encoge según la suma de ondas circulares de varias fuentes.
   Naranja = cresta, aqua = valle. El cursor es una fuente más; el clic lanza un pulso. */
const COVER = (() => {
  const K = 0.045, WV = 2.2         // número de onda y frecuencia angular
  let gap = 16, cols = 0, rows = 0, bursts = []

  function build() { gap = W < 700 ? 14 : 16; cols = Math.ceil(W / gap) + 1; rows = Math.ceil(H / gap) + 1; bursts = [] }
  function click(x, y, t) { bursts.push({ x, y, t0: t }) }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.1)
    bursts = bursts.filter((b) => t - b.t0 < 4)
    const src = [0, 1, 2].map((i) => ({ x: W * (0.5 + 0.34 * Math.sin(t * 0.13 + i * 2.1)), y: H * (0.5 + 0.3 * Math.cos(t * 0.11 + i * 1.7)), a: 1 }))
    if (mouse.on) src.push({ x: mouse.sx, y: mouse.sy, a: 1.4 })
    const norm = src.length * 0.6

    const P = [[new Path2D(), new Path2D(), new Path2D()], [new Path2D(), new Path2D(), new Path2D()]]   // [aqua, naranja][intensidad]
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i * gap, y = j * gap
      let h = 0
      for (const s of src) { const d = Math.hypot(x - s.x, y - s.y); h += (s.a * Math.sin(K * d - WV * t)) / (1 + d * 0.0035) }
      for (const b of bursts) { const age = t - b.t0, d = Math.hypot(x - b.x, y - b.y); h += 1.8 * Math.exp(-((d - age * 240) ** 2) / (2 * 50 * 50)) * (1 - age / 4) * Math.cos(K * 1.6 * d) }
      const hv = clamp(h / norm, -1, 1), av = Math.abs(hv), r = 0.8 + av * 3.3
      const p = P[hv > 0 ? 1 : 0][av < 0.25 ? 0 : av < 0.55 ? 1 : 2]
      p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU)
    }
    const alphas = pal.dark ? [0.3, 0.6, 0.95] : [0.28, 0.55, 0.9]
    for (let g = 0; g < 2; g++) for (let b = 0; b < 3; b++) { ctx.fillStyle = hex(g ? pal.orange : pal.aqua, alphas[b]); ctx.fill(P[g][b]) }

    // fuentes y anillos que nacen de ellas
    for (const [i, s] of src.entries()) {
      for (let r = 0; r < 3; r++) { const ph = ((t * 0.35 + i * 0.3 + r / 3) % 1); ctx.strokeStyle = neutral(0.22 * (1 - ph)); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.x, s.y, 12 + ph * 150, 0, TAU); ctx.stroke() }
      ctx.fillStyle = i === 3 ? pal.orange : neutral(0.85); ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, TAU); ctx.fill()
    }
    ctx.globalAlpha = 1
    setHud([['Fuentes', src.length], ['λ', Math.round((TAU / K)) + ' px'], ['Puntos', cols * rows]])
  }
  return { build, frame, click }
})()
