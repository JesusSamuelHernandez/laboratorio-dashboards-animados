/* FRACTAL DE JULIA: z → z² + c, calculado por píxel en una rejilla de baja resolución y escalado. El parámetro c orbita solo;
   el cursor lo controla y el clic cambia de familia. Colores: aqua → naranja según la velocidad de escape. */
const COVER = (() => {
  const PRESETS = [[-0.8, 0.156], [0.285, 0.01], [-0.4, 0.6], [-0.70176, -0.3842], [0.355, 0.355]]
  const MAXIT = 44
  let fr = 0, off, octx, img, w = 0, h = 0, preset = 0, cRe = -0.8, cIm = 0.156, rgbA = [18, 199, 199], rgbO = [255, 122, 26]
  const rgb = (hx) => { const n = parseInt(hx.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }

  function build() {
    w = Math.min(Math.ceil(W / 3.3), 400); h = Math.max(1, Math.round((w * H) / W))
    off = document.createElement('canvas'); off.width = w; off.height = h; octx = off.getContext('2d'); img = octx.createImageData(w, h)
    rgbA = rgb(pal.aqua); rgbO = rgb(pal.orange)
  }
  function click() { preset = (preset + 1) % PRESETS.length }

  function frame(t) {
    smoothMouse(0.08)
    // parámetro c: órbita lenta alrededor del preset; el cursor lo desplaza
    const [bx, by] = PRESETS[preset], a = t * 0.18
    let tr = bx + 0.09 * Math.cos(a), ti = by + 0.09 * Math.sin(a * 1.3)
    if (mouse.on) { tr = bx + (mouse.sx / W - 0.5) * 0.5; ti = by + (mouse.sy / H - 0.5) * 0.5 }
    cRe = lerp(cRe, tr, 0.06); cIm = lerp(cIm, ti, 0.06)
    fr++
    const zoom = 1.12 + 0.1 * Math.sin(t * 0.2), asp = w / h, d = img.data
    const [ar, ag, ab] = rgbA, [or, og, ob] = rgbO
    if (fr % 2 === 0 || fr < 3) for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let x = (px / w - 0.5) * 2 * zoom * asp, y = (py / h - 0.5) * 2 * zoom, i = 0
      while (i < MAXIT && x * x + y * y < 16) { const xt = x * x - y * y + cRe; y = 2 * x * y + cIm; x = xt; i++ }
      const o = (py * w + px) * 4
      if (i >= MAXIT) { d[o] = ar; d[o + 1] = ag; d[o + 2] = ab; d[o + 3] = pal.dark ? 40 : 30; continue }
      const sm = i + 1 - Math.log2(Math.log2(x * x + y * y) / 2 + 1e-9), v = clamp(sm / MAXIT), m = 0.5 + 0.5 * Math.sin(sm * 0.42)
      d[o] = lerp(ar, or, m); d[o + 1] = lerp(ag, og, m); d[o + 2] = lerp(ab, ob, m); d[o + 3] = 255 * clamp(0.14 + 0.82 * Math.pow(v, 0.45))
    }
    if (fr % 2 === 0 || fr < 3) octx.putImageData(img, 0, 0)
    ctx.globalAlpha = easeOut(t / 2); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(off, 0, 0, W, H); ctx.globalAlpha = 1
    setHud([['c', `${cRe.toFixed(3)} ${cIm >= 0 ? '+' : '−'} ${Math.abs(cIm).toFixed(3)}i`], ['Iteraciones', MAXIT], ['Familia', preset + 1 + '/' + PRESETS.length]])
  }
  return { build, frame, click }
})()
