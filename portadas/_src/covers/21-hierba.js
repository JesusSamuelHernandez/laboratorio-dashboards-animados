/* HIERBA DE DATOS: un prado de briznas que se mece despacio con el viento, en tres planos de profundidad.
   Algunas briznas altas terminan en una "semilla" (punto de dato). El cursor aparta la hierba; el polen deriva con el viento. */
const COVER = (() => {
  let layers = [], seeds = [], pollen = [], lastT = 0
  const R = Math.random
  const aquaRGB = () => { const n = parseInt(pal.aqua.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
  const mixCol = (tone, a) => { const [r, g, b] = aquaRGB(), [nr, ng, nb] = pal.ring.split(',').map(Number), k = 0.12 + tone * 0.4; return `rgba(${Math.round(lerp(r, nr, k))},${Math.round(lerp(g, ng, k))},${Math.round(lerp(b, nb, k))},${a})` }

  function build() {
    layers = []; seeds = []
    const counts = [clamp(W / 7, 70, 240), clamp(W / 5.4, 90, 310), clamp(W / 4.4, 110, 380)]
    counts.forEach((n, l) => {
      const blades = []
      for (let i = 0; i < n; i++) {
        const x = ((i + R()) / n) * (W + 80) - 40
        const hf = 0.07 + l * 0.05 + 0.1 * Math.abs(Math.sin(x * 0.0034 + l * 1.7)) + R() * 0.055
        const b = { x, h: H * hf, w: 2.6 + l * 1.1 + R() * 2.2, ph: R() * TAU, stiff: 0.65 + R() * 0.6, tone: R() }
        blades.push(b)
        if (l === 2 && R() < 0.07) seeds.push({ b, c: R() < 0.45 ? 'orange' : 'aqua', ph: R() * TAU })
      }
      layers.push(blades)
    })
    pollen = Array.from({ length: Math.round(clamp(W / 28, 16, 60)) }, () => ({ x: R() * W, y: H * (0.3 + R() * 0.6), r: 1 + R() * 1.8, ph: R() * TAU, s: 0.5 + R() }))
  }
  const wind = (x, t) => Math.sin(x * 0.0018 - t * 0.32) * 0.5 + Math.sin(x * 0.0007 - t * 0.14 + 1) * 0.4 + Math.sin(t * 0.1) * 0.3

  // desplazamiento horizontal de la punta de una brizna (px)
  function tipOffset(b, t) {
    let off = b.h * (0.3 * wind(b.x, t) * b.stiff + 0.05 * Math.sin(t * 0.8 + b.ph))
    if (mouse.on && mouse.sy > H * 0.5) { const dx = b.x - mouse.sx, r = 150; if (Math.abs(dx) < r) off += Math.sign(dx || 1) * (1 - Math.abs(dx) / r) * b.h * 0.7 }
    return off
  }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    smoothMouse(0.15)
    ctx.globalAlpha = easeOut(t / 2)
    // suelo suave
    const g = ctx.createLinearGradient(0, H * 0.62, 0, H); g.addColorStop(0, hex(pal.aqua, 0)); g.addColorStop(1, hex(pal.aqua, pal.dark ? 0.18 : 0.14)); ctx.fillStyle = g; ctx.fillRect(0, H * 0.62, W, H * 0.38)

    const grow = easeOut(t / 2.6)
    layers.forEach((blades, l) => {
      const alpha = [0.45, 0.7, 0.92][l]
      for (const b of blades) {
        const h = b.h * grow, off = tipOffset(b, t) * grow, tx = b.x + off, ty = H - h * (1 - 0.1 * Math.min(1, Math.abs(off) / (b.h || 1)))
        const cx = b.x + off * 0.3, cy = H - h * 0.6
        ctx.fillStyle = mixCol(b.tone, alpha)
        ctx.beginPath(); ctx.moveTo(b.x - b.w / 2, H + 2); ctx.quadraticCurveTo(cx - b.w * 0.35, cy, tx, ty); ctx.quadraticCurveTo(cx + b.w * 0.35, cy, b.x + b.w / 2, H + 2); ctx.closePath(); ctx.fill()
      }
    })
    // semillas (puntos de datos) sobre las briznas altas
    for (const s of seeds) {
      const b = s.b, h = b.h * grow, off = tipOffset(b, t) * grow, x = b.x + off, y = H - h
      const col = s.c === 'orange' ? pal.orange : pal.aqua, pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + s.ph)
      ctx.strokeStyle = hex(col, 0.55); ctx.lineWidth = 1
      ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + t * 0.1; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11) } ctx.stroke()
      ctx.fillStyle = hex(col, 0.95); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + t * 0.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 1.4, 0, TAU); ctx.fill() }
      ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill()
      ctx.strokeStyle = hex(col, 0.35 * pulse); ctx.beginPath(); ctx.arc(x, y, 14 + pulse * 7, 0, TAU); ctx.stroke()
    }
    // polen que deriva con el viento
    for (const p of pollen) {
      p.x += (wind(p.x, t) * 14 + 9) * p.s * dt; p.y += (Math.sin(t * 0.5 + p.ph) * 6 - 4) * p.s * dt
      if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10; if (p.y < H * 0.1) p.y = H * 0.9; if (p.y > H) p.y = H * 0.4
      ctx.fillStyle = hex(pal.orange, 0.5 + 0.35 * Math.sin(t * 1.2 + p.ph)); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill()
    }
    ctx.globalAlpha = 1
    setHud([['Briznas', layers.reduce((a, l) => a + l.length, 0)], ['Viento', (3.6 + 2.4 * Math.sin(t * 0.22)).toFixed(1) + ' m/s'], ['Semillas', seeds.length]])
  }
  return { build, frame }
})()
