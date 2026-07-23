# Support des règles D&D 5.5 (2024) — Document de conception

> **Statut** : exploration / conception. Aucun code écrit à ce stade.
> **Objectif** : permettre la création de personnages avec les règles **5.5 (D&D 2024)**
> **en plus** des règles **5** (D&D 2014) déjà supportées. Les deux systèmes cohabitent.

Sources de référence (à consulter entrée par entrée au moment de seeder le contenu) :
- [Aux portes de l'aventure (règles 2024)](https://www.aidedd.org/regles-24/)
- [Création de personnage 2024](https://www.aidedd.org/regles-24/creation-de-personnage/)
- [Origines des personnages (espèces + historiques)](https://www.aidedd.org/regles-24/origines-des-personnages/)
- [Dons 5.5](https://www.aidedd.org/regles-24/dons/)
- [Classes 2024](https://www.aidedd.org/regles-24/classes/)

---

## 1. Principe directeur

- **Cohabitation, pas remplacement.** Les fiches `5` (2014) existantes restent intactes et jouables.
- **Le ruleset est figé à la création.** Une fiche est soit `5`, soit `5.5`, pour toute sa vie. Pas de conversion automatique (les deux systèmes ne sont pas mécaniquement compatibles poste à poste).
- **Convention de nommage.** La valeur stockée du ruleset est **`'5'`** ou **`'5.5'`** (noms quasi officiels). Les millésimes **2014 / 2024** ne servent que de repères de lecture dans ce doc.
- **Une seule règle de décision pour toucher au modèle de données** : on modifie une table si (a) la 5.5 a besoin que la donnée existe quelque part, **ou** (b) le hardcode front actuel devient un vrai problème dès qu'on a deux rulesets. Pas de normalisation « par principe ».

---

## 2. Ce qui change entre la 5 (2014) et la 5.5 (2024)

Le bouleversement central : **les bonus de caractéristiques passent de l'espèce vers l'historique.**

| Sujet | `5` — 2014 (actuel) | `5.5` — 2024 |
|---|---|---|
| **Bonus de carac.** | Viennent de l'**espèce** | Viennent de l'**historique** : +2/+1 sur deux carac., **ou** +1/+1/+1 sur trois (parmi 3 listées). Plafond 20. |
| **Espèce** | Bonus + traits + **sous-races** | **Traits uniquement**, plus de sous-races (remplacées par des « lignées » qui octroient des sorts/traits, sans bonus) |
| **Historique** | Compétences + outils + trait narratif | **+ bonus de carac. + un don d'origine** + compétences + maîtrise d'outil |
| **Dons** | Optionnels (à la place d'un ASI) | **Un don d'origine dès le niveau 1**. ~75 dons **catégorisés** : Origine / Général / Style de combat / Faveur épique. Prérequis, certains répétables. |
| **Espèces** | ~9 races + sous-races | **10 espèces** (3 nouvelles : aasimar, goliath, orc) |
| **Historiques** | narratifs, peu mécaniques | **16 historiques** mécaniquement chargés |
| **Sous-classe** | Niveau variable (1, 2 ou 3 selon la classe) | **Niveau 3 pour toutes** |
| **Maîtrise d'armes** | absente | **Nouvelle mécanique** (weapon mastery) pour les classes martiales |
| **Classes** | — | Refonte : Rôdeur lance dès le niv.1, dés d'arts martiaux du Moine revus, features remaniées, etc. |

**Listes PHB 2024** (à revalider entrée par entrée sur aidedd au moment du seed) :
- **Espèces (10)** : Aasimar, Drakéide, Nain, Elfe, Gnome, Goliath, Halfelin, Humain, Orc, Tieffelin.
- **Historiques (16)** : Acolyte, Artisan, Charlatan, Criminel, Artiste, Fermier, Garde, Guide, Ermite, Marchand, Noble, Sage, Marin, Scribe, Soldat, Voyageur.

---

## 3. Faut-il modifier les tables existantes ?

**Oui, mais chirurgicalement.** Le catalogue vit aujourd'hui à deux endroits : DB minimale + front riche
(`app/data/character-builder.ts`), reliés par **matching de chaîne** (`dbName`). C'est déjà fragile (cf. le Drow
`null` en DB, mappé à la main — voir « Lacunes DB connues » dans `character-builder.md`). Avec **deux rulesets**,
ce front **double** : deux copies parallèles à garder synchro contre le seed DB. C'est là que naissent les bugs.

### 🔴 À modifier — bloquant pour la cohabitation

| Table | Changement | Pourquoi |
|---|---|---|
| `character_sheets` | + colonne `ruleset` (`'5' \| '5.5'`, NOT NULL, défaut `'5'`) | Discriminant par personnage. Backfill des fiches existantes en `'5'`. |
| `character_species` | + colonne `ruleset` | Deux lignes « Elfe » (`5` vs `5.5`) coexistent, FK non ambiguë, supprime le matching `dbName` et le hack Drow. |
| `classes` | + colonne `ruleset` | Idem : une classe `5` et sa refonte `5.5` sont deux lignes distinctes. |
| `backgrounds` | + colonne `ruleset` ; + `ability_options` (JSON) ; + `origin_feat_id` (FK `features`) | Le triplet de carac. `5.5` et le don d'origine **n'ont nulle part où vivre aujourd'hui**. |

`features` et `subclasses` héritent du ruleset via leur parent (`classId` / `speciesId`), pas besoin d'une colonne
dédiée — sauf si on veut filtrer les dons par édition, auquel cas un `ruleset` sur `features` (pour les
`featureType = 'feat'`) est utile.

### 🟠 À modifier — fortement recommandé (tue la double source de vérité)

Remonter en DB les champs catalogue « porteurs de règles » que le builder lit et sur lesquels il **branche**.
Aujourd'hui listés comme « Lacunes DB connues » et compensés par `app/data/` :

| Table | Champs à ajouter | Type |
|---|---|---|
| `character_species` | `ability_bonuses` (vide en `5.5`), `darkvision`, `traits` (ou via `species_features`) | JSON / int |
| `classes` | `saving_throws`, `skill_choices` `{count, from}`, `armor_proficiencies`, `weapon_proficiencies`, `subclass_level` (`5.5` = 3 partout), `spellcasting_type` (`full`/`half`/`pact`/`null`) | JSON / int / text |
| `items` (armes) | `mastery_property` (Cranté, Ralentissement, Enfonçage…) | text |

**Raisonnement** : avec un seul ruleset, le hardcode front était tolérable. Avec deux, il devient deux copies
parallèles → le coût de duplication double, ce qui fait basculer vers la DB.

### 🟢 À laisser en front pour l'instant (faible valeur en DB)

`emoji`, couleurs de badge, descriptions longues, suggestions de personnalité/idéaux/liens/défauts. C'est de la
**présentation/flavor**, pas de la règle. Migrable plus tard sans risque.

### Conséquence sur le builder

Le builder devrait lire le catalogue via une **API** (comme `StepSpells` fait déjà `GET /api/spells`) plutôt que
d'importer `app/data`. → nouveaux endpoints `GET /api/catalog/species?ruleset=5.5`, `.../classes`,
`.../backgrounds`, `.../feats`. Le fichier `app/data/character-builder.ts` se réduit alors au flavor + aux libellés.

**Tradeoff honnête** : plus de travail au départ (schéma + migrations + seeds + builder qui fetch au lieu
d'importer). En échange, on arrête de maintenir deux représentations. Comme l'engagement porte sur deux rulesets
**durables**, ça vaut le coup.

### Chemin court (alternative, non recommandée pour du durable)

Garder le hardcode, ajouter `app/data/character-builder-5.5.ts`, poser juste `character_sheets.ruleset`, et
brancher le builder sur le bon fichier de données. C'est **le plus rapide** vers « créer un perso 5.5 », mais on
**conserve et on aggrave** la double source de vérité. À réserver à un prototype jetable.

---

## 4. Schéma cible proposé (esquisse Drizzle)

```ts
// character_sheets.ts
ruleset: text('ruleset').$type<'5' | '5.5'>().default('5').notNull(),

// character_species.ts
ruleset: text('ruleset').$type<'5' | '5.5'>().default('5').notNull(),
abilityBonuses: text('ability_bonuses', { mode: 'json' })
  .$type<Partial<Record<AbilityKey, number>>>().default({}).notNull(),
darkvision: integer('darkvision'), // portée en mètres, null si aucune

// classes.ts
ruleset: text('ruleset').$type<'5' | '5.5'>().default('5').notNull(),
savingThrows: text('saving_throws', { mode: 'json' }).$type<AbilityKey[]>().default([]).notNull(),
skillChoices: text('skill_choices', { mode: 'json' })
  .$type<{ count: number, from: string[] | 'all' }>(),
armorProficiencies: text('armor_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
weaponProficiencies: text('weapon_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
subclassLevel: integer('subclass_level').default(3).notNull(),
spellcastingType: text('spellcasting_type').$type<'full' | 'half' | 'pact' | null>(),

// backgrounds.ts
ruleset: text('ruleset').$type<'5' | '5.5'>().default('5').notNull(),
abilityOptions: text('ability_options', { mode: 'json' })
  .$type<{ abilities: AbilityKey[], distributions: ('2+1' | '1+1+1')[] }>(),
originFeatId: integer('origin_feat_id').references(() => features.id),
```

> ⚠️ `db:generate` échoue en non-interactif quand il détecte des colonnes ambiguës (voir `CLAUDE.md`).
> Prévoir d'écrire les migrations SQL à la main pour les ajouts de colonnes + backfill `ruleset = '5'`.

---

## 5. Migration des personnages existants

Triviale : `UPDATE character_sheets SET ruleset = '5'` (déjà couvert par le défaut de colonne).
Toutes les lignes catalogue existantes (espèces, classes, historiques seed) sont taguées `'5'`. **Rien d'autre
ne bouge côté 5** — les composables et la fiche continuent de fonctionner à l'identique.

---

## 6. Découpage en lots livrables

- **Lot 0 — Fondations.** Colonne `ruleset` (sheets + catalogue) + migration/backfill + endpoints catalogue +
  builder qui lit l'API. *Résultat : la 5 est fonctionnellement inchangée, mais l'architecture est prête.*
- **Lot 1 — Origines 5.5.** 10 espèces (traits, sans bonus) + 16 historiques (triade carac. + don d'origine) +
  refonte des étapes **Espèce** et **Historique** du builder + nouveau modèle de répartition des carac.
  *Résultat : on peut créer les origines d'un perso 5.5.*
- **Lot 2 — Classes 5.5.** Par vagues (3–4 classes à la fois) : sous-classe au niv.3, maîtrise d'armes,
  features remaniées, Rôdeur lanceur dès niv.1, etc.
- **Lot 3 — Dons complets.** Catégories Général / Style de combat / Faveur épique + prérequis + répétables.
- **Lot 4 — Fiche ruleset-aware.** Affichage de la maîtrise d'armes et des features 5.5 sur la fiche de perso.

**Option tranche verticale** : Lot 1 + 1–2 classes 5.5, créables et jouables de bout en bout, pour valider
l'architecture avant d'industrialiser le contenu.

---

## 7. Checklist par fichier (indicatif)

**Schéma & migrations**
- `server/db/schema/{character_sheets,character_species,classes,backgrounds}.ts` — colonnes ci-dessus
- `server/db/migrations/0XXX_ruleset_v5_5.sql` — DDL manuelle + backfill

**Seeds**
- `server/db/seeds/character_species.ts` (+ `species_features.ts`) — espèces 5.5
- `server/db/seeds/backgrounds.ts` — 16 historiques 5.5 (triade + don)
- `server/db/seeds/feats.ts` — dons 5.5 catégorisés
- `server/db/seeds/{classes,<classe>}.ts` — classes 5.5 par vagues

**API**
- `server/api/catalog/*.get.ts` — nouveaux endpoints catalogue filtrés par `ruleset`
- `server/api/character_sheets/index.post.ts` — accepter et poser `ruleset`

**Front**
- `app/composables/useCharacterBuilder.ts` — `BuilderState` : + `ruleset`, retrait des cas `halfElfBonuses`
  / `variantHumanBonuses` en mode `5.5`, ajout `backgroundAbilityChoices` / `originFeat`
- `app/data/character-builder.ts` — scinder ou réduire au flavor
- `app/components/character_builder/StepRace.vue` — retrait des bonus en `5.5`
- `app/components/character_builder/StepDescription.vue` — historique = répartition carac. + don d'origine
- `app/components/character_builder/StepAbilities.vue`, `BuilderPreview.vue` — source des bonus : espèce → historique
- `app/pages/characters/new.vue` — sélecteur de ruleset en amont de l'étape 1

---

## 8. À trancher / à sourcer sur aidedd avant chaque lot contenu

- Liste exacte des 16 historiques : triade de carac. + don d'origine + compétences/outils par entrée.
- Traits exacts des 10 espèces + lignées (elfe/gnome/tieffelin/drakéide).
- Table de maîtrise d'armes (les 8 propriétés) + accès par classe et progression.
- Dons 5.5 : catégories, prérequis, répétabilité, effets mécanisables.
- Comportement UI si un joueur change de ruleset en cours de création (reset de l'état builder ?).
