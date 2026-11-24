/* ÁRBOL FRACTAL DE DATOS: cada rama se divide en dos, recursivamente. La "savia" es una ola de datos que sube por las ramas;
   las hojas son puntos de datos. El cursor mueve el viento; el clic siembra un árbol nuevo. */
const COVER = (() => {
  const MAXD = 9
  let seed = 1, g0 = 0, trees = [], wind = 0, segs = 0, leaves = 0
  const rnd = (k) => { const x = Math.sin(k * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x) }

  function build() { trees = [{ x: W * 0.15, s: 1.0 }, { x: W * 0.85, s: 1.06 }, { x: W * 0.5, s: 0.5 }]; g0 = -1e9 }
  function click(x, y, t) { seed = (seed + 1) % 997; g0 = t }

  function frame(t) {
    if (g0 < -1e8) g0 = 0
    smoothMouse(0.1)
    wind = lerp(wind, mouse.on ? (mouse.sx / W - 0.5) * 1.6 : 0, 0.05)
    const grow = easeOut((t - g0) / 4) * (MAXD + 1)
    segs = 0; leaves = 0
    ctx.globalAlpha = easeOut(t / 1.5); ctx.lineCap = 'round'
    const sap = (d, t2) => { const ph = (t2 * 1.5 - d * 0.55) % 4.5; return ph >= 0 && ph < 0.9 ? 1 - ph / 0.9 : 0 }   // ola de savia que sube
    function branch(x, y, len, ang, depth, id, tr) {
      if (depth > grow) return
      const frac = clamp(grow - depth), L = len * frac
      const a = ang + Math.sin(t * 0.7 + depth * 0.45 + tr.x * 0.01) * (0.016 + depth * 0.005) + wind * depth * 0.04
      const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L
      const gl = sap(depth, t) * (frac > 0.99 ? 1 : 0), w = Math.max(0.9, (MAXD - depth) * 1.05 + 0.8)
      ctx.strokeStyle = neutral(Math.min(1, 0.98 - depth * 0.03)); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke()
      if (gl > 0.02) { ctx.strokeStyle = hex(pal.orange, gl); ctx.lineWidth = w + 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke() }
      segs++
      if (depth < MAXD) {
        const k = id * 2, sp = 0.28 + rnd(k) * 0.36
        branch(x2, y2, len * (0.7 + rnd(k + 1) * 0.12), a - sp, depth + 1, k, tr)
        branch(x2, y2, len * (0.7 + rnd(k + 2) * 0.12), a + sp * (0.8 + rnd(k + 3) * 0.4), depth + 1, k + 1, tr)
      } else if (frac > 0.9) {
        leaves++
        const lit = ((t * 1.2 + rnd(id) * 5) % 5) < 0.5, c = rnd(id + 9) < 0.35 ? pal.orange : pal.aqua
        ctx.fillStyle = hex(c, lit ? 1 : 0.96); ctx.beginPath(); ctx.arc(x2, y2, (lit ? 5 : 3) + rnd(id + 5) * 2, 0, TAU); ctx.fill()
        if (lit) { ctx.strokeStyle = hex(c, 0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x2, y2, 11, 0, TAU); ctx.stroke() }
      }
    }
    for (const tr of trees) branch(tr.x, H + 8, H * 0.165 * tr.s, -Math.PI / 2, 0, 1, tr)
    ctx.globalAlpha = 1
    setHud([['Ramas', segs], ['Hojas', leaves], ['Profundidad', Math.min(MAXD + 1, Math.floor(grow)) + '/' + (MAXD + 1)]])
  }
  return { build, frame, click }
})()
