/* RED DE DATOS: nodos a la deriva que se enlazan por cercanía; pulsos viajan por los enlaces. */
const COVER = (() => {
  let nodes = []
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x) }

  function build() {
    const n = Math.round(clamp((W * H) / 13000, 36, 120)); nodes = []
    for (let i = 0; i < n; i++) {
      const hub = i < 7
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: hub ? 4.5 : 1.6 + Math.random() * 1.4, hub, col: i % 3 === 0 ? 'orange' : 'aqua', ph: Math.random() * TAU })
    }
  }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.15)
    const L = clamp(Math.min(W, H) * 0.2, 95, 175), L2 = L * L
    const mx = mouse.sx, my = mouse.sy, mOn = mouse.on

    for (const n of nodes) {
      n.vx += Math.sin(n.y * 0.004 + t * 0.3) * 0.0025; n.vy += Math.cos(n.x * 0.004 + t * 0.25) * 0.0025
      if (mOn) {
        const dx = mx - n.x, dy = my - n.y, d = Math.hypot(dx, dy)
        if (d < 190 && d > 1) { const f = d < 60 ? -0.05 : 0.012; n.vx += (dx / d) * f * (1 - d / 190); n.vy += (dy / d) * f * (1 - d / 190) }
      }
      const sp = Math.hypot(n.vx, n.vy), max = n.hub ? 0.22 : 0.4
      if (sp > max) { n.vx = (n.vx / sp) * max; n.vy = (n.vy / sp) * max }
      n.x += n.vx; n.y += n.vy
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20
      if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20
    }

    let links = 0, pulses = 0
    ctx.lineWidth = 1
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy
      if (d2 > L2) continue
      const k = 1 - Math.sqrt(d2) / L; links++
      ctx.strokeStyle = neutral(0.05 + 0.32 * k * k * (a.hub || b.hub ? 1.4 : 1)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      const h = hash(i, j)
      if (h > 0.84) {
        pulses++
        const u = (t * (0.25 + h * 0.3) + h * 9) % 1
        ctx.fillStyle = hex(pal[u > 0.5 ? b.col : a.col], 0.35 + 0.6 * k)
        ctx.beginPath(); ctx.arc(a.x + dx * u, a.y + dy * u, 2.2, 0, TAU); ctx.fill()
      }
    }
    if (mOn) for (const n of nodes) {
      const d = Math.hypot(mx - n.x, my - n.y); if (d > 170) continue
      ctx.strokeStyle = hex(pal[n.col], 0.45 * (1 - d / 170)); ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(n.x, n.y); ctx.stroke()
    }
    for (const n of nodes) {
      if (n.hub) {
        const ph = ((t * 0.5 + n.ph) % 1)
        ctx.strokeStyle = hex(pal[n.col], 0.5 * (1 - ph)); ctx.beginPath(); ctx.arc(n.x, n.y, 8 + ph * 34, 0, TAU); ctx.stroke()
        ctx.strokeStyle = hex(pal[n.col], 0.7); ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, TAU); ctx.stroke()
      }
      ctx.fillStyle = hex(pal[n.col], n.hub ? 1 : 0.85); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.fill()
    }
    if (mOn) { ctx.strokeStyle = neutral(0.45); ctx.beginPath(); ctx.arc(mx, my, 12 + 2 * Math.sin(t * 4), 0, TAU); ctx.stroke() }
    ctx.globalAlpha = 1
    setHud([['Nodos', nodes.length], ['Enlaces', links], ['Pulsos', pulses]])
  }
  return { build, frame }
})()
