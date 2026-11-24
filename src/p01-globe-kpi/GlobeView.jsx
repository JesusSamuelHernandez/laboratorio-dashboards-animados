import { useEffect, useRef } from 'react'
import Globe from 'globe.gl'
import { feature } from 'topojson-client'
import landTopo from 'world-atlas/land-110m.json'
import { HUBS, ROUTES, REGIONS } from '../shared/mock/logistics'
import { useStore } from '../shared/store'
import { store, METRICS, selectRegion } from './state'

const HOME_POV = { lat: 20, lng: 0, altitude: 2.4 }
// Tierra firme (local, sin red): TopoJSON → GeoJSON features.
const LAND = feature(landTopo, landTopo.objects.land).features

// Calidad 0..1 del hub para la métrica activa (1 = bueno) → color rojo→verde.
function quality(hub, metric) {
  const vals = HUBS.map((h) => h[metric])
  const min = Math.min(...vals), max = Math.max(...vals)
  const t = (hub[metric] - min) / (max - min || 1)
  return METRICS[metric].higherIsBetter ? t : 1 - t
}
const qColor = (q) => `hsl(${Math.round(q * 130)}, 85%, 55%)`

export default function GlobeView() {
  const elRef = useRef(null)
  const gRef = useRef(null)
  const region = useStore(store, (s) => s.region)
  const metric = useStore(store, (s) => s.metric)

  // Montaje / desmontaje: una sola instancia, liberada por completo.
  useEffect(() => {
    const el = elRef.current
    const g = Globe()(el)
      .backgroundColor('rgba(0,0,0,0)')
      .atmosphereColor('#4aa3ff')
      .atmosphereAltitude(0.1)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.6)
      .hexPolygonColor(() => 'rgba(150,170,200,0.35)')
      .pointLat('lat').pointLng('lng')
      .pointsTransitionDuration(800)
      .arcStartLat((d) => d.from.lat).arcStartLng((d) => d.from.lng)
      .arcEndLat((d) => d.to.lat).arcEndLng((d) => d.to.lng)
      .arcDashLength(0.4).arcDashGap(0.8).arcDashAnimateTime(2600)
      .arcsTransitionDuration(600)
      .ringLat('lat').ringLng('lng')
      .ringMaxRadius(5).ringPropagationSpeed(2).ringRepeatPeriod(1100)
      .onPointClick((h) => selectRegion(h.region))
      .pointOfView(HOME_POV)
    // Esfera lisa y oscura; los continentes son una malla de puntos hexagonales.
    g.globeMaterial().color.set('#0a1220')
    g.globeMaterial().emissive.set('#050a14')
    g.hexPolygonsData(LAND)
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.5
    g.controls().enableDamping = true
    gRef.current = g

    const resize = () => g.width(el.clientWidth).height(el.clientHeight)
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    return () => {
      ro.disconnect()
      g.pauseAnimation()
      g.controls().dispose()
      g.renderer().dispose()
      g._destructor?.()
      el.replaceChildren()
      gRef.current = null
    }
  }, [])

  // Datos reactivos al estado: color por métrica, resaltado de región, anillos.
  useEffect(() => {
    const g = gRef.current
    if (!g) return
    const inRegion = (h) => !region || h.region === region
    g.pointsData(HUBS)
      .pointColor((h) => (inRegion(h) ? qColor(quality(h, metric)) : 'rgba(120,140,170,.35)'))
      .pointAltitude((h) => 0.02 + (h.shipments / 90000) * 0.25)
      .pointRadius((h) => (inRegion(h) ? 0.55 : 0.35))
      .pointLabel((h) => `<div class="tip"><b>${h.name}</b><br/>${METRICS[metric].label}: ${METRICS[metric].fmt(h[metric])}</div>`)
    g.arcsData(ROUTES)
      .arcColor((r) => {
        const on = !region || r.from.region === region || r.to.region === region
        return on ? ['rgba(74,163,255,.9)', 'rgba(47,208,138,.9)'] : ['rgba(74,163,255,.08)', 'rgba(74,163,255,.08)']
      })
      .arcStroke((r) => 0.15 + r.volume / 30)
    g.ringsData(region ? HUBS.filter((h) => h.region === region) : [])
      .ringColor(() => (t) => `rgba(74,163,255,${1 - t})`)
  }, [region, metric])

  // Cámara: transición suave hacia la región seleccionada.
  useEffect(() => {
    const g = gRef.current
    if (!g) return
    const pov = region ? REGIONS[region] : HOME_POV
    g.controls().autoRotate = !region
    g.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude }, 1400)
  }, [region])

  return <div ref={elRef} className="globe" />
}
