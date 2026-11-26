import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { Color, MeshPhongMaterial } from 'three'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import worldData from 'world-atlas/countries-110m.json'
import { fetchAll } from '../api/countries'
import { useAsync } from '../hooks/useAsync'

type CountryFeature = Feature<Geometry, { name: string }> & { id?: string }

const REGION_COLORS: Record<string, string> = {
  Africa: '#f59e0b',
  Americas: '#10b981',
  Asia: '#ef4444',
  Europe: '#3b82f6',
  Oceania: '#a855f7',
  Antarctic: '#94a3b8',
}
const REGION_FR: Record<string, string> = {
  Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie',
  Europe: 'Europe', Oceania: 'Océanie', Antarctic: 'Antarctique',
}

const oceanMaterial = new MeshPhongMaterial({ color: new Color('#12345c') })

const topology = worldData as unknown as Topology
const features = (feature(topology, topology.objects.countries) as unknown as FeatureCollection<
  Geometry,
  { name: string }
>).features as CountryFeature[]

export default function GlobePage() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [hover, setHover] = useState<CountryFeature | null>(null)
  const { data, error } = useAsync(fetchAll, [])

  // ccn3 (code numérique ISO) -> pays de l'API
  const byNumeric = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>[number]>()
    data?.forEach((c) => c.ccn3 && m.set(c.ccn3, c))
    return m
  }, [data])
  const lookup = (f: CountryFeature) => (f.id ? byNumeric.get(String(f.id).padStart(3, '0')) : undefined)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const onGlobeReady = () => {
    const g = globeRef.current
    if (!g) return
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.4
    g.pointOfView({ lat: 20, lng: 10, altitude: 2.2 })
  }

  const colorOf = (f: CountryFeature) => {
    const c = lookup(f)
    const base = c ? REGION_COLORS[c.region] ?? '#64748b' : '#64748b'
    return f === hover ? '#ffffff' : base
  }

  const hovered = hover ? lookup(hover) : undefined

  return (
    <div className="globe-page">
      <div className="globe-wrap" ref={wrapRef}>
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={oceanMaterial}
          showAtmosphere
          atmosphereColor="#6ea8ff"
          polygonsData={features}
          polygonCapColor={(f) => colorOf(f as CountryFeature)}
          polygonSideColor={() => 'rgba(0,0,0,0.15)'}
          polygonStrokeColor={() => '#0b1220'}
          polygonAltitude={(f) => (f === hover ? 0.05 : 0.01)}
          polygonsTransitionDuration={150}
          polygonLabel={(f) => {
            const ft = f as CountryFeature
            const c = lookup(ft)
            return `<div class="globe-tip"><b>${c?.name.common ?? ft.properties.name}</b>${
              c ? `<br/>${REGION_FR[c.region] ?? c.region} · ${c.population.toLocaleString('fr-FR')} hab.` : ''
            }</div>`
          }}
          onPolygonHover={(f) => {
            setHover((f as CountryFeature) ?? null)
            const g = globeRef.current
            if (g) g.controls().autoRotate = !f
          }}
          onPolygonClick={(f) => {
            const c = lookup(f as CountryFeature)
            if (c) navigate(`/country/${c.cca3}`)
          }}
          onGlobeReady={onGlobeReady}
        />
      </div>

      <aside className="globe-panel">
        <h1>Explorer le globe</h1>
        <p>Faites glisser pour tourner, molette pour zoomer, cliquez sur un pays pour ouvrir sa fiche.</p>
        <ul className="legend">
          {Object.entries(REGION_COLORS).filter(([r]) => r !== 'Antarctic').map(([r, col]) => (
            <li key={r}><span style={{ background: col }} />{REGION_FR[r]}</li>
          ))}
        </ul>
        {error && <p className="status error">Données indisponibles : {error}. Le globe reste visible mais les pays ne sont pas cliquables.</p>}
        <div className="globe-hover">
          {hover ? (hovered?.name.common ?? hover.properties.name) : 'Survolez un pays'}
        </div>
      </aside>
    </div>
  )
}
