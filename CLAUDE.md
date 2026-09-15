# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Avant d'affirmer : sourcer ou s'abstenir

S'applique à **toute affirmation factuelle sur ce dépôt** — code, tests, comportement en prod,
ce qui existe ou n'existe pas — et pas seulement aux changements qu'on vient d'écrire.

- **Une affirmation = une source.** Chaque affirmation sur le code cite soit `fichier:ligne` lu
  pendant *cette* réponse, soit la commande lancée et sa sortie. Sans source, ce n'est pas une
  affirmation : c'est une hypothèse, et elle doit être présentée comme telle.
- **Marquer ce qui n'est pas vérifié.** `⚠️ hypothèse` devant toute déduction non vérifiée.
  Tout le reste est réputé vérifié — donc ne jamais laisser passer une affirmation non sourcée
  sans ce marqueur. Le but est que le lecteur repère d'un coup d'œil ce qu'il doit challenger.
- **Les négations coûtent plus cher que les affirmations.** « il n'y a pas de X », « ce n'est
  utilisé nulle part », « rien ne teste ça » ne valent qu'accompagnées de la recherche
  exhaustive qui les établit, motif inclus (`grep -rn '<motif>' …`). À défaut, la formulation
  honnête est « je n'ai pas trouvé de X en cherchant `<motif>` » — qui n'est pas la même chose.
- **Jamais de réponse de mémoire** sur : le contenu d'un fichier, la signature ou le
  comportement d'une fonction, ce qu'un test couvre réellement, l'état du schéma et des
  migrations, ce qui tourne en prod. Vérifier coûte quelques secondes ; se tromper coûte une
  session entière à démêler.
- **« Je ne sais pas » et « je vérifie » sont des réponses valides**, et préférables à une
  reconstitution plausible. Ne jamais combler un trou par ce qui *devrait* logiquement s'y
  trouver.
- **Face à « tu es sûr ? » : rouvrir le fichier, pas le débat.** Ni re-affirmation, ni
  rétractation réflexe. On relance la vérification et on répond avec la sortie brute. Changer
  d'avis sans nouvelle preuve est une erreur au même titre que l'affirmation d'origine.
- **Une vérification a une date de péremption.** Elle vaut pour l'état lu à l'instant. Après un
  edit, un `git pull`, un changement de branche : relire, ne pas recycler une lecture
  antérieure — y compris la sienne, plus haut dans la même session.
- **« Impossible » et « indisponible » sont des affirmations comme les autres.** Un symptôme
  n'établit pas une limite : `node_modules/` vide ne signifie pas que le build est intestable ici,
  une erreur d'authentification ne signifie pas qu'un compte est requis. Avant de déclarer qu'une
  chose ne peut pas se faire dans cet environnement, l'essayer **une fois pour de vrai** et citer
  l'échec obtenu. C'est le plus coûteux des raccourcis : les autres désinforment, celui-là fait
  renoncer à du travail parfaitement faisable.
- **Les règles D&D se citent, elles ne se restituent pas.** Un bonus, une progression, un
  prérequis viennent de la source (AideDD, le seed, le catalogue en DB) — jamais de la mémoire du
  modèle, y compris quand la règle *semble* connue. Une règle restituée de tête ne produit pas un
  détail faux : elle produit une fonctionnalité entière fausse, construite et testée autour de
  l'erreur.
- **Une explication plausible n'est pas un diagnostic.** La première cause qui colle au symptôme
  est une piste à confirmer, pas une conclusion : on établit le mécanisme réel avant d'écrire le
  correctif, sinon on corrige quelque chose qui n'était pas cassé.

## Avant d'implémenter : challenger la solution

Le réflexe de fin de dev — « est-ce la meilleure solution ? a-t-on introduit de la dette ?
a-t-on oublié quelque chose ? » — se prend **avant** d'écrire le code, spontanément, sans que
l'utilisateur ait à le demander. Posé à la fin, il arrive au moment où la réponse coûte le plus
cher : rien ne pousse autant à justifier une approche que le temps déjà passé à l'écrire.

