# Documentation — Le Bureau du JDR

Carte des documents. Commence par le sujet qui te concerne.

## Chantier D&D 5.5 (support des règles 2024)

| Doc | Rôle | Cycle de vie |
|---|---|---|
| [`dnd-5.5.md`](./dnd-5.5.md) | **Point d'entrée** : ce qui change en 5.5, principe de cohabitation, **roadmap** (Phases 0/1/2) | vivant |
| [`architecture-audit.md`](./architecture-audit.md) | **Constats** de l'audit du socle actuel (effets, dérivation, choix, API) — le « pourquoi on refactore » | instant T |
| [`rules-engine.md`](./rules-engine.md) | **Design cible durable** : `shared/rules/`, effets, `progression`/`character_choices`, résolution, API — la spec que l'implémentation suit | durable |
| [`decisions.md`](./decisions.md) | **Journal de décisions** (ADR) : chaque choix d'architecture + son pourquoi | durable |

**Ordre de lecture pour reprendre le chantier** : `dnd-5.5.md` (contexte + plan) → `architecture-audit.md` (constats) → `rules-engine.md` (quoi construire) → `decisions.md` (pourquoi).

## Fonctionnalités existantes

| Doc | Sujet |
|---|---|
| [`architecture.md`](./architecture.md) | Architecture des composables (couches, injection de dépendances) |
| [`character-builder.md`](./character-builder.md) | Création de personnage (wizard 6 étapes) |
| [`character-sheet.md`](./character-sheet.md) | Fiche de personnage (dashboard 3 colonnes) |
| [`level-up.md`](./level-up.md) | Montée de niveau (wizard conditionnel) |
| [`persistence.md`](./persistence.md) | Matrice de persistance (SQLite / localStorage) |
| [`seeds.md`](./seeds.md) | Données de seed |
| [`context.md`](./context.md) | Contexte de dev accumulé (bugs, conventions, décisions passées) |

> ⚠️ Certains docs de fonctionnalités précèdent l'audit et peuvent contenir des
> affirmations datées (signalées inline quand repérées). En cas de conflit, `rules-engine.md`
> et `decisions.md` font foi.
