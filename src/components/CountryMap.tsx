import { useEffect, useMemo, useState } from 'react'
import { geoArea, geoCentroid, geoDistance, geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson'
import worldData from 'world-atlas/countries-110m.json'

type Props = { code: string; ccn3?: string; name: string }
type Shape = Feature<Geometry, { shapeName?: string }>

const W = 800
const H = 480
const PAD = 14

// Cache mémoire : un pays n'est téléchargé qu'une fois par session.
const cache = new Map<string, Promise<FeatureCollection<Geometry, { shapeName?: string }>>>()

// Limites administratives (niveau 1) simplifiées, servies par geoBoundaries (CORS ouvert).
function loadSubdivisions(code: string) {
  let p = cache.get(code)
  if (!p) {
    p = (async () => {
      const meta = await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${code}/ADM1/`)
      if (!meta.ok) throw new Error('Découpage indisponible')
      const raw = await meta.json()
      const info = Array.isArray(raw) ? raw[0] : raw
      const url: string | undefined = info?.simplifiedGeometryGeoJSON ?? info?.gjDownloadURL
      if (!url) throw new Error('Découpage indisponible')
      const geo = await fetch(url)
      if (!geo.ok) throw new Error('Découpage indisponible')
      return geo.json()
    })()
    p.catch(() => cache.delete(code))
    cache.set(code, p)
  }
  return p
}

// d3-geo attend l'orientation sphérique (anneaux extérieurs horaires), l'inverse du GeoJSON
// standard : sans correction, un polygone est lu comme « toute la sphère sauf le pays ».
// Un polygone dont l'aire dépasse un hémisphère est donc inversé.
function rewind(shapes: Shape[]): Shape[] {
  const fix = (rings: number[][][]): number[][][] =>
    geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI
      ? rings.map((r) => [...r].reverse())
      : rings
  return shapes.map((s) => {
    const g = s.geometry
    if (g.type === 'Polygon') return { ...s, geometry: { ...g, coordinates: fix(g.coordinates) } }
    if (g.type === 'MultiPolygon') return { ...s, geometry: { ...g, coordinates: g.coordinates.map(fix) } }
    return s
  })
}

// Contour du pays (sans découpage) depuis world-atlas, repli si l'ADM1 manque.
function outlineFor(ccn3?: string): Shape[] {
  if (!ccn3) return []
  const topo = worldData as unknown as Topology
  const all = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>
  const f = all.features.find((x) => String(x.id).padStart(3, '0') === ccn3)
  return f ? [{ ...f, properties: { shapeName: f.properties.name } }] : []
}

// Cadre la carte sur la terre principale : on écarte les territoires lointains
// (ex. Guyane pour la France) qui rendraient la métropole minuscule.
function mainLand(shapes: Shape[]): FeatureCollection<Polygon | MultiPolygon> {
  const polys: Feature<Polygon>[] = []
  const owner: number[] = []
  for (const [si, s] of shapes.entries()) {
    const before = polys.length
    const g = s.geometry
    if (g.type === 'Polygon') polys.push({ type: 'Feature', properties: {}, geometry: g })
    else if (g.type === 'MultiPolygon')
      for (const coordinates of g.coordinates)
        polys.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } })
    for (let k = before; k < polys.length; k++) owner.push(si)
  }
  if (!polys.length) return { type: 'FeatureCollection', features: [] }
  const areas = polys.map((p) => geoArea(p))
  const total = areas.reduce((a, b) => a + b, 0)
  const centroids = polys.map((p) => geoCentroid(p))
  // Barycentre sphérique pondéré par la surface : reste sur la masse principale
  // même quand la plus grande subdivision est excentrée (ex. l'Alaska).
  let x = 0, y = 0, z = 0
  centroids.forEach(([lon, lat], i) => {
    const [la, lo] = [(lat * Math.PI) / 180, (lon * Math.PI) / 180]
    x += areas[i] * Math.cos(la) * Math.cos(lo)
    y += areas[i] * Math.cos(la) * Math.sin(lo)
    z += areas[i] * Math.sin(la)
  })
  const center: [number, number] = [
    (Math.atan2(y, x) * 180) / Math.PI,
    (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
  ]
  const near = 25 * (Math.PI / 180)
  const pieceOk = polys.map((_, i) => areas[i] >= total * 0.25 || geoDistance(centroids[i], center) < near)
  // Une subdivision est écartée en bloc si sa plus grande partie l'est
  // (ex. l'Alaska et ses îles), pour ne pas laisser d'îlots orphelins dans le cadre.
  const biggest = new Map<number, number>()
  polys.forEach((_, i) => {
    const b = biggest.get(owner[i])
    if (b === undefined || areas[i] > areas[b]) biggest.set(owner[i], i)
  })
  const kept = polys.filter((_, i) => pieceOk[i] && pieceOk[biggest.get(owner[i])!])
  return { type: 'FeatureCollection', features: kept }
}

export default function CountryMap({ code, ccn3, name }: Props) {
  const [shapes, setShapes] = useState<Shape[] | null>(null)
  const [detailed, setDetailed] = useState(true)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setShapes(null)
    setHover(null)
    loadSubdivisions(code)
      .then((fc) => {
        if (cancelled) return
        setDetailed(true)
        setShapes(rewind(fc.features))
      })
      .catch(() => {
        if (cancelled) return
        setDetailed(false)
        setShapes(outlineFor(ccn3))
      })
    return () => {
      cancelled = true
    }
  }, [code, ccn3])

  const { paths, trimmed } = useMemo(() => {
    if (!shapes?.length) return { paths: [], trimmed: false }
    const main = mainLand(shapes)
    const projection = geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], main)
    const path = geoPath(projection).digits(1)
    const keep = new Set(main.features.map((f) => f.geometry.coordinates))
    let trimmed = false
    const out: { d: string; name: string; tone: number }[] = []
    shapes.forEach((s, i) => {
      const g = s.geometry
      let geometry: Geometry | null = g
      if (g.type === 'Polygon') geometry = keep.has(g.coordinates) ? g : null
      else if (g.type === 'MultiPolygon') {
        const parts = g.coordinates.filter((c) => keep.has(c))
        geometry = parts.length ? { type: 'MultiPolygon', coordinates: parts } : null
        if (parts.length < g.coordinates.length) trimmed = true
      }
      if (!geometry) return
      out.push({ d: path({ ...s, geometry }) ?? '', name: s.properties?.shapeName ?? '', tone: i % 4 })
    })
    return { paths: out, trimmed: trimmed || out.length < shapes.length }
  }, [shapes])

  if (shapes === null) return <p className="status">Chargement de la carte…</p>
  if (!paths.length) return null

  const names = (shapes ?? []).map((s) => s.properties?.shapeName ?? '').filter(Boolean).sort((a, b) => a.localeCompare(b))

  return (
    <section className="section country-map">
      <h2>Carte{detailed ? ' et découpage administratif' : ''}</h2>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Carte de ${name}`}>
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            className={`subdiv${hover === p.name && p.name ? ' is-hover' : ''}`}
            data-tone={p.tone}
            onMouseEnter={() => setHover(p.name)}
            onMouseLeave={() => setHover(null)}
          >
            {p.name && <title>{p.name}</title>}
          </path>
        ))}
      </svg>
      <p className="map-caption" aria-live="polite">
        {hover ?? (detailed ? `${names.length} subdivisions — survolez la carte` : 'Contour du pays')}
      </p>
      {detailed && names.length > 0 && (
        <details>
          <summary>Liste des subdivisions ({names.length})</summary>
          <ul className="subdiv-list">
            {names.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      )}
      {trimmed && <p className="map-credit">Les territoires très éloignés (outre-mer, îles lointaines) ne sont pas affichés.</p>}
      {detailed && <p className="map-credit">Limites : geoBoundaries (CC BY 4.0), niveau administratif 1.</p>}
    </section>
  )
}
