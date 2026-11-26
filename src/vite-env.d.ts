/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RESTCOUNTRIES_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
