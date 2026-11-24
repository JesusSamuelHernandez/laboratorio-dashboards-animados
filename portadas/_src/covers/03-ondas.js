/* ONDAS DE SEÑAL: cintas sinusoidales superpuestas con muestras que "leen" una de ellas. */
const COVER = (() => {
  const LAYERS = 9, SAMPLES = 14
  let ripples = [], bump = 0, amp = 90

  function yAt(x, l, t, base) {
    const k = l / (LAYERS - 1)
    let y = base + (k - 0.5) * H * 0.3 +
      amp * (Math.sin(x * 0.004 + t * 0.5 + l * 0.6) * 0.6 + Math.sin(x * 0.0095 - t * 0.8 + l * 1.3) * 0.28 + Math.sin(x * 0.017 + t * 0.35 + l * 2.1) * 0.12) * (0.6 + k * 0.7)
    if (bump > 0.01) { const dx = x - mouse.sx; y -= bump * Math.exp(-(dx * dx) / (2 * 140 * 140)) * 70 * (0.3 + k) }
    for (const r of ripples) {
      const dx = Math.abs(x - r.x), front = (t - r.t0) * 320
      y -= 46 * Math.exp(-((dx - front) ** 2) / (2 * 55 * 55)) * Math.max(0, 1 - (t - r.t0) / 3) * (0.4 + k)
    }
    return y
  }

  function build() { amp = Math.min(H, 700) * 0.11; ripples = [] }
  function click(x, y, t) { ripples.push({ x, t0: t }) }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.12); bump = lerp(bump, mouse.on ? 1 : 0, 0.05)
    ripples = ripples.filter((r) => t - r.t0 < 3)
    const base = H * 0.62
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, pal.aqua); g.addColorStop(1, pal.orange)
    for (let l = 0; l < LAYERS; l++) {
      const k = l / (LAYERS - 1)
      ctx.beginPath()
      for (let x = 0; x <= W + 6; x += 6) { const y = yAt(x, l, t, base); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
      if (l >= LAYERS - 3) {
        ctx.save(); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
        const f = ctx.createLinearGradient(0, base - amp, 0, H); f.addColorStop(0, hex(pal.aqua, 0.1)); f.addColorStop(1, hex(pal.aqua, 0))
        ctx.fillStyle = f; ctx.fill(); ctx.restore()
        ctx.beginPath(); for (let x = 0; x <= W + 6; x += 6) { const y = yAt(x, l, t, base); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
      }
      ctx.strokeStyle = g; ctx.globalAlpha = easeOut(t / 2) * (0.12 + 0.6 * k); ctx.lineWidth = 1 + k * 1.3; ctx.stroke()
    }
    ctx.globalAlpha = easeOut(t / 2)
    // muestras que leen la capa central
    const L = 5
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textAlign = 'center'
    for (let i = 0; i < SAMPLES; i++) {
      const x = (W * (i + 0.5)) / SAMPLES, y = yAt(x, L, t, base)
      ctx.setLineDash([3, 4]); ctx.strokeStyle = neutral(0.22); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, H); ctx.stroke(); ctx.setLineDash([])
      const col = i % 3 === 0 ? pal.orange : pal.aqua
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill()
      ctx.strokeStyle = hex(col, 0.35); ctx.beginPath(); ctx.arc(x, y, 8 + 2 * Math.sin(t * 2 + i), 0, TAU); ctx.stroke()
      if (i % 2 === 0) { ctx.fillStyle = neutral(0.75); ctx.fillText(String(Math.round(100 - ((y - (base - amp * 1.6)) / (amp * 3.2)) * 100)), x, y - 16) }
    }
    ctx.globalAlpha = 1
    setHud([['Capas', LAYERS], ['Muestras', SAMPLES], ['Amplitud', Math.round(amp)]])
  }
  return { build, frame, click }
})()
