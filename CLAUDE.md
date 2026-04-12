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

## Architecture

**Le Bureau du JDR** is a D&D 5e character sheet and spell database app. Full-stack Nuxt 4 app deployed to Cloudflare Workers via NuxtHub.

**Stack:** Nuxt 4 + Nitro (server) + Vue 3 + TypeScript + Drizzle ORM + SQLite (NuxtHub D1) + Nuxt UI

### Data flow

```
Vue pages/components → composables (useFetch) → Nitro server routes → Drizzle ORM → SQLite (NuxtHub)
```

### Key directories

- `app/pages/` — file-based routing (Nuxt 4 app dir structure)
- `app/components/` — domain-organized components (`character_sheet/`, `characters/`, `spells/`, `icons/`)
- `app/composables/` — `useCharacterSheet`, `useSpellFilters`, `useSpellbook`
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

- Persistent data: SQLite via NuxtHub
- UI state (armor class, spell slots, death saves): `useStorage()` (localStorage)
- Derived values (ability modifiers, proficiency bonus, spell save DC) are computed properties in composables — not stored

### Deployment

GitHub Actions auto-deploys: feature branches → preview, `main` → production (NuxtHub). Local deploy: `npm run deploy` uses Wrangler.

### Testing

Two Vitest projects: `unit` (happy-dom) and `nuxt` (Nuxt Test Utils). Tests live in `test/unit/` and `test/nuxt/`.
