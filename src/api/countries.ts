export interface Country {
  cca3: string
  name: { common: string; official: string; nativeName?: Record<string, { common: string }> }
  flags: { svg: string; png: string; alt?: string }
  capital?: string[]
  region: string
  subregion?: string
  population: number
  area: number
  languages?: Record<string, string>
  currencies?: Record<string, { name: string; symbol?: string }>
  borders?: string[]
  tld?: string[]
  cca2?: string
  continents?: string[]
  independent?: boolean
  unMember?: boolean
  landlocked?: boolean
  idd?: { root?: string; suffixes?: string[] }
  timezones?: string[]
  car?: { side?: string }
  startOfWeek?: string
  gini?: Record<string, number>
  demonyms?: { eng?: { m: string; f: string } }
  latlng?: [number, number]
  coatOfArms?: { svg?: string; png?: string }
  maps?: { googleMaps?: string; openStreetMaps?: string }
}

const BASE = 'https://restcountries.com/v3.1'
const LIST_FIELDS = 'cca3,name,flags,capital,region,population'
const DETAIL_FIELDS =
  'cca3,cca2,name,flags,capital,region,subregion,population,area,languages,currencies,borders,tld,continents,independent,unMember,landlocked,idd,timezones,car,startOfWeek,gini,demonyms,latlng,coatOfArms,maps'

// Clé optionnelle, lue au build depuis .env.local (VITE_RESTCOUNTRIES_KEY).
// Attention : elle est incluse dans le bundle et donc visible dans le navigateur.
const API_KEY = import.meta.env.VITE_RESTCOUNTRIES_KEY as string | undefined

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : undefined,
  })
  if (!res.ok) throw new Error(`Erreur API (${res.status})`)
  return res.json() as Promise<T>
}

export const fetchAll = () => get<Country[]>(`/all?fields=${LIST_FIELDS}`)

export const fetchByCode = async (code: string) =>
  get<Country>(`/alpha/${code}?fields=${DETAIL_FIELDS}`)

export const fetchByCodes = (codes: string[]) =>
  codes.length
    ? get<Country[]>(`/alpha?codes=${codes.join(',')}&fields=cca3,name`)
    : Promise.resolve([])
