import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Multi-page: un HTML por prototipo. Añade nuevas entradas aquí.
export default defineConfig({
  base: './',          // rutas relativas: funciona bajo cualquier subruta (GitHub Pages)
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        p01: resolve(__dirname, 'p01-globe-kpi/index.html'),
        p02: resolve(__dirname, 'p02-gsap-lab/index.html'),
        p03: resolve(__dirname, 'p03-gsap-catalog/index.html'),
        p04: resolve(__dirname, 'p04-premium/index.html'),
        p05: resolve(__dirname, 'p05-portada/index.html'),
        p06: resolve(__dirname, 'p06-nodos/index.html'),
        portadas_index: resolve(__dirname, 'portadas/index.html'),
        portadas_01_anillos: resolve(__dirname, 'portadas/01-anillos.html'),
        portadas_02_red: resolve(__dirname, 'portadas/02-red.html'),
        portadas_03_ondas: resolve(__dirname, 'portadas/03-ondas.html'),
        portadas_04_barras: resolve(__dirname, 'portadas/04-barras.html'),
        portadas_05_globo: resolve(__dirname, 'portadas/05-globo.html'),
        portadas_06_flujo: resolve(__dirname, 'portadas/06-flujo.html'),
        portadas_07_lluvia: resolve(__dirname, 'portadas/07-lluvia.html'),
        portadas_08_sismografo: resolve(__dirname, 'portadas/08-sismografo.html'),
        portadas_09_interferencia: resolve(__dirname, 'portadas/09-interferencia.html'),
        portadas_10_burbujas: resolve(__dirname, 'portadas/10-burbujas.html'),
        portadas_11_treemap: resolve(__dirname, 'portadas/11-treemap.html'),
        portadas_12_sankey: resolve(__dirname, 'portadas/12-sankey.html'),
        portadas_13_calor: resolve(__dirname, 'portadas/13-calor.html'),
        portadas_14_radar: resolve(__dirname, 'portadas/14-radar.html'),
        portadas_15_clusteres: resolve(__dirname, 'portadas/15-clusteres.html'),
        portadas_16_colisiones: resolve(__dirname, 'portadas/16-colisiones.html'),
        portadas_17_pipeline: resolve(__dirname, 'portadas/17-pipeline.html'),
        portadas_18_circuitos: resolve(__dirname, 'portadas/18-circuitos.html'),
        portadas_19_julia: resolve(__dirname, 'portadas/19-julia.html'),
        portadas_20_arbol: resolve(__dirname, 'portadas/20-arbol.html'),
        portadas_21_hierba: resolve(__dirname, 'portadas/21-hierba.html'),
      },
    },
  },
})
