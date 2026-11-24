/* BURBUJAS DE DATOS: cada burbuja es una categoría; su tamaño sigue al valor. Se empujan entre sí y el cursor las aparta. */
const COVER = (() => {
  const NAMES = ['Ventas', 'Soporte', 'Logística', 'Finanzas', 'RR.HH.', 'Marketing', 'TI', 'Compras', 'Calidad', 'Legal', 'Producto', 'Datos']
  let bs = [], lastT = 0
  const col = (b, a) => (b.cat === 0 ? hex(pal.aqua, a) : b.cat === 1 ? hex(pal.orange, a) : neutral(a * 0.9))
  const val = (b, t) => b.v * (1 + 0.3 * Math.sin(t * 0.4 + b.ph))

  function build() {
    const sc = Math.min(W, H) / 800, n = Math.round(clamp((W * H) / 24000, 24, 58))
    bs = Array.from({ length: n }, (_, i) => {
      const base = 14 + Math.pow(Math.random(), 2.3) * 70 * sc
      return { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, base, r: base, cat: i % 3, ph: Math.random() * TAU, name: NAMES[i % NAMES.length], v: 20 + Math.random() * 80 }
    })
    for (let k = 0; k < 140; k++) physics(0.016, 0)       // se asientan sin solaparse
  }

  function physics(dt, t) {
    for (const b of bs) {
      b.vx += Math.sin(b.y * 0.004 + t * 0.2 + b.ph) * 14 * dt; b.vy += Math.cos(b.x * 0.004 + t * 0.17 + b.ph) * 14 * dt
      if (b.x < b.r) b.vx += (b.r - b.x) * 4 * dt; if (b.x > W - b.r) b.vx -= (b.x - (W - b.r)) * 4 * dt
      if (b.y < b.r) b.vy += (b.r - b.y) * 4 * dt; if (b.y > H - b.r) b.vy -= (b.y - (H - b.r)) * 4 * dt
      if (mouse.on) {
        const dx = b.x - mouse.sx, dy = b.y - mouse.sy, d = Math.hypot(dx, dy) || 1, reach = b.r + 120
        if (d < reach) { const f = (1 - d / reach) * 900 * dt; b.vx += (dx / d) * f; b.vy += (dy / d) * f }
      }
    }
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 4
      if (d < min) { const p = (min - d) * 0.5, nx = dx / d, ny = dy / d; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; a.vx -= nx * 6; a.vy -= ny * 6; b.vx += nx * 6; b.vy += ny * 6 }
    }
    for (const b of bs) {
      const damp = Math.pow(0.25, dt), sp = Math.hypot(b.vx, b.vy), cap = 260
      b.vx *= damp; b.vy *= damp; if (sp > cap) { b.vx = (b.vx / sp) * cap; b.vy = (b.vy / sp) * cap }
      b.x += b.vx * dt; b.y += b.vy * dt
      b.r = lerp(b.r, b.base * Math.sqrt(1 + 0.3 * Math.sin(t * 0.4 + b.ph)), 0.1)
    }
  }
  function click(x, y) { for (const b of bs) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy) || 1; const f = clamp(1 - d / 460) * 900; b.vx += (dx / d) * f; b.vy += (dy / d) * f } }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    smoothMouse(0.2); physics(dt, t)
    ctx.globalAlpha = easeOut(t / 2)
    let hover = null, total = 0, top = bs[0]
    for (const b of bs) { if (Math.hypot(mouse.sx - b.x, mouse.sy - b.y) < b.r && mouse.on) hover = b; total += val(b, t); if (val(b, t) > val(top, t)) top = b }
    for (const b of bs) {
      const hv = b === hover
      ctx.fillStyle = col(b, hv ? 0.3 : 0.14); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill()
      ctx.strokeStyle = col(b, hv ? 1 : 0.7); ctx.lineWidth = hv ? 2.2 : 1.3; ctx.stroke()
      ctx.strokeStyle = col(b, 0.22); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.68, 0, TAU); ctx.stroke()
      if (b.r > 28) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = neutral(0.82); ctx.font = `600 ${clamp(b.r * 0.26, 11, 16)}px Inter, system-ui, sans-serif`; ctx.fillText(b.name, b.x, b.y - 6)
        ctx.fillStyle = neutral(0.6); ctx.font = `600 ${clamp(b.r * 0.2, 10, 13)}px ui-monospace, Menlo, monospace`; ctx.fillText(Math.round(val(b, t)) + '', b.x, b.y + 10)
      }
    }
    if (hover) {
      const txt = `${hover.name} · ${Math.round(val(hover, t))}`
      ctx.font = '600 12px ui-monospace, Menlo, monospace'; const w = ctx.measureText(txt).width + 18
      ctx.fillStyle = pal.dark ? 'rgba(232,241,251,.95)' : 'rgba(31,41,55,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(mouse.sx + 14, mouse.sy - 30, w, 24, 8) : ctx.rect(mouse.sx + 14, mouse.sy - 30, w, 24); ctx.fill()
      ctx.fillStyle = pal.dark ? '#07111f' : '#fff'; ctx.textAlign = 'left'; ctx.fillText(txt, mouse.sx + 23, mouse.sy - 17)
    }
    ctx.globalAlpha = 1
    setHud([['Burbujas', bs.length], ['Total', Math.round(total)], ['Mayor', top.name]])
  }
  return { build, frame, click }
})()
