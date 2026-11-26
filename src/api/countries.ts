import { EXTRA_COUNTRIES } from './extraCountries'

export interface Country {
  cca3: string
  ccn3?: string
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
  note?: string
}

const BASE = 'https://api.restcountries.com/countries/v5'
const PAGE_SIZE = 100

const LIST_FIELDS = [
  'codes.alpha_3', 'codes.ccn3', 'names.common', 'names.official', 'flag.url_svg', 'flag.url_png',
  'capitals.name', 'region', 'population', 'coordinates',
].join(',')
const DETAIL_FIELDS = [
  'codes', 'names.common', 'names.official', 'names.native', 'flag.url_svg', 'flag.url_png', 'flag.description',
  'capitals.name', 'region', 'subregion', 'area', 'population', 'languages', 'currencies', 'borders',
  'tlds', 'continents', 'classification', 'landlocked', 'calling_codes', 'timezones', 'cars',
  'date.start_of_week', 'economy.gini_coefficient', 'demonyms', 'coordinates', 'links',
].join(',')

// Clé obligatoire en v5, lue au build depuis .env.local (VITE_RESTCOUNTRIES_KEY).
// Attention : elle est incluse dans le bundle et donc visible dans le navigateur.
// L'origine de la page (ex. localhost) doit être autorisée dans les « allowed origins » de la clé.
const API_KEY = import.meta.env.VITE_RESTCOUNTRIES_KEY as string | undefined

interface V5Country {
  names: { common: string; official: string; native?: Record<string, { common: string }> }
  codes: { alpha_2?: string; alpha_3: string; ccn3?: string }
  flag?: { url_svg: string; url_png: string; description?: string }
  capitals?: { name: string }[]
  region: string
  subregion?: string
  area?: { kilometers: number }
  population: number
  languages?: { iso639_3: string; name: string }[]
  currencies?: { code: string; name: string; symbol?: string }[]
  borders?: string[]
  tlds?: string[]
  continents?: string[]
  classification?: { sovereign?: boolean; un_member?: boolean }
  landlocked?: boolean
  calling_codes?: string[]
  timezones?: string[]
  cars?: { driving_side?: string }
  date?: { start_of_week?: string }
  economy?: { gini_coefficient?: Record<string, number> }
  demonyms?: { eng?: { m: string; f: string } }
  coordinates?: { lat: number; lng: number }
  links?: { google_maps?: string; open_street_maps?: string }
}

interface V5Response {
  data: { objects: V5Country[]; meta: { total: number } }
}

function toCountry(o: V5Country): Country {
  return {
    cca3: o.codes.alpha_3,
    cca2: o.codes.alpha_2,
    ccn3: o.codes.ccn3,
    name: { common: o.names.common, official: o.names.official, nativeName: o.names.native },
    flags: { svg: o.flag?.url_svg ?? '', png: o.flag?.url_png ?? '', alt: o.flag?.description },
    capital: o.capitals?.map((c) => c.name),
    region: o.region,
    subregion: o.subregion,
    population: o.population,
    area: o.area?.kilometers ?? 0,
    languages: o.languages && Object.fromEntries(o.languages.map((l) => [l.iso639_3, l.name])),
    currencies:
      o.currencies && Object.fromEntries(o.currencies.map((c) => [c.code, { name: c.name, symbol: c.symbol }])),
    borders: o.borders,
    tld: o.tlds,
    continents: o.continents,
    independent: o.classification?.sovereign,
    unMember: o.classification?.un_member,
    landlocked: o.landlocked,
    idd: o.calling_codes?.length ? { root: `+${o.calling_codes[0]}`, suffixes: [] } : undefined,
    timezones: o.timezones,
    car: o.cars?.driving_side ? { side: o.cars.driving_side } : undefined,
    startOfWeek: o.date?.start_of_week,
    gini: o.economy?.gini_coefficient,
    demonyms: o.demonyms,
    latlng: o.coordinates ? [o.coordinates.lat, o.coordinates.lng] : undefined,
    maps: o.links && { googleMaps: o.links.google_maps, openStreetMaps: o.links.open_street_maps },
  }
}

async function get(path: string): Promise<V5Response['data']> {
  const res = await fetch(`${BASE}${path}`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : undefined,
  })
  if (!res.ok) {
    let msg = `Erreur API (${res.status})`
    try {
      msg = (await res.json()).errors?.[0]?.message ?? msg
    } catch { /* corps non JSON */ }
    throw new Error(msg)
  }
  return (await res.json()).data
}

const page = (offset: number) =>
  get(`?limit=${PAGE_SIZE}&offset=${offset}&response_fields=${LIST_FIELDS}`)

export async function fetchAll(): Promise<Country[]> {
  const first = await page(0)
  const offsets: number[] = []
  for (let o = PAGE_SIZE; o < first.meta.total; o += PAGE_SIZE) offsets.push(o)
  const rest = await Promise.all(offsets.map(page))
  const all = [first, ...rest].flatMap((d) => d.objects).map(toCountry)
  return [...all, ...EXTRA_COUNTRIES.filter((e) => !all.some((c) => c.cca3 === e.cca3))]
}

export const fetchByCode = async (code: string) => {
  const extra = EXTRA_COUNTRIES.find((c) => c.cca3 === code)
  if (extra) return extra
  const data = await get(`/codes.alpha_3/${encodeURIComponent(code)}?response_fields=${DETAIL_FIELDS}`)
  if (!data.objects[0]) throw new Error('Pays introuvable')
  return toCountry(data.objects[0])
}

export const fetchByCodes = async (codes: string[]) =>
  (
    await Promise.all(
      codes.map((c) => get(`/codes.alpha_3/${encodeURIComponent(c)}?response_fields=codes.alpha_3,names.common`)),
    )
  ).flatMap((d) => d.objects).map((o) => ({ cca3: o.codes.alpha_3, name: { common: o.names.common } }))
