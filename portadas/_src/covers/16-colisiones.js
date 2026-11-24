/* COLISIONES QUE EXPLOTAN: meteoritos que cruzan el cielo en rumbo de colisión y estallan como fuegos artificiales.
   Cada estallido lanza chispas con estela, una onda de choque y un destello. El clic lanza dos pares contra el cursor. */
const COVER = (() => {
  let ms = [], sp = [], rings = [], flashes = [], clock = 0, lastT = 0, nextPair = 0.5, nextShoot = 1, booms = 0
  const colOf = (c, a) => (c === 0 ? hex(pal.aqua, a) : c === 1 ? hex(pal.orange, a) : neutral(a * 0.85))
  const R = Math.random

  function meteor(x, y, vx, vy, c, deco = false) { ms.push({ x, y, vx, vy, c, deco, r: deco ? 2.4 : 4.5 + R() * 3, px: x, py: y }) }
  // dos meteoritos con la misma hora de llegada a (px,py): colisión garantizada
  function pair(px, py, T = 2.6) {
    const a = R() * TAU, d = 1.7 + R() * 2.6, T0 = T * (0.9 + R() * 0.4), c = Math.floor(R() * 3)
    for (const [ang, cc] of [[a, c], [a + d, (c + 1) % 3]]) {
      // nace justo fuera del borde de pantalla, en la dirección ang respecto al punto de choque
      const dx = Math.cos(ang), dy = Math.sin(ang)
      const e = Math.min(dx > 0 ? (W - px) / dx : dx < 0 ? -px / dx : 1e9, dy > 0 ? (H - py) / dy : dy < 0 ? -py / dy : 1e9) + 70
      const sx = px + dx * e, sy = py + dy * e
      meteor(sx, sy, (px - sx) / T0, (py - sy) / T0, cc)
    }
  }
  function explode(x, y, c1, c2) {
    booms++
    const cols = [c1, c2, 1]
    for (let i = 0; i < 52; i++) {                                        // peonía: abanico de chispas de velocidades distintas
      const a = (i / 52) * TAU + R() * 0.2, s = 70 + R() * 260
      sp.push({ x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.3 + R() * 1.3, t0: clock, c: cols[i % 3], size: 1.4 + R() * 1.6, tw: R() < 0.35 })
    }
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, s = 330; sp.push({ x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.0, t0: clock, c: c1, size: 2.4, tw: false }) }   // anillo perfecto
    rings.push({ x, y, t0: clock, c: c1 }); flashes.push({ x, y, t0: clock })
  }

  function step(dt) {
    clock += dt
    if (clock > nextPair) { pair(W * (0.1 + 0.8 * R()), H * (0.1 + 0.62 * R())); nextPair = clock + 0.55 + R() * 1.0 }
    if (clock > nextShoot) {                                             // meteoros decorativos que solo cruzan
      const l2r = R() < 0.5, y = R() * H * 0.55, v = 380 + R() * 220
      meteor(l2r ? -30 : W + 30, y, l2r ? v : -v, 90 + R() * 220, Math.floor(R() * 3), true); nextShoot = clock + 1.4 + R() * 2.4
    }
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n
    for (let k = 0; k < n; k++) {
      for (const m of ms) { if (k === 0) { m.px = m.x; m.py = m.y } m.x += m.vx * h; m.y += m.vy * h }
      for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i], b = ms[j]; if (a.dead || b.dead || a.deco || b.deco) continue
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 3) { a.dead = b.dead = true; explode((a.x + b.x) / 2, (a.y + b.y) / 2, a.c, b.c) }
      }
    }
    ms = ms.filter((m) => !m.dead && m.x > -260 && m.x < W + 260 && m.y > -260 && m.y < H + 260)
    const drag = Math.pow(0.32, dt)
    for (const s of sp) { s.px = s.x; s.py = s.y; s.vx *= drag; s.vy = s.vy * drag + 130 * dt; s.x += s.vx * dt; s.y += s.vy * dt }
    sp = sp.filter((s) => clock - s.t0 < s.life)
    rings = rings.filter((r) => clock - r.t0 < 1.3); flashes = flashes.filter((f) => clock - f.t0 < 0.4)
    if (sp.length > 900) sp.splice(0, sp.length - 900)
  }

  function build() { ms = []; sp = []; rings = []; flashes = []; clock = 0; nextPair = 0.4; booms = 0; for (let i = 0; i < 230; i++) step(0.03) }
  function click(x, y) { pair(x, y, 1.5); pair(x, y, 1.7) }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    step(dt)
    ctx.globalAlpha = easeOut(t / 2)
    // destellos y ondas de choque
    for (const f of flashes) { const k = (clock - f.t0) / 0.4, g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 40 + 140 * k); g.addColorStop(0, hex(pal.orange, 0.55 * (1 - k))); g.addColorStop(1, hex(pal.orange, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 40 + 140 * k, 0, TAU); ctx.fill() }
    for (const r of rings) { const k = (clock - r.t0) / 1.3, e = 1 - (1 - k) * (1 - k); ctx.strokeStyle = colOf(r.c, 0.7 * (1 - k)); ctx.lineWidth = 2.2 * (1 - k) + 0.6; ctx.beginPath(); ctx.arc(r.x, r.y, 12 + e * 190, 0, TAU); ctx.stroke() }
    // meteoritos con cola
    ctx.lineCap = 'round'
    for (const m of ms) {
      const sp2 = Math.hypot(m.vx, m.vy) || 1, L = m.deco ? 150 : 110, tx = m.x - (m.vx / sp2) * L, ty = m.y - (m.vy / sp2) * L
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty); g.addColorStop(0, colOf(m.c, m.deco ? 0.55 : 0.95)); g.addColorStop(1, colOf(m.c, 0))
      ctx.strokeStyle = g; ctx.lineWidth = m.r * (m.deco ? 0.7 : 1.1); ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke()
      ctx.fillStyle = colOf(m.c, m.deco ? 0.7 : 1); ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill()
      if (!m.deco) { ctx.strokeStyle = colOf(m.c, 0.3); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 5 + 1.5 * Math.sin(clock * 12), 0, TAU); ctx.stroke() }
    }
    // chispas con estela
    for (const s of sp) {
      const k = (clock - s.t0) / s.life, a = (1 - k) * (s.tw ? 0.5 + 0.5 * Math.sin(clock * 40 + s.x) : 1)
      ctx.strokeStyle = colOf(s.c, clamp(a) * 0.95); ctx.lineWidth = s.size * (1 - k * 0.5); ctx.beginPath(); ctx.moveTo(s.px - s.vx * 0.03, s.py - s.vy * 0.03); ctx.lineTo(s.x, s.y); ctx.stroke()
    }
    ctx.globalAlpha = 1
    setHud([['Meteoros', ms.length], ['Explosiones', booms], ['Chispas', sp.length]])
  }
  return { build, frame, click }
})()
