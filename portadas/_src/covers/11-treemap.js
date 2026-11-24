/* TREEMAP VIVO: áreas proporcionales al valor (algoritmo squarified). Cuando los valores cambian, los mosaicos se reacomodan fluidos. */
const COVER = (() => {
  const ITEMS = [['Norteamérica', 90], ['Europa', 70], ['Asia', 100], ['Latam', 45], ['África', 30], ['Oceanía', 18], ['Ventas', 60], ['Soporte', 34], ['Logística', 52], ['Finanzas', 40], ['Marketing', 26], ['TI', 38], ['Compras', 22], ['Datos', 48]]
  let tiles = []

  function squarify(items, x, y, w, h) {
    const out = []; let rest = items.slice()
    const worst = (row, side) => { const s = row.reduce((a, b) => a + b.area, 0), mx = Math.max(...row.map((r) => r.area)), mn = Math.min(...row.map((r) => r.area)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)) }
    while (rest.length) {
      const side = Math.min(w, h); const row = [rest[0]]; let i = 1
      while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) { row.push(rest[i]); i++ }
      const s = row.reduce((a, b) => a + b.area, 0)
      if (w >= h) { const cw = s / h; let cy = y; for (const r of row) { const rh = r.area / cw; out.push({ it: r, x, y: cy, w: cw, h: rh }); cy += rh } x += cw; w -= cw }
      else { const rh = s / w; let cx = x; for (const r of row) { const rw = r.area / rh; out.push({ it: r, x: cx, y, w: rw, h: rh }); cx += rw } y += rh; h -= rh }
      rest = rest.slice(i)
    }
    return out
  }

  function build() { tiles = ITEMS.map(([name, b], i) => ({ name, b, ph: Math.random() * TAU, cat: i % 2, rect: null, prev: b, dv: 0, v: b })) }
  function click() { for (const t of tiles) t.ph = Math.random() * TAU }
  const col = (c, a) => (c === 0 ? hex(pal.aqua, a) : hex(pal.orange, a))
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }

  function frame(t) {
    smoothMouse(0.3)
    ctx.globalAlpha = easeOut(t / 2)
    const m = Math.min(W, H) < 600 ? 10 : 24, ax = m, ay = m, aw = W - m * 2, ah = H - m * 2 - 36
    for (const tl of tiles) { tl.v = tl.b * (0.75 + 0.45 * Math.sin(t * 0.18 + tl.ph)); tl.dv = lerp(tl.dv, (tl.v - tl.prev) * 60, 0.1); tl.prev = tl.v }
    const sorted = [...tiles].sort((a, b) => b.v - a.v), total = sorted.reduce((a, b) => a + b.v, 0)
    const lay = squarify(sorted.map((s) => ({ ref: s, area: (s.v / total) * aw * ah })), ax, ay, aw, ah)
    let hover = null
    lay.forEach(({ it, x, y, w, h }, rank) => {
      const tl = it.ref; tl.rank = rank
      if (!tl.rect) tl.rect = { x: W / 2, y: H / 2, w: 0, h: 0 }
      const r = tl.rect; r.x = lerp(r.x, x, 0.1); r.y = lerp(r.y, y, 0.1); r.w = lerp(r.w, w, 0.1); r.h = lerp(r.h, h, 0.1)
      if (mouse.on && mouse.sx >= r.x && mouse.sx <= r.x + r.w && mouse.sy >= r.y && mouse.sy <= r.y + r.h) hover = tl
    })
    for (const tl of sorted) {
      const r = tl.rect, hv = tl === hover, k = 1 - tl.rank / tiles.length
      const gx = r.x + 2, gy = r.y + 2, gw = Math.max(0, r.w - 4), gh = Math.max(0, r.h - 4)
      ctx.fillStyle = col(tl.cat, hv ? 0.34 : 0.1 + 0.16 * k); rr(gx, gy, gw, gh, 10); ctx.fill()
      ctx.strokeStyle = col(tl.cat, hv ? 1 : 0.55); ctx.lineWidth = hv ? 2 : 1.1; ctx.stroke()
      if (gw > 70 && gh > 42) {
        const fs = clamp(gw / 9, 12, 22)
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = neutral(0.85); ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`; ctx.fillText(tl.name, gx + 12, gy + 12 + fs)
        ctx.fillStyle = neutral(0.6); ctx.font = `600 ${clamp(fs * 0.7, 10, 14)}px ui-monospace, Menlo, monospace`
        const up = tl.dv >= 0; ctx.fillText(Math.round(tl.v * 10) / 10 + '', gx + 12, gy + 12 + fs + clamp(fs * 0.95, 14, 22))
        ctx.fillStyle = up ? pal.aqua : pal.orange; ctx.fillText((up ? '▲' : '▼') + ' ' + Math.abs(tl.dv).toFixed(1), gx + 12 + ctx.measureText(Math.round(tl.v * 10) / 10 + '  ').width, gy + 12 + fs + clamp(fs * 0.95, 14, 22))
      }
    }
    ctx.globalAlpha = 1
    setHud([['Categorías', tiles.length], ['Total', Math.round(total)], ['Líder', sorted[0].name]])
  }
  return { build, frame, click }
})()
