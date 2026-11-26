import { lazy, Suspense, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchByCode, fetchByCodes } from '../api/countries'
import { useAsync } from '../hooks/useAsync'

const CountryMap = lazy(() => import('../components/CountryMap'))

const SIDE: Record<string, string> = { left: 'Gauche', right: 'Droite' }
const DAY: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
  friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <dl>{children}</dl>
    </section>
  )
}
const Row = ({ label, value }: { label: string; value?: ReactNode }) => (
  <>
    <dt>{label}</dt>
    <dd>{value ?? '—'}</dd>
  </>
)

export default function CountryDetail() {
  const { code = '' } = useParams()
  const { data: c, error, loading } = useAsync(() => fetchByCode(code), [code])
  const { data: borders } = useAsync(() => fetchByCodes(c?.borders ?? []), [c])

  const dialCode = c?.idd?.root
    ? c.idd.root + (c.idd.suffixes?.length === 1 ? c.idd.suffixes[0] : '')
    : undefined
  const gini = c?.gini ? Object.entries(c.gini).sort().pop() : undefined
  const native = c?.name.nativeName
    ? Object.values(c.name.nativeName).map((n) => n.common).join(', ')
    : undefined
  const density = c && c.area > 0 ? c.population / c.area : undefined

  return (
    <main>
      <Link to="/" className="back">← Retour</Link>
      {loading && <p className="status">Chargement…</p>}
      {error && <p className="status error">{error}</p>}
      {c && (
        <>
          <div className="detail">
            <div>
              <img src={c.flags.svg} alt={c.flags.alt ?? `Drapeau ${c.name.common}`} />
              {c.coatOfArms?.svg && (
                <img className="coat" src={c.coatOfArms.svg} alt={`Armoiries ${c.name.common}`} />
              )}
            </div>
            <div>
              <h1>{c.name.common}</h1>
              <p className="official">{c.name.official}</p>
              <div className="badges">
                {c.independent && <span className="chip">Indépendant</span>}
                {c.unMember && <span className="chip">Membre de l'ONU</span>}
                {c.landlocked && <span className="chip">Sans accès à la mer</span>}
              </div>
              {c.note && <p className="note">{c.note}</p>}
              <Section title="Général">
                <Row label="Nom natif" value={native} />
                <Row label="Capitale" value={c.capital?.join(', ')} />
                <Row label="Gentilé" value={c.demonyms?.eng?.m} />
                <Row label="Continent" value={c.continents?.join(', ')} />
                <Row label="Région" value={c.region + (c.subregion ? ` — ${c.subregion}` : '')} />
                <Row label="Code ISO" value={c.cca2 ? `${c.cca2} / ${c.cca3}` : c.cca3} />
              </Section>
              <Section title="Chiffres">
                <Row label="Population" value={c.population.toLocaleString('fr-FR')} />
                <Row label="Superficie" value={`${c.area.toLocaleString('fr-FR')} km²`} />
                <Row
                  label="Densité"
                  value={density !== undefined ? `${density.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} hab./km²` : undefined}
                />
                <Row label="Indice de Gini" value={gini ? `${gini[1]} (${gini[0]})` : undefined} />
              </Section>
              <Section title="Pratique">
                <Row label="Langues" value={c.languages ? Object.values(c.languages).join(', ') : undefined} />
                <Row
                  label="Devises"
                  value={c.currencies
                    ? Object.values(c.currencies).map((x) => `${x.name}${x.symbol ? ` (${x.symbol})` : ''}`).join(', ')
                    : undefined}
                />
                <Row label="Indicatif" value={dialCode} />
                <Row label="Domaine" value={c.tld?.join(', ')} />
                <Row label="Fuseaux horaires" value={c.timezones?.join(', ')} />
                <Row label="Conduite" value={c.car?.side ? SIDE[c.car.side] ?? c.car.side : undefined} />
                <Row label="Début de semaine" value={c.startOfWeek ? DAY[c.startOfWeek] ?? c.startOfWeek : undefined} />
              </Section>
              {c.maps?.googleMaps && (
                <p className="links">
                  <a href={c.maps.googleMaps} target="_blank" rel="noreferrer">Google Maps ↗</a>
                  {c.maps.openStreetMaps && (
                    <a href={c.maps.openStreetMaps} target="_blank" rel="noreferrer">OpenStreetMap ↗</a>
                  )}
                </p>
              )}
              <div className="borders">
                <b>Pays frontaliers :</b>{' '}
                {borders?.length
                  ? borders.map((b) => <Link key={b.cca3} to={`/country/${b.cca3}`} className="chip">{b.name.common}</Link>)
                  : 'Aucun'}
              </div>
            </div>
          </div>
          <Suspense fallback={<p className="status">Chargement de la carte…</p>}>
            <CountryMap key={c.cca3} code={c.cca3} ccn3={c.ccn3} name={c.name.common} />
          </Suspense>
        </>
      )}
    </main>
  )
}
