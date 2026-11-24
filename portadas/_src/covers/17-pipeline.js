/* PIPELINE DE DATOS: eventos que cruzan cinco etapas. Cada nodo procesa de uno en uno; donde se acumula cola, el nodo se vuelve naranja. */
const COVER = (() => {
  const ST = ['Ingesta', 'Validación', 'Enriquecimiento', 'Agregación', 'Destino'], CNT = [1, 3, 4, 3, 2], SV = [0.03, 0.12, 0.36, 0.14, 0.07]
  const TS = 0.4          // escala de tiempo: flujos lentos y viscosos
  let nodes = [], edges = [], pk = [], clock = 0, lastT = 0, acc = 0, done = 0, lat = 0, recent = []

  function build() {
    nodes = []; edges = []; pk = []; clock = 0; acc = 0; done = 0; lat = 0; recent = []
    const xs = ST.map((_, s) => W * (0.1 + 0.8 * (s / 4)))
    ST.forEach((_, s) => { for (let k = 0; k < CNT[s]; k++) nodes.push({ s, k, x: xs[s], y: H * (0.24 + 0.52 * (CNT[s] === 1 ? 0.5 : k / (CNT[s] - 1))), q: [], cur: null, busy: 0, util: 0, out: [], ph: Math.random() * TAU }) })
    for (const a of nodes) if (a.s < 4) for (const b of nodes) if (b.s === a.s + 1) { const e = { a, b, w: 1 / (1 + Math.abs(a.y - b.y) / (H * 0.25)) }; edges.push(e); a.out.push(e) }
    for (let i = 0; i < 150; i++) step(0.03)
  }
  function spawn(n = 1) { for (let i = 0; i < n; i++) { const p = { n: nodes[0], t0: clock, col: Math.random() < 0.2 ? 'orange' : 'aqua', e: null, u: 0, sp: 1.7 + Math.random() * 0.8 }; nodes[0].q.push(p); pk.push(p) } }
  function click() { spawn(26) }

  function step(dt) {
    clock += dt
    acc += (10 + 5 * Math.sin(clock * 0.3)) * dt; while (acc >= 1) { acc -= 1; spawn() }
    for (const n of nodes) {
      if (!n.cur && n.q.length) { n.cur = n.q.shift(); n.busy = SV[n.s] * (0.7 + Math.random() * 0.6) }
      if (n.cur) {
        n.busy -= dt
        if (n.busy <= 0) {
          const p = n.cur; n.cur = null
          if (n.s === 4) { done++; lat = lerp(lat, clock - p.t0, 0.05); p.dead = true; recent.push(clock) }
          else { let r = Math.random() * n.out.reduce((a, e) => a + e.w, 0), e = n.out[0]; for (const o of n.out) { r -= o.w; if (r <= 0) { e = o; break } } p.e = e; p.u = 0 }
        }
      }
      n.util = lerp(n.util, n.cur ? 1 : 0, 0.06)
    }
    for (const p of pk) if (p.e) { p.u += dt * p.sp; if (p.u >= 1) { p.n = p.e.b; p.n.q.push(p); p.e = null } }
    pk = pk.filter((p) => !p.dead)
    recent = recent.filter((r) => clock - r < 2)
    if (pk.length > 520) pk.splice(0, pk.length - 520)
  }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    step(dt * TS)
    ctx.globalAlpha = easeOut(t / 2)
    // aristas
    ctx.lineWidth = 1
    for (const e of edges) { ctx.strokeStyle = neutral(0.1 + 0.16 * e.w); ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); const mx = (e.a.x + e.b.x) / 2; ctx.bezierCurveTo(mx, e.a.y, mx, e.b.y, e.b.x, e.b.y); ctx.stroke() }
    // paquetes en tránsito (siguen la curva)
    for (const p of pk) {
      if (!p.e) continue
      const { a, b } = p.e, u = p.u, mx = (a.x + b.x) / 2, v = 1 - u
      const x = v * v * v * a.x + 3 * v * v * u * mx + 3 * v * u * u * mx + u * u * u * b.x, y = v * v * v * a.y + 3 * v * v * u * a.y + 3 * v * u * u * b.y + u * u * u * b.y
      ctx.fillStyle = hex(p.col === 'orange' ? pal.orange : pal.aqua, 0.9); ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill()
    }
    // nodos con cola
    ctx.font = '600 10px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'middle'
    for (const n of nodes) {
      const qn = n.q.length, hot = clamp(qn / 10), c = hot > 0.35 ? pal.orange : pal.aqua
      ctx.fillStyle = hex(c, 0.15 + 0.2 * hot); ctx.beginPath(); ctx.arc(n.x, n.y, 15, 0, TAU); ctx.fill()
      ctx.strokeStyle = hex(c, 0.85); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.y, 15, -Math.PI / 2, -Math.PI / 2 + TAU * (0.15 + 0.85 * n.util)); ctx.stroke()
      ctx.strokeStyle = neutral(0.2); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, 15, 0, TAU); ctx.stroke()
      const ph = (t * 0.5 + n.ph) % 1; if (n.cur) { ctx.strokeStyle = hex(c, 0.4 * (1 - ph)); ctx.beginPath(); ctx.arc(n.x, n.y, 15 + ph * 14, 0, TAU); ctx.stroke() }
      ctx.fillStyle = hex(c, 1); ctx.beginPath(); ctx.arc(n.x, n.y, 3.5, 0, TAU); ctx.fill()
      // cola: paquetes esperando apilados sobre el nodo
      for (let i = 0; i < Math.min(qn, 24); i++) { ctx.fillStyle = hex(n.q[i].col === 'orange' ? pal.orange : pal.aqua, 0.85); ctx.beginPath(); ctx.arc(n.x - 15 + (i % 8) * 4.4, n.y - 26 - Math.floor(i / 8) * 5, 1.8, 0, TAU); ctx.fill() }
      if (qn > 0) { ctx.fillStyle = neutral(0.7); ctx.textAlign = 'center'; ctx.fillText(String(qn), n.x, n.y + 27) }
    }
    ctx.fillStyle = neutral(0.5); ctx.textAlign = 'center'
    ST.forEach((s, i) => ctx.fillText(s.toUpperCase(), W * (0.1 + 0.8 * (i / 4)), H * 0.12))
    ctx.globalAlpha = 1
    setHud([['En vuelo', pk.length], ['Rendimiento', ((recent.length / 2) * TS).toFixed(1) + '/s'], ['Latencia', (lat / TS).toFixed(1) + ' s']])
  }
  return { build, frame, click }
})()
