/* RADAR: tres series sobre ocho ejes que se transforman; un haz barre y hace brillar cada vértice. Acércate a un eje para leerlo. */
const COVER = (() => {
  const AX = ['Ventas', 'Calidad', 'Costos', 'Entrega', 'Soporte', 'Retención', 'Margen', 'Innovación'], N = AX.length
  const S = [{ n: 'Actual', c: 'aqua', ph: 0, b: 0.7 }, { n: 'Meta', c: 'orange', ph: 2.1, b: 0.58 }, { n: 'Mercado', c: 'ink', ph: 4.2, b: 0.42 }]
  let cx = 0, cy = 0, R = 300
  const colA = (c, a) => (c === 'ink' ? neutral(a * 0.9) : hex(pal[c], a))
  const val = (s, k, t) => clamp(s.b + 0.22 * Math.sin(t * 0.4 + s.ph + k * 1.3) + 0.1 * Math.sin(t * 0.9 + k * 2.7 + s.ph), 0.12, 1)
  const ang = (k) => -Math.PI / 2 + (k / N) * TAU
  function build() { cx = W / 2; cy = H * 0.5; R = Math.min(W, H) * 0.4 }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.25)
    const grow = easeOut(t / 1.8)
    // cuadrícula poligonal (cinco niveles) y ejes
    ctx.lineWidth = 1
    for (let l = 1; l <= 5; l++) {
      ctx.strokeStyle = neutral(0.08 + 0.03 * (l === 5)); ctx.beginPath()
      for (let k = 0; k <= N; k++) { const r = (R * l * grow) / 5, a = ang(k); k ? ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) }
      ctx.stroke()
    }
    // eje bajo el cursor
    let hk = -1
    if (mouse.on) { const d = Math.hypot(mouse.sx - cx, mouse.sy - cy); if (d < R * 1.25 && d > 20) { let a = Math.atan2(mouse.sy - cy, mouse.sx - cx) + Math.PI / 2; a = ((a % TAU) + TAU) % TAU; hk = Math.round(a / (TAU / N)) % N } }
    for (let k = 0; k < N; k++) {
      const a = ang(k); ctx.strokeStyle = neutral(k === hk ? 0.45 : 0.12); ctx.lineWidth = k === hk ? 1.6 : 1
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * grow, cy + Math.sin(a) * R * grow); ctx.stroke()
    }
    // haz de barrido
    const sw = (t * 0.7) % TAU - Math.PI / 2
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, hex(pal.aqua, 0.0)); g.addColorStop(1, hex(pal.aqua, 0.22))
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * grow, sw - 0.6, sw); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = hex(pal.aqua, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * R * grow, cy + Math.sin(sw) * R * grow); ctx.stroke()

    // series
    S.forEach((s, si) => {
      ctx.beginPath()
      for (let k = 0; k < N; k++) { const r = val(s, k, t) * R * grow, a = ang(k); k ? ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) }
      ctx.closePath(); ctx.fillStyle = colA(s.c, si === 0 ? 0.16 : 0.07); ctx.fill(); ctx.strokeStyle = colA(s.c, 0.9); ctx.lineWidth = si === 0 ? 2.4 : 1.6; ctx.setLineDash(si === 2 ? [5, 5] : []); ctx.stroke(); ctx.setLineDash([])
      for (let k = 0; k < N; k++) {
        const r = val(s, k, t) * R * grow, a = ang(k), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
        let d = Math.abs((((a - sw) % TAU) + TAU) % TAU); d = Math.min(d, TAU - d)           // cercanía al haz
        const glow = clamp(1 - d / 0.35)
        if (glow > 0.01) { ctx.strokeStyle = colA(s.c, 0.6 * glow); ctx.beginPath(); ctx.arc(x, y, 5 + glow * 12, 0, TAU); ctx.stroke() }
        ctx.fillStyle = colA(s.c, 1); ctx.beginPath(); ctx.arc(x, y, 3 + glow * 2, 0, TAU); ctx.fill()
      }
    })
    // etiquetas de ejes
    ctx.font = '600 11px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'middle'
    for (let k = 0; k < N; k++) {
      const a = ang(k), x = cx + Math.cos(a) * (R * 1.13 + 6), y = cy + Math.sin(a) * (R * 1.13 + 6)
      ctx.fillStyle = neutral(k === hk ? 1 : 0.65); ctx.textAlign = Math.cos(a) > 0.3 ? 'left' : Math.cos(a) < -0.3 ? 'right' : 'center'; ctx.fillText(AX[k], x, y)
    }
    if (hk >= 0) {
      const lines = [AX[hk], ...S.map((s) => `${s.n.padEnd(8, ' ')} ${Math.round(val(s, hk, t) * 100)}`)]
      ctx.font = '600 12px ui-monospace, Menlo, monospace'; const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 20, h = lines.length * 18 + 10
      const tx = Math.min(mouse.sx + 16, W - w - 8), ty = Math.max(mouse.sy - h - 10, 8)
      ctx.fillStyle = pal.dark ? 'rgba(232,241,251,.95)' : 'rgba(31,41,55,.93)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(tx, ty, w, h, 9) : ctx.rect(tx, ty, w, h); ctx.fill()
      ctx.fillStyle = pal.dark ? '#07111f' : '#fff'; ctx.textAlign = 'left'; lines.forEach((l, i) => ctx.fillText(l, tx + 10, ty + 14 + i * 18))
    }
    ctx.globalAlpha = 1
    setHud([['Ejes', N], ['Series', S.length], ['Actual', Math.round((AX.reduce((a, _, k) => a + val(S[0], k, t), 0) / N) * 100) + '%']])
  }
  return { build, frame }
})()
