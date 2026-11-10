# Le Bureau du JDR

Fiche de personnage et base de sorts pour D&D 5e (règles 2014, la 5.5 en préparation) : création et
montée de niveau guidées, fiche qui dérive ses valeurs des règles, jets de dés, suivi de combat et de
repos, utilisable hors-ligne en PWA. Inclut un module de suivi pour le JDR solo *Ker Nethalas*.

Nuxt 4 + Vue 3 + Nuxt UI, Drizzle ORM sur Cloudflare D1, déployé sur un Cloudflare Worker.

## Démarrer

Node : la version de [`.nvmrc`](.nvmrc).

```bash
npm install
npm run dev        # applique les migrations à la D1 locale, puis http://localhost:3000
```

```bash
npm test           # suite Vitest (projets unit et nuxt)
npm run typecheck
npm run build
```

Copier [`.env.example`](.env.example) en `.env` : la connexion passe par OAuth (Discord, Google), et
`SEED_SECRET` protège `POST /api/admin/seed`, qui remplit le catalogue (voir [`docs/seeds.md`](docs/seeds.md)).

## Déploiement

Un push sur `main` déclenche Cloudflare Workers Builds, qui applique les migrations D1 puis déploie.
Les tests tournent dans GitHub Actions.

## Documentation

- [`docs/README.md`](docs/README.md) — carte des documents (moteur de règles, décisions, fonctionnalités)
- [`CLAUDE.md`](CLAUDE.md) — conventions de travail et recettes d'environnement
- Suivi : le projet GitHub [Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2)
