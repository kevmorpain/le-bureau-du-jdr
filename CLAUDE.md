# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Production runs on a Cloudflare Worker (config in [wrangler.jsonc](wrangler.jsonc) — D1 binding `DB`, KV binding `KV`). Deployment is **manual** via `npm run deploy` (which runs `nuxt build` then `wrangler deploy` under the hood). There's no GitHub Actions workflow set up — `.github/workflows/` is empty.

NuxtHub's role is limited to dev: the `@nuxthub/core` module wires up the local D1 emulation and the `hub:db` schema cache (see gotchas below). The deployed worker uses the native Cloudflare D1 binding directly via Drizzle.

### Testing

Two Vitest projects: `unit` (happy-dom) and `nuxt` (Nuxt Test Utils). Tests live in `test/unit/` and `test/nuxt/`.
