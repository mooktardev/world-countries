import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll } from '../api/countries'
import { useAsync } from '../hooks/useAsync'

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Antarctic']
const REGION_FR: Record<string, string> = {
  Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie',
  Europe: 'Europe', Oceania: 'Océanie', Antarctic: 'Antarctique',
}

export default function Home() {
  const { data, error, loading } = useAsync(fetchAll, [])
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')

  const countries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? [])
      .filter((c) => (!region || c.region === region) && c.name.common.toLowerCase().includes(q))
      .sort((a, b) => a.name.common.localeCompare(b.name.common))
  }, [data, query, region])

  return (
    <main>
      <div className="filters">
        <input
          type="search"
          placeholder="Rechercher un pays…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Toutes les régions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{REGION_FR[r]}</option>)}
        </select>
      </div>

      {loading && <p className="status">Chargement…</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && <p className="status">{countries.length} pays</p>}

      <div className="grid">
        {countries.map((c) => (
          <Link key={c.cca3} to={`/country/${c.cca3}`} className="card">
            <img src={c.flags.svg} alt={c.flags.alt ?? `Drapeau ${c.name.common}`} loading="lazy" />
            <div className="card-body">
              <h2>{c.name.common}</h2>
              <p><b>Population :</b> {c.population.toLocaleString('fr-FR')}</p>
              <p><b>Région :</b> {REGION_FR[c.region] ?? c.region}</p>
              <p><b>Capitale :</b> {c.capital?.[0] ?? '—'}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
