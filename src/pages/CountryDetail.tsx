import { Link, useParams } from 'react-router-dom'
import { fetchByCode, fetchByCodes } from '../api/countries'
import { useAsync } from '../hooks/useAsync'

export default function CountryDetail() {
  const { code = '' } = useParams()
  const { data: c, error, loading } = useAsync(() => fetchByCode(code), [code])
  const { data: borders } = useAsync(() => fetchByCodes(c?.borders ?? []), [c])

  return (
    <main>
      <Link to="/" className="back">← Retour</Link>
      {loading && <p className="status">Chargement…</p>}
      {error && <p className="status error">{error}</p>}
      {c && (
        <div className="detail">
          <img src={c.flags.svg} alt={c.flags.alt ?? `Drapeau ${c.name.common}`} />
          <div>
            <h1>{c.name.common}</h1>
            <p className="official">{c.name.official}</p>
            <dl>
              <dt>Capitale</dt><dd>{c.capital?.join(', ') ?? '—'}</dd>
              <dt>Région</dt><dd>{c.region}{c.subregion ? ` — ${c.subregion}` : ''}</dd>
              <dt>Population</dt><dd>{c.population.toLocaleString('fr-FR')}</dd>
              <dt>Superficie</dt><dd>{c.area.toLocaleString('fr-FR')} km²</dd>
              <dt>Langues</dt><dd>{c.languages ? Object.values(c.languages).join(', ') : '—'}</dd>
              <dt>Devises</dt>
              <dd>
                {c.currencies
                  ? Object.values(c.currencies).map((x) => `${x.name}${x.symbol ? ` (${x.symbol})` : ''}`).join(', ')
                  : '—'}
              </dd>
              <dt>Domaine</dt><dd>{c.tld?.join(', ') ?? '—'}</dd>
            </dl>
            <div className="borders">
              <b>Pays frontaliers :</b>{' '}
              {borders?.length
                ? borders.map((b) => <Link key={b.cca3} to={`/country/${b.cca3}`} className="chip">{b.name.common}</Link>)
                : 'Aucun'}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
