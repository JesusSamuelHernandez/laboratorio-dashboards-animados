/* MAPA DE CALOR: matriz de actividad con una línea de tiempo que la barre. Aqua = bajo, naranja = alto. */
const COVER = (() => {
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  let cell = 48, cols = 0, rows = 0, ripples = []
  function build() { cell = clamp(Math.round(Math.min(W / 26, H / 13)), 30, 64); cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1; ripples = [] }
  function click(x, y, t) { ripples.push({ i: x / cell, j: y / cell, t0: t }) }

  function val(i, j, t) {
    let v = 0.5 + 0.28 * Math.sin(i * 0.45 + t * 0.7) * Math.cos(j * 0.8 - t * 0.45) + 0.2 * Math.sin((i + j) * 0.3 - t * 0.5)
    for (const r of ripples) { const age = t - r.t0, d = Math.hypot(i - r.i, j - r.j); v += 0.5 * Math.exp(-((d - age * 7) ** 2) / (2 * 1.4 * 1.4)) * (1 - age / 3) }
    return clamp(v)
  }
  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.3)
    ripples = ripples.filter((r) => t - r.t0 < 3)
    const scan = (t * 2.4) % (cols + 4) - 2
    const hi = mouse.on ? Math.floor(mouse.sx / cell) : -9, hj = mouse.on ? Math.floor(mouse.sy / cell) : -9
    let max = 0, sum = 0, hv = null
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = val(i, j, t); max = Math.max(max, v); sum += v
      const near = Math.max(0, 1 - Math.abs(i - scan) / 2.2), dev = Math.abs(v - 0.5) * 2
      const a = clamp(0.07 + 0.5 * dev + 0.35 * near + (i === hi || j === hj ? 0.12 : 0))
      ctx.fillStyle = hex(v > 0.5 ? pal.orange : pal.aqua, a)
      const s = cell - 5 + near * 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(i * cell + (cell - s) / 2, j * cell + (cell - s) / 2, s, s, 8) : ctx.rect(i * cell + 2, j * cell + 2, s, s); ctx.fill()
      if (i === hi && j === hj) hv = { i, j, v }
    }
    // línea de tiempo
    const g = ctx.createLinearGradient((scan - 1) * cell, 0, (scan + 1.6) * cell, 0); g.addColorStop(0, hex(pal.aqua, 0)); g.addColorStop(0.7, hex(pal.aqua, 0.18)); g.addColorStop(1, hex(pal.orange, 0.55))
    ctx.fillStyle = g; ctx.fillRect((scan - 1) * cell, 0, 2.6 * cell, H)
    // ejes
    ctx.font = '600 10px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'middle'; ctx.fillStyle = neutral(0.5); ctx.textAlign = 'center'
    for (let i = 1; i < cols; i += 3) ctx.fillText(String(i % 24).padStart(2, '0') + 'h', i * cell + cell / 2, 12)
    ctx.textAlign = 'left'; for (let j = 0; j < Math.min(rows, 14); j += 1) ctx.fillText(DAYS[j % 7], 6, j * cell + cell / 2)
    if (hv) {
      ctx.strokeStyle = neutral(0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(hv.i * cell + 1, hv.j * cell + 1, cell - 2, cell - 2, 9) : ctx.rect(hv.i * cell + 1, hv.j * cell + 1, cell - 2, cell - 2); ctx.stroke()
      const txt = `${DAYS[hv.j % 7]} ${String(hv.i % 24).padStart(2, '0')}:00 · ${Math.round(hv.v * 100)}`, w = ctx.measureText(txt).width + 18
      const tx = Math.min(mouse.sx + 14, W - w - 8), ty = Math.max(mouse.sy - 34, 8)
      ctx.fillStyle = pal.dark ? 'rgba(232,241,251,.95)' : 'rgba(31,41,55,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(tx, ty, w, 24, 8) : ctx.rect(tx, ty, w, 24); ctx.fill()
      ctx.fillStyle = pal.dark ? '#07111f' : '#fff'; ctx.textAlign = 'left'; ctx.fillText(txt, tx + 9, ty + 12)
    }
    ctx.globalAlpha = 1
    setHud([['Celdas', cols * rows], ['Máx', Math.round(max * 100)], ['Prom', Math.round((sum / (cols * rows)) * 100)]])
  }
  return { build, frame, click }
})()
