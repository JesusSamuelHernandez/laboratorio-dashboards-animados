/* BARRAS VIVAS: ecualizador de datos con marcas de máximo que caen despacio. */
const COVER = (() => {
  let n = 0, bw = 0, vals = [], peaks = [], bump = 0, ripples = []

  function build() { n = Math.max(16, Math.floor(W / 16)); bw = W / n; vals = new Array(n).fill(0); peaks = new Array(n).fill(0); ripples = [] }
  function click(x, y, t) { ripples.push({ x, t0: t }) }

  function frame(t) {
    const a = easeOut(t / 2)
    smoothMouse(0.14); bump = lerp(bump, mouse.on ? 1 : 0, 0.06)
    ripples = ripples.filter((r) => t - r.t0 < 2.5)
    const maxH = H * 0.6
    ctx.globalAlpha = a
    // rejilla
    ctx.strokeStyle = neutral(0.08); ctx.lineWidth = 1; ctx.beginPath()
    for (let g = 0; g <= 5; g++) { const y = H - (maxH * g) / 5; ctx.moveTo(0, y); ctx.lineTo(W, y) }
    ctx.stroke()
    const grad = ctx.createLinearGradient(0, H, 0, H - maxH); grad.addColorStop(0, pal.orange); grad.addColorStop(1, pal.aqua)
    let sum = 0, mx = 0
    const wave = ((t * 0.07) % 1.3) - 0.15
    for (let i = 0; i < n; i++) {
      const u = i / n, x = i * bw
      let v = 0.34 + 0.24 * Math.sin(u * 9 + t * 1.1) + 0.18 * Math.sin(u * 23 - t * 1.7) + 0.1 * Math.sin(u * 51 + t * 2.9)
      v += 0.28 * Math.exp(-((u - wave) ** 2) / 0.004)
      if (bump > 0.01) v += 0.5 * bump * Math.exp(-((x - mouse.sx) ** 2) / (2 * 110 * 110))
      for (const r of ripples) { const f = (t - r.t0) * 520; v += 0.5 * Math.exp(-((Math.abs(x - r.x) - f) ** 2) / (2 * 40 * 40)) * (1 - (t - r.t0) / 2.5) }
      v = clamp(v, 0.03, 1)
      vals[i] = lerp(vals[i], v, 0.22); peaks[i] = Math.max(peaks[i] - 0.0035, vals[i])
      sum += vals[i]; mx = Math.max(mx, vals[i])
      const h = vals[i] * maxH * a, w = bw * 0.62, bx = x + bw * 0.19
      // las barras se atenúan detrás del titular central para no competir con el texto
      const cx = Math.abs(x - W / 2) / (W * 0.28), fade = 0.4 + 0.6 * clamp(cx)
      ctx.globalAlpha = a * fade * 0.9; ctx.fillStyle = grad
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, H - h, w, h + 6, [w / 2, w / 2, 0, 0]) : ctx.rect(bx, H - h, w, h); ctx.fill()
      ctx.globalAlpha = a * fade; ctx.fillStyle = neutral(0.7)
      ctx.fillRect(bx, H - peaks[i] * maxH * a - 7, w, 2)
    }
    ctx.globalAlpha = 1
    setHud([['Barras', n], ['Máx', Math.round(mx * 100) + '%'], ['Prom', Math.round((sum / n) * 100) + '%']])
  }
  return { build, frame, click }
})()
