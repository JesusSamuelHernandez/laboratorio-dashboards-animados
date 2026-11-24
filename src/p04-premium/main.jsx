import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../p03-gsap-catalog/p03.css'
import './p04.css'
import App from '../p03-gsap-catalog/App'
import { DEMOS } from './demos'

const FILTERS = [
  ['all', 'Todas'], ['boton', 'Botones'], ['control', 'Controles'], ['kpi', 'KPI / Tarjetas'],
  ['grafico', 'Gráficos'], ['mapa', 'Mapas'], ['reporte', 'Reporte'], ['picked', 'Seleccionadas'],
]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App
      demos={DEMOS}
      filters={FILTERS}
      storageKey="p04-picks"
      title="Detalles premium"
      accent="para reportes y tableros"
      intro="microinteracciones discretas y variantes de tus favoritas. Marca con ★ las que quieras y copia la lista."
    />
  </StrictMode>,
)
