# 🌍 World Countries

Portfolio : explorateur des pays du monde, alimenté par l'API [REST Countries](https://restcountries.com).

## Fonctionnalités
- Liste des pays avec recherche par nom
- Filtre par région
- Page détail (population, capitale, langues, devises, pays frontaliers)
- Thème clair / sombre (mémorisé)

## Stack
React 18 · TypeScript · Vite · React Router

## Démarrage
```bash
npm install
npm run dev
```

Build de production : `npm run build` (sortie dans `dist/`).

## Clé API
Copiez `.env.example` vers `.env.local` et renseignez `VITE_RESTCOUNTRIES_KEY`.
La clé est envoyée en `Authorization: Bearer <clé>`. Elle est incluse dans le bundle
et donc visible dans le navigateur : ne la committez jamais et limitez ses droits.
