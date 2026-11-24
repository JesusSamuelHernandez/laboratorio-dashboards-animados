import { HUBS, REGIONS } from '../shared/mock/logistics'
import { METRICS } from './state'

export default function RegionPanel({ region, metric, onSelect }) {
  const m = METRICS[metric]
  const hubs = HUBS.filter((h) => !region || h.region === region)
    .sort((a, b) => b.shipments - a.shipments)
    .slice(0, 6)

  return (
    <aside className="panel right">
      <h3>Regiones</h3>
      <div className="chips">
        {Object.entries(REGIONS).map(([k, r]) => (
          <button key={k} className={`chip${region === k ? ' active' : ''}`} onClick={() => onSelect(k)}>
            {r.name}
          </button>
        ))}
      </div>
      <h3 style={{ marginTop: 24 }}>Top sedes {region ? `· ${REGIONS[region].name}` : '· Global'}</h3>
      <ul className="hubs">
        {hubs.map((h) => (
          <li key={h.id}>
            <span>{h.name}</span>
            <b>{m.fmt(h[metric])}</b>
          </li>
        ))}
      </ul>
      <p className="hint">Clic en un punto del globo, una región o un KPI.</p>
    </aside>
  )
}
