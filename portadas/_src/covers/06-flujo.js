/* CAMPO DE FLUJO: miles de partículas siguen un campo vectorial y dejan estelas. El cursor crea un remolino. */
const COVER = (() => {
  let ps = [], speedAvg = 0
  const angle = (x, y, t) => (Math.sin(x * 0.0021 + t * 0.12) + Math.cos(y * 0.0026 - t * 0.1) + Math.sin((x + y) * 0.0012 + t * 0.07) * 1.2) * 1.5

  function spawn(p) { p.x = Math.random() * W; p.y = Math.random() * H; p.life = 80 + Math.random() * 160; p.c = Math.random() < 0.4 ? 1 : 0 }
  function build() {
    ctx.clearRect(0, 0, W, H)
    const n = Math.round(clamp((W * H) / 900, 700, 2200)); ps = Array.from({ length: n }, () => { const p = {}; spawn(p); return p })
  }

  function frame(t) {
    // desvanece lo dibujado hacia transparente (el lienzo no pinta fondo, lo pone el CSS)
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
    smoothMouse(0.2)
    const a = easeOut(t / 2); let sp = 0
    ctx.lineWidth = 1.1; ctx.lineCap = 'round'
    const paths = [new Path2D(), new Path2D()]
    for (const p of ps) {
      let an = angle(p.x, p.y, t)
      let vx = Math.cos(an), vy = Math.sin(an)
      if (mouse.on) {
        const dx = p.x - mouse.sx, dy = p.y - mouse.sy, d = Math.hypot(dx, dy)
        if (d < 220 && d > 1) { const k = (1 - d / 220) * 2.4; vx += (-dy / d) * k + (dx / d) * 0.4 * k; vy += (dx / d) * k + (dy / d) * 0.4 * k }
      }
      const s = 1.1 + 0.5 * Math.hypot(vx, vy); sp += Math.hypot(vx, vy)
      const nx = p.x + vx * s, ny = p.y + vy * s
      paths[p.c].moveTo(p.x, p.y); paths[p.c].lineTo(nx, ny)
      p.x = nx; p.y = ny; p.life--
      if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) spawn(p)
    }
    speedAvg = lerp(speedAvg, sp / ps.length, 0.05)
    ctx.globalAlpha = a
    ctx.strokeStyle = hex(pal.aqua, pal.dark ? 0.85 : 0.7); ctx.stroke(paths[0])
    ctx.strokeStyle = hex(pal.orange, pal.dark ? 0.9 : 0.75); ctx.stroke(paths[1])
    ctx.globalAlpha = 1
    setHud([['Partículas', ps.length], ['Velocidad', speedAvg.toFixed(2)], ['Remolino', mouse.on ? 'activo' : '—']])
  }
  return { build, frame, noClear: true }
})()
