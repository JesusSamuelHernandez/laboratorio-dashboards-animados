/* CIRCUITOS COMO CIUDAD: vista aérea de una placa. Chips = edificios, pistas = avenidas con giros de 45°, pulsos = tráfico de datos. */
const COVER = (() => {
  const G = 28
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
  let chips = [], traces = [], surge = 0, lastT = 0

  function build() {
    chips = []
    const nChips = Math.round(clamp((W * H) / 55000, 8, 20))
    for (let k = 0; k < nChips * 6 && chips.length < nChips; k++) {
      const w = (3 + Math.floor(Math.random() * 5)) * G, h = (2 + Math.floor(Math.random() * 4)) * G
      const x = Math.round((Math.random() * (W - w - 2 * G)) / G) * G + G, y = Math.round((Math.random() * (H - h - 2 * G)) / G) * G + G
      if (chips.every((c) => x > c.x + c.w + G * 2 || x + w + G * 2 < c.x || y > c.y + c.h + G * 2 || y + h + G * 2 < c.y)) chips.push({ x, y, w, h, id: 'U' + (chips.length + 1) })
    }
    traces = []
    const nT = Math.round(clamp((W * H) / 7500, 90, 230))
    for (let i = 0; i < nT; i++) {
      const c = chips[Math.floor(Math.random() * chips.length)], side = Math.floor(Math.random() * 4)
      let x, y, d
      if (side === 0) { x = c.x + c.w; y = c.y + Math.round((Math.random() * c.h) / (G / 2)) * (G / 2); d = 0 }
      else if (side === 1) { x = c.x + Math.round((Math.random() * c.w) / (G / 2)) * (G / 2); y = c.y + c.h; d = 2 }
      else if (side === 2) { x = c.x; y = c.y + Math.round((Math.random() * c.h) / (G / 2)) * (G / 2); d = 4 }
      else { x = c.x + Math.round((Math.random() * c.w) / (G / 2)) * (G / 2); y = c.y; d = 6 }
      const pts = [[x, y]]
      const steps = 3 + Math.floor(Math.random() * 7)
      for (let s = 0; s < steps; s++) {
        const len = (1 + Math.floor(Math.random() * 5)) * G, [dx, dy] = DIRS[d], k = dx && dy ? 0.7071 : 1
        x += dx * len * k; y += dy * len * k
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break
        pts.push([x, y])
        const r = Math.random(); d = (d + (r < 0.45 ? 1 : r < 0.9 ? 7 : r < 0.95 ? 2 : 6)) % 8     // giros de 45° (y algunos de 90°)
      }
      if (pts.length < 2) continue
      const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]))
      traces.push({ pts, cum, total: cum[cum.length - 1], sp: 24 + Math.random() * 38, off: Math.random() * 2000, pulse: Math.random() < 0.3, col: Math.random() < 0.3 ? 'orange' : 'aqua' })
    }
  }
  function click() { surge = 1 }
  const at = (tr, d) => { const { pts, cum } = tr; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const u = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)] }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    surge = Math.max(0, surge - dt * 0.6); smoothMouse(0.3)
    ctx.globalAlpha = easeOut(t / 2)
    // pistas (avenidas) y vías
    ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.strokeStyle = neutral(0.16); ctx.beginPath()
    for (const tr of traces) { tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))) }
    ctx.stroke()
    ctx.strokeStyle = neutral(0.3); ctx.beginPath()
    for (const tr of traces) { const [x, y] = tr.pts[tr.pts.length - 1]; ctx.moveTo(x + 3.5, y); ctx.arc(x, y, 3.5, 0, TAU) }
    ctx.stroke()
    // chips = edificios
    ctx.font = '600 10px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'
    for (const c of chips) {
      ctx.fillStyle = neutral(0.05); ctx.fillRect(c.x, c.y, c.w, c.h)
      ctx.strokeStyle = neutral(0.4); ctx.lineWidth = 1.4; ctx.strokeRect(c.x, c.y, c.w, c.h)
      ctx.strokeStyle = neutral(0.16); ctx.lineWidth = 1; ctx.strokeRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16)
      ctx.beginPath(); for (let x = c.x + G / 2; x < c.x + c.w; x += G / 2) { ctx.moveTo(x, c.y - 4); ctx.lineTo(x, c.y); ctx.moveTo(x, c.y + c.h); ctx.lineTo(x, c.y + c.h + 4) }
      for (let y = c.y + G / 2; y < c.y + c.h; y += G / 2) { ctx.moveTo(c.x - 4, y); ctx.lineTo(c.x, y); ctx.moveTo(c.x + c.w, y); ctx.lineTo(c.x + c.w + 4, y) } ctx.stroke()
      ctx.fillStyle = neutral(0.5); ctx.fillText(c.id, c.x + 14, c.y + 14)
    }
    // pulsos de tráfico
    let active = 0
    for (const tr of traces) {
      if (!tr.pulse) continue
      const cyc = tr.total + 420, d = (t * tr.sp * (1 + 2 * surge) + tr.off) % cyc
      if (d > tr.total) continue
      active++
      const head = at(tr, d), near = mouse.on ? clamp(1 - Math.hypot(head[0] - mouse.sx, head[1] - mouse.sy) / 200) : 0
      const trail = 70 + 120 * near, col = tr.col === 'orange' ? pal.orange : pal.aqua
      let prev = head
      for (let s = 1; s <= 12; s++) {
        const dd = d - (trail * s) / 12; if (dd < 0) break
        const p = at(tr, dd); ctx.strokeStyle = hex(col, (1 - s / 12) * (0.85 + 0.15 * near)); ctx.lineWidth = 2.2 - s * 0.12 + near; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); prev = p
      }
      ctx.fillStyle = hex(col, 0.25 + 0.3 * near); ctx.beginPath(); ctx.arc(head[0], head[1], 7 + 6 * near, 0, TAU); ctx.fill()
      ctx.fillStyle = hex(col, 1); ctx.beginPath(); ctx.arc(head[0], head[1], 2.8, 0, TAU); ctx.fill()
    }
    if (mouse.on) { ctx.strokeStyle = neutral(0.3); ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(mouse.sx, mouse.sy, 200, 0, TAU); ctx.stroke(); ctx.setLineDash([]) }
    ctx.globalAlpha = 1
    setHud([['Chips', chips.length], ['Pistas', traces.length], ['Pulsos', active]])
  }
  return { build, frame, click }
})()
