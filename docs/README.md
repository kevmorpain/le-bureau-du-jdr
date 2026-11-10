# Documentation — Le Bureau du JDR

Carte des documents. Commence par le sujet qui te concerne.

## Référence durable

| Doc | Rôle |
|---|---|
| [`rules-engine.md`](./rules-engine.md) | **Design du moteur de règles** : North Star, `shared/rules/`, effets, `progression`/`character_choices`, résolution, API |
| [`decisions.md`](./decisions.md) | **Journal de décisions** (ADR D1…) : chaque choix d'architecture et son pourquoi |
| [`architecture.md`](./architecture.md) | Architecture des composables (couches, injection de dépendances) |
| [`persistence.md`](./persistence.md) | Matrice de persistance (D1 / R2 / localStorage), auto-save, version de fiche, reprise PWA |
| [`seeds.md`](./seeds.md) | Seeds : lancement, ordre, patterns, rédaction du contenu |

## Fonctionnalités

| Doc | Sujet |
|---|---|
| [`character-builder.md`](./character-builder.md) | Création de personnage (assistant de 6 à 8 étapes) |
| [`character-sheet.md`](./character-sheet.md) | Fiche de personnage (dashboard 3 colonnes) |
| [`level-up.md`](./level-up.md) | Montée de niveau (wizard conditionnel) |

## Chantier D&D 5.5 (règles 2024)

[`dnd-5.5.md`](./dnd-5.5.md) : ce qui change en 5.5, cohabitation des éditions, état du chantier, règles de
sourcing du contenu 2024.

## Module Ker Nethalas (autre système, hors D&D)

| Doc | Rôle |
|---|---|
| [`ker-nethalas.md`](./ker-nethalas.md) | Objectif, licence et sourcing, inventaire des modificateurs, plan, interprétations à confirmer |
| [`ker-nethalas-decisions.md`](./ker-nethalas-decisions.md) | Décisions KN1… |

## Suivi : le projet GitHub

Bugs, fonctionnalités manquantes, dette et chantier 5.5 se suivent en issues dans le projet
[Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2). Conventions : section « Suivi du
projet » de [`CLAUDE.md`](../CLAUDE.md). Les registres ne gardent que la correspondance code → issue :

| Doc | Codes | Label des issues |
|---|---|---|
| [`audit-completude.md`](./audit-completude.md) | B — bugs de parcours, classe de risque, protocole d'audit | `bug` |
| [`fonctionnalites-manquantes.md`](./fonctionnalites-manquantes.md) | E, C, R, O, S, P, D, U, N, X — fonctionnalités absentes | `manquant` |
| [`consolidation-2014.md`](./consolidation-2014.md) | F — dette du socle 2014 | `dette` |
| [`torts.md`](./torts.md) | Erreurs de méthode relevées en session, en file jusqu'à la révision des conventions | — |
