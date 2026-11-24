/* SISMÓGRAFO: cinco canales de señal que fluyen de derecha a izquierda; los eventos aparecen, vibran y se desvanecen.
   El clic provoca un evento en todos los canales; el cursor lee el valor del canal más cercano. */
const COVER = (() => {
  const CH = 5, SPEED = 110
  let events = [], nextEv = 1.2

  const f = (ch, tt) => {
    let v = 0.18 * Math.sin(tt * 2.3 + ch * 1.7) + 0.1 * Math.sin(tt * 6.1 + ch * 0.9) + 0.05 * Math.sin(tt * 15.7 + ch * 2.3) + 0.04 * Math.sin(tt * 41 + ch)
    for (const e of events) {
      if (e.ch !== -1 && e.ch !== ch) continue
      const d = tt - e.t0
      if (d > 0 && d < 3) v += e.amp * Math.exp(-d / 0.45) * Math.sin(d * 38 + ch)
    }
    return v
  }
  function build() { events = []; nextEv = 1.2 }
  function click(x, y, t) { events.push({ t0: t, amp: 1.1, ch: -1 }) }

  function frame(t) {
    ctx.globalAlpha = easeOut(t / 2)
    smoothMouse(0.2)
    if (t > nextEv) { events.push({ t0: t, amp: 0.6 + Math.random() * 0.6, ch: Math.floor(Math.random() * CH) }); nextEv = t + 1.2 + Math.random() * 2.6 }
    events = events.filter((e) => t - e.t0 < W / SPEED + 3)

    const xNow = W * 0.9, top = H * 0.16, bot = H * 0.88, step = (bot - top) / (CH - 1), amp = Math.min(step * 0.8, 90)
    // rejilla vertical que se desplaza con la señal
    ctx.strokeStyle = neutral(0.07); ctx.lineWidth = 1; ctx.beginPath()
    for (let x = xNow - ((t * SPEED) % 70); x > 0; x -= 70) { ctx.moveTo(x, top - 30); ctx.lineTo(x, bot + 30) }
    ctx.stroke()

    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textBaseline = 'middle'
    let nearest = 0, nd = 1e9
    for (let c = 0; c < CH; c++) {
      const y0 = top + c * step, col = c % 2 ? pal.orange : pal.aqua
      if (mouse.on && Math.abs(mouse.sy - y0) < nd) { nd = Math.abs(mouse.sy - y0); nearest = c }
      ctx.setLineDash([2, 6]); ctx.strokeStyle = neutral(0.18); ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(xNow + 30, y0); ctx.stroke(); ctx.setLineDash([])
      const g = ctx.createLinearGradient(0, 0, xNow, 0); g.addColorStop(0, hex(col, 0)); g.addColorStop(0.6, hex(col, 0.55)); g.addColorStop(1, hex(col, 0.95))
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.beginPath()
      for (let x = 0; x <= xNow; x += 3) { const y = y0 - f(c, t - (xNow - x) / SPEED) * amp; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
      ctx.stroke()
      const hy = y0 - f(c, t) * amp, ph = (t * 0.8 + c * 0.3) % 1
      ctx.strokeStyle = hex(col, 0.5 * (1 - ph)); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(xNow, hy, 4 + ph * 12, 0, TAU); ctx.stroke()
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xNow, hy, 3.4, 0, TAU); ctx.fill()
      ctx.fillStyle = neutral(0.55); ctx.textAlign = 'left'; ctx.fillText('CH' + (c + 1), 20, y0 - 14)
    }
    // marcadores de evento
    for (const e of events) {
      const x = xNow - (t - e.t0) * SPEED; if (x < 10) continue
      const a = clamp(1 - (t - e.t0) / 5)
      if (e.ch === -1) { ctx.setLineDash([3, 5]); ctx.strokeStyle = hex(pal.orange, 0.35 * a); ctx.beginPath(); ctx.moveTo(x, top - 24); ctx.lineTo(x, bot + 24); ctx.stroke(); ctx.setLineDash([]) }
      const chs = e.ch === -1 ? [0] : [e.ch], y = top + chs[0] * step - amp - 6
      ctx.fillStyle = hex(pal.orange, 0.9 * a); ctx.beginPath(); ctx.moveTo(x - 4, y - 7); ctx.lineTo(x + 4, y - 7); ctx.lineTo(x, y); ctx.closePath(); ctx.fill()
      ctx.fillStyle = neutral(0.8 * a); ctx.textAlign = 'center'; ctx.fillText('Δ ' + (e.amp * 4).toFixed(1), x, y - 15)
    }
    // lectura bajo el cursor
    if (mouse.on) {
      ctx.strokeStyle = neutral(0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mouse.sx, top - 30); ctx.lineTo(mouse.sx, bot + 30); ctx.stroke()
      const xx = clamp(mouse.sx, 0, xNow), y0 = top + nearest * step, v = f(nearest, t - (xNow - xx) / SPEED)
      ctx.fillStyle = pal.orange; ctx.beginPath(); ctx.arc(xx, y0 - v * amp, 4, 0, TAU); ctx.fill()
      ctx.fillStyle = neutral(0.9); ctx.textAlign = mouse.sx > W * 0.7 ? 'right' : 'left'
      ctx.fillText(`CH${nearest + 1}  ${v >= 0 ? '+' : ''}${v.toFixed(2)}`, mouse.sx + (mouse.sx > W * 0.7 ? -10 : 10), y0 - v * amp - 14)
    }
    ctx.globalAlpha = 1
    setHud([['Canales', CH], ['Eventos', events.length], ['Muestreo', '128 Hz']])
  }
  return { build, frame, click }
})()
