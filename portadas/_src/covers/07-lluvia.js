/* LLUVIA: gotas que caen sobre agua en perspectiva y forman anillos concéntricos que se cruzan.
   Las gotas naranja son "datos": al caer dejan una etiqueta con su valor. El cursor roza el agua; el clic lanza una gran gota. */
const COVER = (() => {
  const HOR = 0.42      // horizonte (fracción de la altura)
  const SQ = 0.32       // aplastamiento de los anillos por la perspectiva
  let drops = [], rings = [], parts = [], labels = [], clock = 0, lastT = 0, acc = 0, wind = 0, rate = 20, lastMx = -999, lastMy = -999

  const depthAt = (y) => clamp((y - H * HOR) / (H * (1 - HOR)))
  function spawnDrop() {
    const depth = Math.pow(Math.random(), 0.85)
    const ty = H * (HOR + 0.02) + (H * (1 - HOR) - H * 0.02) * depth
    drops.push({ x: Math.random() * (W + 240) - 120 - wind * 90, y: -40 - Math.random() * 120, ty, v: 520 + depth * 520, len: 12 + depth * 26, depth, data: Math.random() < 0.1 })
  }
  function addRing(x, y, depth, col, opt = {}) {
    rings.push({ x, y, t0: clock, col, depth, max: opt.max ?? 34 + depth * 105, n: opt.n ?? 3, life: opt.life ?? 2.3, w: opt.w ?? 1 })
  }

  function step(dt) {
    clock += dt
    const base = clamp((W * H) / 26000, 16, 60)
    rate = base * (0.75 + 0.45 * (0.5 + 0.5 * Math.sin(clock * 0.22)))     // la tormenta sube y baja
    acc += rate * dt; while (acc >= 1) { acc -= 1; spawnDrop() }
    for (const d of drops) {
      d.y += d.v * dt; d.x += wind * 110 * dt
      if (d.y >= d.ty) {
        d.dead = true
        addRing(d.x, d.ty, d.depth, d.data ? 'orange' : 'aqua')
        for (let i = 0; i < 4; i++) parts.push({ x: d.x, y: d.ty, vx: (Math.random() - 0.5) * 70 * (0.4 + d.depth), vy: -(45 + Math.random() * 70) * (0.4 + d.depth), t0: clock, col: d.data ? 'orange' : 'aqua' })
        if (d.data) labels.push({ x: d.x, y: d.ty, t0: clock, txt: '+' + (1 + Math.floor(Math.random() * 40)) })
      }
    }
    drops = drops.filter((d) => !d.dead)
    rings = rings.filter((r) => clock - r.t0 < r.life + r.n * 0.18)
    if (rings.length > 260) rings.splice(0, rings.length - 260)
    parts = parts.filter((p) => clock - p.t0 < 0.6)
    labels = labels.filter((l) => clock - l.t0 < 1.6)
  }

  function build() {
    drops = []; rings = []; parts = []; labels = []; clock = 0; acc = 0
    for (let i = 0; i < 160; i++) step(0.04)       // arranca ya lloviendo, no con el cielo vacío
  }
  function click(x, y) { addRing(x, y, depthAt(y), 'orange', { max: 230, n: 5, life: 3.2, w: 1.6 }) }

  function frame(t) {
    const dt = clamp(t - lastT, 0, 0.05); lastT = t
    smoothMouse(0.2)
    wind = lerp(wind, mouse.on ? (mouse.x / W - 0.5) * 1.4 : 0, 0.03)
    if (mouse.on && Math.hypot(mouse.sx - lastMx, mouse.sy - lastMy) > 46) {   // el cursor roza el agua
      addRing(mouse.sx, mouse.sy, depthAt(mouse.sy), 'aqua', { max: 55, n: 2, life: 1.6 }); lastMx = mouse.sx; lastMy = mouse.sy
    }
    step(dt)

    ctx.globalAlpha = easeOut(t / 2)
    // agua en perspectiva: tinte y líneas que se separan hacia el frente
    const g = ctx.createLinearGradient(0, H * HOR, 0, H); g.addColorStop(0, hex(pal.aqua, 0)); g.addColorStop(1, hex(pal.aqua, pal.dark ? 0.16 : 0.1))
    ctx.fillStyle = g; ctx.fillRect(0, H * HOR, W, H * (1 - HOR))
    ctx.strokeStyle = neutral(0.1); ctx.lineWidth = 1; ctx.beginPath()
    for (let i = 0; i <= 6; i++) { const y = H * HOR + H * (1 - HOR) * Math.pow(i / 6, 1.7); ctx.moveTo(0, y); ctx.lineTo(W, y) }
    ctx.stroke()

    // gotas
    ctx.lineCap = 'round'
    for (const d of drops) {
      const slope = (wind * 110) / d.v
      ctx.strokeStyle = hex(d.data ? pal.orange : pal.aqua, 0.3 + 0.55 * d.depth); ctx.lineWidth = 1 + d.depth * 0.9
      ctx.beginPath(); ctx.moveTo(d.x - slope * d.len, d.y - d.len); ctx.lineTo(d.x, d.y); ctx.stroke()
    }
    // anillos concéntricos (elipses): cada gota deja 3; los de gotas vecinas se cruzan
    let visible = 0
    for (const r of rings) {
      const age = clock - r.t0
      for (let i = 0; i < r.n; i++) {
        const k = (age - i * 0.18) / r.life; if (k <= 0 || k >= 1) continue
        visible++
        const rad = r.max * (1 - (1 - k) * (1 - k))
        ctx.strokeStyle = hex(pal[r.col], Math.pow(1 - k, 1.6) * (0.6 - i * 0.08)); ctx.lineWidth = r.w * (0.7 + r.depth * 0.8)
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * SQ, 0, 0, TAU); ctx.stroke()
      }
    }
    // salpicaduras y etiquetas de datos
    for (const p of parts) {
      const a = clock - p.t0; ctx.fillStyle = hex(pal[p.col], 1 - a / 0.6)
      ctx.beginPath(); ctx.arc(p.x + p.vx * a, p.y + p.vy * a + 420 * a * a, 1.3, 0, TAU); ctx.fill()
    }
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textAlign = 'center'
    for (const l of labels) { const a = clock - l.t0; ctx.fillStyle = hex(pal.orange, clamp(1 - a / 1.6)); ctx.fillText(l.txt, l.x, l.y - 12 - a * 22) }
    if (mouse.on) { ctx.strokeStyle = neutral(0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(mouse.sx, mouse.sy, 14, 14 * SQ + 2, 0, 0, TAU); ctx.stroke() }
    ctx.globalAlpha = 1
    setHud([['Gotas', drops.length], ['Anillos', visible], ['Intensidad', Math.round(rate * 3.4) + ' mm/h']])
  }
  return { build, frame, click }
})()
