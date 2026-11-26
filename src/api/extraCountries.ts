import type { Country } from './countries'
import abkhaziaFlag from '../assets/flags/abkhazia.svg'

// Territoires absents de l'API REST Countries (pas de code ISO 3166).
// Les valeurs chiffrées sont approximatives (recensement 2011 / estimations).
// Drapeau : Wikimedia Commons (Flag_of_the_Republic_of_Abkhazia.svg).
export const EXTRA_COUNTRIES: Country[] = [
  {
    cca3: 'ABK',
    name: {
      common: 'Abkhazia',
      official: 'Republic of Abkhazia',
      nativeName: { abk: { common: 'Аҧсны' } },
    },
    flags: { svg: abkhaziaFlag, png: abkhaziaFlag, alt: 'Drapeau de l’Abkhazie' },
    capital: ['Sukhumi'],
    region: 'Asia',
    subregion: 'Western Asia',
    continents: ['Asia'],
    population: 245000,
    area: 8660,
    languages: { abk: 'Abkhaz', rus: 'Russian' },
    currencies: { RUB: { name: 'Russian ruble', symbol: '₽' } },
    borders: ['GEO', 'RUS'],
    timezones: ['UTC+03:00'],
    car: { side: 'right' },
    independent: false,
    unMember: false,
    latlng: [43.0, 41.0],
    note:
      'Territoire partiellement reconnu : la plupart des États et l’ONU le considèrent comme faisant partie de la Géorgie.',
  },
]
