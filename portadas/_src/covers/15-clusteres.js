/* CLÚSTERES: puntos que migran entre grupos mientras los centroides se mueven (idea de k-means). Elipses concéntricas = 1σ, 2σ, 3σ. */
const COVER = (() => {
  const CL = [{ c: 'aqua', ax: 0.2, ay: 0.34, n: 'A' }, { c: 'orange', ax: 0.8, ay: 0.3, n: 'B' }, { c: 'ink', ax: 0.28, ay: 0.78, n: 'C' }, { c: 'gold', ax: 0.76, ay: 0.76, n: 'D' }]
  let cs = [], ps = [], lastFlip = 0
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) / 0.58 }
  const colA = (c, a) => (c === 'ink' ? neutral(a * 0.9) : c === 'gold' ? hex(pal.dark ? '#ffd166' : '#e0a800', a) : hex(pal[c], a))

  function build() {
    const sc = Math.min(W, H)
    cs = CL.map((c) => ({ ...c, tx: c.ax, ty: c.ay, cx: c.ax, cy: c.ay, x: c.ax * W, y: c.ay * H, sx: sc * 0.075 * (0.8 + Math.random() * 0.5), sy: sc * 0.06 * (0.8 + Math.random() * 0.5), ph: Math.random() * TAU }))
    const n = Math.round(clamp((W * H) / 4200, 160, 320))
    ps = Array.from({ length: n }, (_, i) => { const k = i % cs.length; return { k, ox: gauss(), oy: gauss(), x: cs[k].x + gauss() * cs[k].sx, y: cs[k].y + gauss() * cs[k].sy, ph: Math.random() * TAU } })
  }
  function click() { for (const c of cs) { c.tx = clamp(0.12 + Math.random() * 0.76, 0.12, 0.88); c.ty = clamp(0.15 + Math.random() * 0.7, 0.15, 0.85) } }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.2)
    for (const c of cs) { c.cx = lerp(c.cx, c.tx, 0.02); c.cy = lerp(c.cy, c.ty, 0.02); c.x = c.cx * W + W * 0.035 * Math.sin(t * 0.12 + c.ph); c.y = c.cy * H + H * 0.04 * Math.cos(t * 0.1 + c.ph * 1.3) }
    if (t - lastFlip > 0.3) { lastFlip = t; const p = ps[Math.floor(Math.random() * ps.length)]; let k = Math.floor(Math.random() * cs.length); if (k === p.k) k = (k + 1) % cs.length; p.k = k; p.ox = gauss(); p.oy = gauss() }

    // cluster bajo el cursor
    let hov = -1
    if (mouse.on) { let best = 230; cs.forEach((c, i) => { const d = Math.hypot(mouse.sx - c.x, mouse.sy - c.y); if (d < best) { best = d; hov = i } }) }

    // elipses concéntricas
    cs.forEach((c, i) => {
      const rot = 0.3 * Math.sin(t * 0.1 + c.ph)
      for (let s = 1; s <= 3; s++) {
        ctx.strokeStyle = colA(c.c, (i === hov ? 0.5 : 0.28) / s); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.sx * s, c.sy * s, rot, 0, TAU); ctx.stroke()
        if (s === 1) { ctx.fillStyle = colA(c.c, 0.05); ctx.fill() }
      }
    })
    // puntos (los que migran dejan una cola)
    const counts = cs.map(() => 0); let inertia = 0
    for (const p of ps) {
      const c = cs[p.k], tx = c.x + p.ox * c.sx + Math.sin(t * 0.6 + p.ph) * 3, ty = c.y + p.oy * c.sy + Math.cos(t * 0.5 + p.ph) * 3
      const px = p.x, py = p.y; p.x = lerp(p.x, tx, 0.05); p.y = lerp(p.y, ty, 0.05)
      counts[p.k]++; inertia += ((p.x - c.x) / W) ** 2 + ((p.y - c.y) / H) ** 2
      const mv = Math.hypot(tx - p.x, ty - p.y)
      if (mv > 14) { ctx.strokeStyle = colA(c.c, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - (p.x - px) * 4, py - (p.y - py) * 4); ctx.lineTo(p.x, p.y); ctx.stroke() }
      if (p.k === hov) { ctx.strokeStyle = colA(c.c, 0.18); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(c.x, c.y); ctx.stroke() }
      ctx.fillStyle = colA(c.c, 0.8); ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, TAU); ctx.fill()
    }
    // centroides
    ctx.font = '600 11px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'middle'
    cs.forEach((c, i) => {
      const ph = (t * 0.5 + i * 0.25) % 1
      ctx.strokeStyle = colA(c.c, 0.5 * (1 - ph)); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, 8 + ph * 22, 0, TAU); ctx.stroke()
      ctx.strokeStyle = colA(c.c, 1); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x - 7, c.y); ctx.lineTo(c.x + 7, c.y); ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x, c.y + 7); ctx.stroke()
      ctx.fillStyle = neutral(0.85); ctx.textAlign = 'left'
      ctx.fillText(i === hov ? `${c.n} · n=${counts[i]} · σ=${(c.sx / Math.min(W, H) * 100).toFixed(1)}` : c.n, c.x + 12, c.y - 12)
    })
    ctx.globalAlpha = 1
    setHud([['Puntos', ps.length], ['Clústeres', cs.length], ['Inercia', (inertia * 100).toFixed(1)]])
  }
  return { build, frame, click }
})()
