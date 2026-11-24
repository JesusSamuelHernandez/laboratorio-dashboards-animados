/* SANKEY: caudales entre fuentes, procesos y destinos. El grosor es volumen; las partículas, tráfico. Los valores respiran. */
const COVER = (() => {
  const SRC = ['Web', 'App móvil', 'Tienda', 'Partners', 'Soporte'], MID = ['Ingesta', 'Calidad', 'Modelos', 'Reportes'], DST = ['Dashboards', 'APIs', 'Alertas', 'Exportes', 'Archivo']
  const B01 = [[8, 6, 5, 3], [6, 5, 6, 4], [4, 3, 2, 5], [3, 4, 2, 2], [2, 3, 3, 1]]
  const S12 = [[4, 2, 1, 1, 0.6], [1, 2, 4, 1, 1], [2, 4, 1, 3, 0.8], [5, 1, 1, 3, 2]]
  const NW = 14
  const colOf = (i) => (i % 2 ? pal.orange : pal.aqua)

  function flows(t) {
    const F01 = B01.map((r, i) => r.map((v, j) => v * (0.75 + 0.35 * Math.sin(t * 0.35 + i * 1.3 + j * 0.9))))
    const m = MID.map((_, j) => F01.reduce((a, r) => a + r[j], 0))
    const F12 = S12.map((r, j) => { const s = r.map((v, k) => v * (0.8 + 0.4 * Math.sin(t * 0.3 + j * 1.7 + k * 1.1))), sum = s.reduce((a, b) => a + b, 0); return s.map((v) => (m[j] * v) / sum) })
    const d = DST.map((_, k) => F12.reduce((a, r) => a + r[k], 0))
    return { F01, F12, src: F01.map((r) => r.reduce((a, b) => a + b, 0)), m, d }
  }
  function build() {}

  const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3 }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.3)
    const fl = flows(t), total = fl.src.reduce((a, b) => a + b, 0)
    const side = clamp(W * 0.13, 90, 190), xs = [side, W / 2 - NW / 2, W - side - NW]
    const top = H * 0.12, bot = H * 0.86, gap = 14, scale = (bot - top - gap * 4) / total
    const place = (vals, x) => { const hTot = vals.reduce((a, b) => a + b * scale, 0) + gap * (vals.length - 1); let y = top + (bot - top - hTot) / 2; return vals.map((v) => { const n = { x, y, h: v * scale, o: 0, i: 0 }; y += v * scale + gap; return n }) }
    const nS = place(fl.src, xs[0]), nM = place(fl.m, xs[1]), nD = place(fl.d, xs[2])
    // pasar el cursor sobre un nodo resalta sus flujos
    let hov = null
    const all = [['s', nS], ['m', nM], ['d', nD]]
    if (mouse.on) for (const [k, arr] of all) arr.forEach((n, i) => { if (mouse.sx >= n.x - 6 && mouse.sx <= n.x + NW + 6 && mouse.sy >= n.y && mouse.sy <= n.y + n.h) hov = k + i })

    const bands = []
    fl.F01.forEach((row, i) => row.forEach((v, j) => { const h = v * scale, a = nS[i], b = nM[j]; bands.push({ x1: a.x + NW, x2: b.x, sy: a.y + a.o, ty: b.y + b.i, h, c: colOf(i), ids: ['s' + i, 'm' + j], v }); a.o += h; b.i += h }))
    nM.forEach((n) => { n.o = 0 })
    fl.F12.forEach((row, j) => row.forEach((v, k) => { const h = v * scale, a = nM[j], b = nD[k]; bands.push({ x1: a.x + NW, x2: b.x, sy: a.y + a.o, ty: b.y + b.i, h, c: colOf(j), ids: ['m' + j, 'd' + k], v }); a.o += h; b.i += h }))

    ctx.lineWidth = 1
    bands.forEach((b, idx) => {
      const on = !hov || b.ids.includes(hov), xm = (b.x1 + b.x2) / 2
      ctx.fillStyle = hex(b.c, on ? 0.2 : 0.05)
      ctx.beginPath(); ctx.moveTo(b.x1, b.sy); ctx.bezierCurveTo(xm, b.sy, xm, b.ty, b.x2, b.ty); ctx.lineTo(b.x2, b.ty + b.h); ctx.bezierCurveTo(xm, b.ty + b.h, xm, b.sy + b.h, b.x1, b.sy + b.h); ctx.closePath(); ctx.fill()
      // partículas de tráfico por la línea central
      const n = Math.max(1, Math.round(b.v * 0.45)), y0 = b.sy + b.h / 2, y1 = b.ty + b.h / 2
      ctx.fillStyle = hex(b.c, on ? 0.95 : 0.2)
      for (let p = 0; p < n; p++) {
        const u = (t * 0.12 + idx * 0.173 + p / n) % 1
        ctx.beginPath(); ctx.arc(bez(b.x1, xm, xm, b.x2, u), bez(y0, y0, y1, y1, u), clamp(b.h * 0.16, 1.3, 3), 0, TAU); ctx.fill()
      }
    })
    // nodos y etiquetas
    ctx.font = '600 11px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'middle'
    const drawNodes = (arr, key, names, vals, align) => arr.forEach((n, i) => {
      const hv = hov === key + i
      ctx.fillStyle = key === 'm' ? neutral(hv ? 0.95 : 0.7) : hex(colOf(i), hv ? 1 : 0.9); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(n.x, n.y, NW, n.h, 4) : ctx.rect(n.x, n.y, NW, n.h); ctx.fill()
      const label = `${names[i]}  ${vals[i].toFixed(1)}`
      ctx.fillStyle = neutral(hv ? 1 : 0.78)
      if (align === 'l') { ctx.textAlign = 'right'; ctx.fillText(label, n.x - 10, n.y + n.h / 2) }
      else if (align === 'r') { ctx.textAlign = 'left'; ctx.fillText(label, n.x + NW + 10, n.y + n.h / 2) }
      else { ctx.textAlign = 'center'; ctx.fillText(names[i], n.x + NW / 2, n.y - 9) }
    })
    drawNodes(nS, 's', SRC, fl.src, 'l'); drawNodes(nM, 'm', MID, fl.m, 'c'); drawNodes(nD, 'd', DST, fl.d, 'r')
    ctx.globalAlpha = 1
    setHud([['Flujos', bands.length], ['Caudal', total.toFixed(0)], ['Nodos', SRC.length + MID.length + DST.length]])
  }
  return { build, frame }
})()
