// Dataset simulado: red logística global (determinista, sin Math.random).
function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const rand = rng(42)

export const REGIONS = {
  NA: { name: 'Norteamérica', lat: 39, lng: -98, altitude: 1.7 },
  LATAM: { name: 'Latinoamérica', lat: -15, lng: -60, altitude: 1.8 },
  EU: { name: 'Europa', lat: 49, lng: 10, altitude: 1.5 },
  AF: { name: 'África', lat: 2, lng: 20, altitude: 1.9 },
  AS: { name: 'Asia', lat: 28, lng: 95, altitude: 2.0 },
  OC: { name: 'Oceanía', lat: -28, lng: 140, altitude: 1.9 },
}

const RAW_HUBS = [
  ['Los Ángeles', 'NA', 34.05, -118.24, 1.0],
  ['Nueva York', 'NA', 40.71, -74.0, 1.1],
  ['Chicago', 'NA', 41.88, -87.63, 0.8],
  ['Ciudad de México', 'NA', 19.43, -99.13, 0.7],
  ['São Paulo', 'LATAM', -23.55, -46.63, 0.9],
  ['Bogotá', 'LATAM', 4.71, -74.07, 0.5],
  ['Santiago', 'LATAM', -33.45, -70.67, 0.45],
  ['Lima', 'LATAM', -12.05, -77.04, 0.4],
  ['Róterdam', 'EU', 51.92, 4.48, 1.2],
  ['Fráncfort', 'EU', 50.11, 8.68, 1.0],
  ['Madrid', 'EU', 40.42, -3.7, 0.6],
  ['Lagos', 'AF', 6.52, 3.38, 0.5],
  ['Johannesburgo', 'AF', -26.2, 28.05, 0.5],
  ['El Cairo', 'AF', 30.04, 31.24, 0.45],
  ['Shanghái', 'AS', 31.23, 121.47, 1.6],
  ['Singapur', 'AS', 1.35, 103.82, 1.3],
  ['Bombay', 'AS', 19.08, 72.88, 0.9],
  ['Tokio', 'AS', 35.68, 139.69, 1.0],
  ['Dubái', 'AS', 25.2, 55.27, 0.8],
  ['Sídney', 'OC', -33.87, 151.21, 0.6],
  ['Auckland', 'OC', -36.85, 174.76, 0.3],
]

export const HUBS = RAW_HUBS.map(([name, region, lat, lng, size], i) => {
  const shipments = Math.round(size * (48000 + rand() * 22000)) // envíos / mes
  const onTime = Math.round((86 + rand() * 12 - (region === 'AF' || region === 'LATAM' ? 6 : 0)) * 10) / 10
  const delayHrs = Math.round((3 + rand() * 9 + (100 - onTime) * 0.6) * 10) / 10
  const revenue = Math.round(shipments * (38 + rand() * 24)) / 1e6 // M USD
  return { id: i, name, region, lat, lng, shipments, onTime, delayHrs, revenue }
})

const byName = Object.fromEntries(HUBS.map((h) => [h.name, h]))
const PAIRS = [
  ['Shanghái', 'Los Ángeles', 9], ['Shanghái', 'Róterdam', 9], ['Singapur', 'Róterdam', 7],
  ['Singapur', 'Sídney', 4], ['Tokio', 'Los Ángeles', 6], ['Bombay', 'Dubái', 5],
  ['Dubái', 'Róterdam', 5], ['Dubái', 'Johannesburgo', 3], ['Róterdam', 'Nueva York', 8],
  ['Fráncfort', 'Chicago', 5], ['Madrid', 'São Paulo', 4], ['Madrid', 'Lagos', 3],
  ['Nueva York', 'São Paulo', 5], ['Ciudad de México', 'Los Ángeles', 6], ['Ciudad de México', 'Bogotá', 3],
  ['Bogotá', 'Lima', 2], ['Lima', 'Santiago', 2], ['São Paulo', 'Santiago', 3],
  ['El Cairo', 'Fráncfort', 3], ['Lagos', 'Johannesburgo', 2], ['Sídney', 'Auckland', 2],
  ['Tokio', 'Singapur', 5], ['Shanghái', 'Bombay', 4], ['Chicago', 'Ciudad de México', 3],
  ['Los Ángeles', 'Sídney', 3], ['El Cairo', 'Dubái', 3],
]
export const ROUTES = PAIRS.map(([a, b, volume], i) => ({
  id: i, from: byName[a], to: byName[b], volume,
}))

// Agregación ponderada por envíos.
export function aggregate(hubs) {
  const shipments = hubs.reduce((s, h) => s + h.shipments, 0)
  const w = (k) => hubs.reduce((s, h) => s + h[k] * h.shipments, 0) / (shipments || 1)
  return {
    shipments,
    onTime: w('onTime'),
    delayHrs: w('delayHrs'),
    revenue: hubs.reduce((s, h) => s + h.revenue, 0),
  }
}

export const GLOBAL = aggregate(HUBS)
export const REGION_AGG = Object.fromEntries(
  Object.keys(REGIONS).map((r) => [r, aggregate(HUBS.filter((h) => h.region === r))]),
)
