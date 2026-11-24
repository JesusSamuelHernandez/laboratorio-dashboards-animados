import { createStore } from '../shared/store'
import { REGION_AGG, GLOBAL } from '../shared/mock/logistics'

export const METRICS = {
  shipments: { label: 'Envíos / mes', higherIsBetter: true, fmt: (v) => Math.round(v).toLocaleString('es-MX') },
  onTime: { label: 'Entrega a tiempo', higherIsBetter: true, fmt: (v) => v.toFixed(1) + '%' },
  delayHrs: { label: 'Retraso medio', higherIsBetter: false, fmt: (v) => v.toFixed(1) + ' h' },
  revenue: { label: 'Ingresos', higherIsBetter: true, fmt: (v) => '$' + v.toFixed(1) + ' M' },
}

export const store = createStore({ region: null, metric: 'onTime' })

export const selectRegion = (region) =>
  store.set((s) => ({ region: s.region === region ? null : region }))

// Clic en un KPI: activa la métrica y vuela a la región donde está "peor".
export function selectMetric(metric) {
  const m = METRICS[metric]
  const sign = m.higherIsBetter ? 1 : -1
  const worst = Object.entries(REGION_AGG).sort((a, b) => sign * (a[1][metric] - b[1][metric]))[0][0]
  store.set({ metric, region: worst })
}

export const currentAgg = (region) => (region ? REGION_AGG[region] : GLOBAL)