Pour tout changement non trivial (plus d'un fichier, une règle de calcul, le schéma, un seed, un
contrat d'API), annoncer **avant de commencer**, en quelques lignes :

- **L'approche retenue et au moins une alternative écartée**, avec la raison de l'écarter. Ne pas
  trouver d'alternative n'est pas le signe que la solution s'impose : c'est le signe qu'on n'a pas
  cherché.
- **Ce que le dépôt fait déjà** — le pattern qui couvre tout ou partie du besoin (`shared/rules/`,
  un util serveur partagé, un composable existant), trouvé par une recherche réelle, pas de
  mémoire. Ré-implémenter à côté d'un pattern existant est la dette la plus fréquente ici.
- **Ce que la solution laisse de côté** : compromis assumé, cas non couvert, surface non testée,
  effet de bord sur le read-model / les seeds / le chemin prod. Nommé avant, c'est une décision ;
  découvert après, c'est un oubli.

Un challenge qui conclut « tout va bien » à chaque fois ne sert à rien : il doit pouvoir changer
le plan, et quand il y aboutit, on change de plan — le travail déjà fourni n'est pas un argument.

La **Definition of Done** repose les mêmes questions à la fin, mais contre le vrai diff : ici
elles filtrent le design, là elles contrôlent le résultat.

## Definition of Done (méthode de travail)

S'applique à **chaque** changement, sans qu'on ait à le demander :

- **Vérifier avant de dire « fait ».** Relire le vrai `git diff` (pas sa mémoire), lancer la suite complète + lint, et confirmer qu'aucun snapshot / golden-master ne bouge par accident.
- **Complétude — ne rien oublier.** Parcourir les angles morts récurrents : chemin prod/déploiement (migration auto vs seed manuel vs front — le piège du backfill), duplication vs un pattern existant qui centralise déjà (ex. `buildProficiencyCarrier`), surface non testée (`seeds hub:db`, front) et comment elle est gardée (test-contrat, garde-fou), effets de bord (read-model, features matérialisées, fixtures), cohérence avec les conventions du repo (nommage, `ruleset`, tests-contrat).
- **La meilleure solution, pas un quick fix.** Préférer le design correct / DRY / aligné sur les patterns existants à une rustine ; réutiliser le pattern plutôt que le ré-implémenter.
- **Zéro dette nouvelle.** Ne pas introduire de dette. Si un compromis est réellement inévitable, le remonter explicitement (dans la réponse, et dans `docs/` s'il doit être suivi) — jamais en silence.

## Quand une erreur est relevée

Une erreur qu'il a fallu me signaler se consigne dans [`docs/torts.md`](docs/torts.md) — commande
`/tort` — au moment où elle est relevée, **sans toucher à ce fichier-ci**. Les règles se révisent
d'un bloc quand la file est relue (~10 entrées), pas PR par PR : une convention retouchée à chaud
après chaque incident grossit sans qu'on voie jamais lesquelles de ses règles servent.

Le registre est une **file d'attente** : une entrée en sort quand elle a produit une règle, ou
qu'on a constaté qu'elle n'en méritait pas. Il note aussi, pour chaque erreur, si une règle
existante aurait dû l'attraper — auquel cas en ajouter une n'est pas la réponse.


## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run deploy       # Build and deploy to Cloudflare

npm test             # Run all tests (vitest)
npm run test:watch   # Tests in watch mode
npm run test:unit    # Unit tests only
npm run test:nuxt    # Nuxt integration tests only

npm run db:generate  # Generate Drizzle migrations
```

ESLint runs automatically via Nuxt's ESLint module — no separate lint command needed.
Pour linter un fichier précis hors dev server : `npx eslint <fichier>`.

### Build et tests depuis un environnement cloud (Claude Code on the web)

**Le build est testable en cloud — pas besoin de Docker.**

Depuis [.claude/hooks/session-start.sh](.claude/hooks/session-start.sh), les dépendances sont
installées automatiquement au démarrage de chaque session distante (hook `SessionStart`, ~40 s
à froid, ~10 s ensuite) : `npm ci` ci-dessous n'est donc plus nécessaire en temps normal. Le
hook ne fait rien en local (garde sur `CLAUDE_CODE_REMOTE`) et exporte `NUXT_SESSION_PASSWORD`
via `$CLAUDE_ENV_FILE`. La recette manuelle reste la référence si le hook n'a pas tourné
(Node 22, mesures réelles) :

```bash
npm ci                                       # ~40 s (postinstall `nuxt prepare` inclus)
npm run build                                # ~70 s → .output/ (worker + migrations + assets)
NUXT_SESSION_PASSWORD=ci_only_dummy_session_password_do_not_use npx vitest run   # ~30 s
npx wrangler --cwd .output deploy --dry-run  # valide le bundle Worker + les bindings, sans déployer
```

Notes :
- `NUXT_SESSION_PASSWORD` (≥ 32 car., factice) est requis par `nuxt-auth-utils` au boot —
  même valeur que `.github/workflows/tests.yml`.
- `deploy --dry-run` est le seul contrôle qui couvre l'étape **après** `nuxt build` : il
  résout `wrangler.jsonc`, vérifie les bindings (`DB`, `KV`, `BLOB`, `ASSETS`) et la taille
  du bundle. C'est ce qui rattrape une erreur de déploiement sans toucher la prod.
- `deploy --dry-run` ne couvre que le *bundling*. Pour exercer le Worker et ses bindings,
  voir la section suivante.

### Instancier Cloudflare en local (workerd + D1/KV/R2 émulés)

Wrangler embarque `workerd` (le vrai runtime des Workers) et Miniflare (émulation des
bindings). **Aucun compte ni credential Cloudflare n'est requis** — tout tourne hors ligne
et l'état persiste dans `.wrangler/state/` (gitignoré). Recette vérifiée de bout en bout :

```bash
npm run build                                       # .output/ doit exister d'abord
npx wrangler d1 migrations apply DB --local         # applique les migrations à la D1 locale
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var SEED_SECRET:localdev \
  --var NUXT_SESSION_PASSWORD:local_dev_dummy_session_password_32c
```

Au démarrage, Wrangler doit lister les 4 bindings en mode `local` :
`KV`, `DB`, `BLOB`, `ASSETS`. Ensuite, le seed et l'API répondent pour de vrai :

```bash
curl -X POST -H "x-seed-secret: localdev" \
  "http://127.0.0.1:8787/api/admin/seed?only=abilityScores,skills,magicSchools"
# → {"result":"success","summary":{"abilityScores":{"inserted":6,"skipped":0},…}}
curl http://127.0.0.1:8787/api/magic_schools     # relit les données depuis la D1 locale
npx wrangler d1 execute DB --local --command "SELECT …"   # inspection directe du SQLite
```

C'est le seul moyen de tester **avant déploiement** ce que `nuxt build` ne voit pas : une
migration qui casse, un seed non idempotent, un handler qui plante au runtime Workers
(et non sous Node/Vitest).

Gotchas :
- Lancer `wrangler dev` **depuis la racine**, pas `--cwd .output` : le `migrations_dir`
  généré (`.output/server/db/migrations/`) est relatif à la racine. Wrangler suit tout seul
  la redirection `.wrangler/deploy/config.json` → `.output/server/wrangler.json`.
- Passer les secrets par `--var` plutôt que de créer un fichier `.dev.vars`.
- Deux avertissements au boot sont **bénins** : `Unable to fetch the Request.cf object`
  (pas de réseau sortant vers Cloudflare → placeholder) et `Duplicate key "provider"`
  (`@nuxt/image` dans le bundle).
- Émulé ≠ prod : pas de limite de requêtes D1 par invocation ici, donc un seed complet peut
  passer en local et échouer en prod. Garder le découpage `?only=`.

### Running `nuxt dev` from a Claude session

The dev server takes ~15–25 s to boot and **must** run in the background. Reliable recipe (from a WSL Ubuntu shell):

```bash
# 1. Kill any existing instance
wsl -d Ubuntu -- bash -c "pkill -f 'nuxt dev'"

# 2. Launch in background, logs to /tmp/nuxt-dev.log
wsl -d Ubuntu -- bash -c "cd <worktree-or-repo-path> && nohup npm run dev > /tmp/nuxt-dev.log 2>&1 & disown"

# 3. Wait for readiness with the Monitor tool (NOT chained sleeps — they're blocked):
wsl -d Ubuntu -- bash -ic "until grep -qE '(Local:|listening|ready|Error|migration)' /tmp/nuxt-dev.log; do sleep 3; done; tail -40 /tmp/nuxt-dev.log"
```

Gotchas:
- `bash -ic` (interactive) **breaks** `$(…)` command substitutions in some cases (e.g. `SECRET=$(grep … | cut …)` returns empty). Use `bash -c` for scripts that read variables that way.
- The server runs in whatever directory you `cd` to. To test a worktree, start it from the worktree path, not `/home/kmorpain/le-bureau-du-jdr` (main checkout).
- Migration auto-application logs `[nuxt:hub] ✔ Database migration .data/db/migrations/00XX_…sql applied` — handy readiness signal after a schema change.

### Drizzle migrations: `db:generate` fails non-interactively

`drizzle-kit generate` prompts for TTY when it detects ambiguous column conflicts (drop/rename). In a non-interactive shell → `Interactive prompts require a TTY terminal`.

Workaround: write the SQL by hand.
1. Create `server/db/migrations/0XXX_<name>.sql` with the DDL.
2. Append to `server/db/migrations/meta/_journal.json`:
   ```json
   { "idx": <next>, "version": "6", "when": <timestamp_ms>, "tag": "0XXX_<name>", "breakpoints": true }
   ```
3. Restart `nuxt dev` — NuxtHub applies the migration automatically.

No need to write the matching snapshot `.json` by hand; the next successful `db:generate` will regenerate it.

### NuxtHub `hub:db` schema cache

The `hub:db` module exposes a schema cached at startup that may **not** reflect recently added tables/columns (ESM cache of `node_modules/@nuxthub/db/schema.mjs`). Symptoms:
- `drizzle.set()` silently drops new fields → empty SQL → error.
- New relations → `Cannot read properties of undefined (reading 'referencedTable')`.

Fix: import the schema from source for anything new.
```ts
import { db } from 'hub:db'                       // db is fine
import * as schema from '~~/server/db/schema'     // fresh schema
```

For new relations, avoid `db.query.X.findFirst({ with: { newRelation: true } })` — instead run a separate `db.select().from(srcSchema.newTable).where(...)` and merge in JS.

## Architecture

**Le Bureau du JDR** is a D&D 5e (2014) character sheet and spell database app. Full-stack Nuxt 4 app deployed to Cloudflare Workers (Wrangler), with NuxtHub modules providing the D1/KV bindings during local dev.

**Stack:** Nuxt 4 + Nitro (cloudflare_module preset) + Vue 3 + TypeScript + Drizzle ORM + Cloudflare D1 (SQLite) + Nuxt UI

### Data flow

```
Vue pages/components → composables (useFetch) → Nitro server routes → Drizzle ORM → SQLite (NuxtHub)
```

### Key directories

- `app/pages/` — file-based routing (Nuxt 4 app dir structure)
- `app/components/` — domain-organized components (`character_sheet/`, `character_builder/`, `level_up/`, `characters/`, `spells/`, `wizard/`, `icons/`)
- `app/composables/` — `useCharacterSheet`, `useCharacterBuilder`, `useLevelUp`, `useSpellFilters`, `useSpellbook`
- `server/api/` — Nitro route handlers using `defineEventHandler`
- `server/db/schema/` — Drizzle ORM schema (source of truth for all types)
- `server/db/seeds/` — Seed data for initial population
- `shared/utils/` — Zod validation schemas shared between client and server

### Database schema

Tables: `character_sheets`, `character_species`, `character_classes`, `character_ability_scores`, `spells`, `magic_schools`, `traits`, `effects`, `damage_types`, `ability_scores` (plus join/relation tables). Types are inferred from the Drizzle schema — don't define separate types for DB entities.

### API conventions

- Route files in `server/api/` generate REST endpoints automatically by filename
- Use `readValidatedBody` with Zod schemas for POST request validation
- Zod schemas with i18n error messages live in `shared/utils/`

### State management

- Persistent data: SQLite via NuxtHub — see `docs/persistence.md` for the full matrix and sync patterns
- Encounter state (active conditions, death saves, armor class): `useStorage()` (localStorage)
- Derived values (ability modifiers, proficiency bonus, spell save DC): computed properties — never stored

### Composables

`useCharacterSheet` is a thin coordinator over layered sub-composables (`useCharacterClasses`, `useCharacterAbilities`, `useCharacterConditions`, `useCharacterSpellcasting`, `useCharacterSpells`, `useCharacterInventory`). See `docs/architecture.md` for the layer diagram, dependency injection pattern, and where to add new content.

### Character sheet

`app/pages/characters/[id]/index.vue` — See `docs/character-sheet.md` for the full breakdown of each section: what it displays, where data comes from, which API endpoints it uses, and what's not yet implemented.

### Character creation

`app/pages/characters/new.vue` — 6-step wizard. See `docs/character-builder.md` for the steps (Race → Classe → Carac. → Sorts → Description → Équipement), the `BuilderState` shape, UI conventions, and the POST endpoint.

### Level-up

`app/pages/characters/[id]/level-up.vue` — Wizard conditionnel (2 à 6 étapes selon la classe et le niveau). See `docs/level-up.md` for the `LevelUpState` shape, which steps are active and when, the validation rules by step, and what the POST endpoint does.

See `docs/context.md` for accumulated development context: dashboard v2 architecture, UI conventions (dots, spellSlots provide/inject), key bug fixes, and decisions made across sessions.

### Deployment

Production runs on a Cloudflare Worker (config in [wrangler.jsonc](wrangler.jsonc) — D1 binding `DB`, KV binding `KV`, R2 binding `BLOB` → bucket `le-bureau-du-jdr-media`, portraits de personnage).

**Deployment is automatic via Cloudflare Workers Builds (CI) on `git push`** to the default branch — the build runs `nuxt build`, deploys the worker, and **applies pending D1 migrations** (from `.output/server/db/migrations/`, tracked in the `_hub_migrations` table per wrangler.jsonc). Deployment is configured on Cloudflare's side via the Git integration — not in GitHub Actions. The only GitHub Actions workflow is [.github/workflows/tests.yml](.github/workflows/tests.yml), which runs the Vitest suite (`unit` + `nuxt` projects) on push to `main` and on every PR; it does **not** build or deploy. `npm run deploy` (`nuxt build` + `wrangler deploy`) remains available as a manual fallback.

NuxtHub's role is limited to dev: the `@nuxthub/core` module wires up the local D1 emulation and the `hub:db` schema cache (see gotchas below). The deployed worker uses the native Cloudflare D1 binding directly via Drizzle.

**Seeding prod:** the full seed (`POST /api/admin/seed`) can exceed D1's per-invocation query limit. Pass `?only=<seed>[,<seed>]` (e.g. `?only=feats`) to run only a subset sequentially — see `server/db/seeds/run.ts`. Seeds are idempotent.

### Testing

Two Vitest projects: `unit` (happy-dom) and `nuxt` (Nuxt Test Utils). Tests live in `test/unit/` and `test/nuxt/`.
