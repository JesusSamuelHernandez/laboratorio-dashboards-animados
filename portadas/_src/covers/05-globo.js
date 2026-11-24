/* GLOBO DE PUNTOS: continentes hechos de puntos (datos embebidos), con arcos entre ciudades. Arrastra para girar. */
const COVER = (() => {
  const LAND = __LAND__            // [lat*10, lon*10, ...] generado por build.mjs desde world-atlas
  const D = Math.PI / 180
  const CITIES = [
    ['CDMX', 19.4, -99.1], ['Nueva York', 40.7, -74], ['São Paulo', -23.5, -46.6], ['Londres', 51.5, -0.1], ['Lagos', 6.5, 3.4],
    ['Dubái', 25.2, 55.3], ['Bombay', 19.1, 72.9], ['Singapur', 1.35, 103.8], ['Shanghái', 31.2, 121.5], ['Tokio', 35.7, 139.7], ['Sídney', -33.9, 151.2],
  ]
  const ARCS = [[0, 1], [1, 3], [3, 5], [5, 8], [8, 9], [7, 10], [2, 4], [4, 3], [6, 7], [9, 0], [3, 6], [1, 2]]
  let lon0 = -40, lastT = 0, vel = 8, R = 300, cx = 0, cy = 0
  const TILT = 0.26, cT = Math.cos(TILT), sT = Math.sin(TILT)

  const vec = (lat, lon) => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)]
  // rota el vector (mundo) a pantalla: giro en Y por lon0 y luego inclinación en X
  function proj(v, r = 1) {
    const c = Math.cos(lon0 * D), s = Math.sin(lon0 * D)
    const x1 = v[0] * c - v[2] * s, z1 = v[0] * s + v[2] * c, y1 = v[1]
    const y2 = y1 * cT - z1 * sT, z2 = y1 * sT + z1 * cT
    return [cx + R * r * x1, cy - R * r * y2, z2]
  }
  const slerp = (a, b, u) => {
    const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), s = Math.sin(d) || 1
    const k1 = Math.sin((1 - u) * d) / s, k2 = Math.sin(u * d) / s
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]
  }

  let pts = [], cityV = [], arcData = []
  function build() {
    R = Math.min(W, H) * 0.48; cx = W / 2; cy = H * 0.52
    pts = []; for (let i = 0; i < LAND.length; i += 2) pts.push(vec(LAND[i] / 10, LAND[i + 1] / 10))
    cityV = CITIES.map(([, la, lo]) => vec(la, lo))
    arcData = ARCS.map(([a, b], i) => ({ a: cityV[a], b: cityV[b], ia: a, ib: b, per: 4 + (i % 3), off: i * 0.9, h: 0.1 + 0.22 * (Math.acos(clamp(cityV[a][0] * cityV[b][0] + cityV[a][1] * cityV[b][1] + cityV[a][2] * cityV[b][2], -1, 1)) / Math.PI) }))
  }
  function drag(dx) { lon0 -= dx * 0.3; vel = clamp(-dx * 6, -140, 140) }   // el impulso del arrastre se amortigua solo

  function frame(t) {
    const dt = Math.min(0.05, t - lastT); lastT = t
    if (!mouse.down) vel = lerp(vel, 8, 0.02)       // grados/s: vuelve a la rotación automática tras soltar
    lon0 += (mouse.down ? 0 : vel) * dt
    const a = easeOut(t / 2); ctx.globalAlpha = a

    // esfera
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R)
    g.addColorStop(0, pal.dark ? 'rgba(40,70,100,.55)' : 'rgba(255,255,255,.9)'); g.addColorStop(1, pal.dark ? 'rgba(10,24,44,.7)' : 'rgba(18,199,199,.1)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill()
    ctx.strokeStyle = neutral(0.3); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke()
    ctx.strokeStyle = hex(pal.aqua, 0.25); ctx.beginPath(); ctx.arc(cx, cy, R * 1.07, 0, TAU); ctx.stroke()

    // paralelos y meridianos
    ctx.lineWidth = 1; ctx.strokeStyle = neutral(0.08)
    for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let on = false; for (let lo = -180; lo <= 180; lo += 6) { const p = proj(vec(la, lo)); if (p[2] > 0) { on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true } else on = false } ctx.stroke() }
    for (let lo = -180; lo < 180; lo += 30) { ctx.beginPath(); let on = false; for (let la = -90; la <= 90; la += 6) { const p = proj(vec(la, lo)); if (p[2] > 0) { on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true } else on = false } ctx.stroke() }

    // continentes
    for (let i = 0; i < pts.length; i++) {
      const p = proj(pts[i]); if (p[2] <= 0.02) continue
      const k = p[2]; const sz = 1.2 + 1.6 * k; ctx.fillStyle = pal.dark ? `rgba(120,225,235,${0.22 + 0.7 * k})` : neutral(0.25 + 0.65 * k); ctx.fillRect(p[0] - sz / 2, p[1] - sz / 2, sz, sz)
    }

    // arcos con cabeza luminosa
    for (const ar of arcData) {
      const ph = (((t + ar.off) / ar.per) % 1.35), head = clamp(ph), tail = clamp(ph - 0.45)
      if (head <= tail) continue
      ctx.lineWidth = 1.6; ctx.lineCap = 'round'
      const N = 26; let prev = null
      for (let s = 0; s <= N; s++) {
        const u = tail + ((head - tail) * s) / N, v = slerp(ar.a, ar.b, u), r = 1 + ar.h * Math.sin(Math.PI * u), p = proj(v, r)
        if (prev && p[2] > 0 && prev[2] > 0) {
          ctx.strokeStyle = hex(pal.orange, 0.15 + 0.85 * (s / N)); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke()
        }
        prev = p
      }
      if (prev && prev[2] > 0) { ctx.fillStyle = pal.orange; ctx.beginPath(); ctx.arc(prev[0], prev[1], 2.6, 0, TAU); ctx.fill() }
    }

    // ciudades
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textBaseline = 'middle'
    CITIES.forEach(([name], i) => {
      const p = proj(cityV[i]); if (p[2] <= 0.05) return
      const ph = ((t * 0.5 + i * 0.37) % 1)
      ctx.strokeStyle = hex(pal.aqua, 0.6 * (1 - ph) * p[2]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], 3 + ph * 14, 0, TAU); ctx.stroke()
      ctx.fillStyle = pal.aqua; ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, TAU); ctx.fill()
      if (p[2] > 0.45) { ctx.fillStyle = neutral(0.8 * p[2]); ctx.textAlign = 'left'; ctx.fillText(name, p[0] + 8, p[1]) }
    })
    ctx.globalAlpha = 1
    setHud([['Ciudades', CITIES.length], ['Rutas', ARCS.length], ['Lon', ((((lon0 % 360) + 540) % 360) - 180).toFixed(0) + '°']])
  }
  return { build, frame, drag }
})()
