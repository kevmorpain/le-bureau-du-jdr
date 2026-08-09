# Rules Engine — design cible

> La **spec durable** que l'implémentation suit. Les constats qui la motivent sont dans
> [`architecture-audit.md`](./architecture-audit.md) ; les décisions et leur pourquoi dans
> [`decisions.md`](./decisions.md) ; le plan/roadmap dans [`dnd-5.5.md`](./dnd-5.5.md).

## Principe

Les données d'un personnage se **dérivent** de son espèce / classe / historique, puis on
applique ses **choix** (sous-classe, dons, ASI…) et ses **overrides** (grant/revoke). La
logique de dérivation et de résolution est **pure et partagée** (`shared/rules/`), lancée
côté serveur (autorité) *et* client (UX). Cf. [D3](./decisions.md#d3), [D8](./decisions.md#d8),
[D10](./decisions.md#d10).

---

## 1. `shared/rules/` — source de vérité des ensembles fermés

Une **const canonique** par ensemble fermé ; type, Zod, table DB et i18n en **dérivent**
(cf. [D6](./decisions.md#d6)).

```ts
// shared/rules/abilities.ts
export const ABILITIES = { str: { skills: ['athletics'] }, dex: { /* … */ } } as const
export type AbilityKey    = keyof typeof ABILITIES          // union DÉRIVÉE
export const ABILITY_KEYS = Object.keys(ABILITIES) as AbilityKey[]
export const abilityEnum  = z.enum(ABILITY_KEYS)            // Zod DÉRIVÉ
// labels → i18n (fr.json), PAS dans la const (cf. D11)
```

| Ensemble | Disposition |
|---|---|
| abilities, damage_types, magic_schools (déjà en table) | **seeder depuis la const**, supprimer les unions/enums fantômes (`enum AbilityScore`, `AbilityScoreKey`, `z.enum` recopiés) |
| conditions, propriétés d'arme, tailles, alignement (union code) | const seule, pas de table |
| **compétences** | const canonique **+ table `skills`** ([D7](./decisions.md#d7)) — répare la casse |
| langues, outils | strings typées, table plus tard |

`shared/rules/` héberge **aussi** le moteur de règles aujourd'hui dupliqué : tables
d'emplacements de sorts (en triple : POST + front + level-up), formule de PV (en double).
Une seule copie, client *et* serveur.

---

## 2. Modèle d'effets (existant + extensions)

`effects` = union discriminée typée, dédupliquée par `(type, value)`, branchée via
`feature_effects` / `item_effects`, agrégée en `allEffects` puis filtrée par type. C'est le
backbone des **grants passifs** (espèce, classe, dons, invocations, objets magiques). Les
sorts et stats d'arme gardent leur modèle propre (mécaniques actives) — voulu.

**Extensions nécessaires à l'union `Effect`** :
- **nouveau** `saving_throw_proficiency` (les JS n'ont aujourd'hui aucun type d'effet)
- **enrichir** `skill_proficiency_choice` : `{ count }` → `{ count, from }`

---

## 3. Les trois catégories de données de classe

| Catégorie | Nature | Modélisation |
|---|---|---|
| **Grants passifs** (maîtrises, JS, résistances) | toujours actif | **effects** sur features de classe |
| **Faits d'identité** (dé de vie, niveau de sous-classe, type d'incantation, maîtrise d'armes) | statique | **colonnes** sur `classes` |
| **Points de choix** (sous-classe, pacte, style, expertise…) | décision à un niveau | **`progression`** (§4) |

Principe : **grant → effect ; identité → colonne ; décision → choix** ([D3](./decisions.md#d3)).

---

## 4. Modèle de choix : `progression` + `character_choices`

Owner = `feature` ([D4](./decisions.md#d4)). La feature porte déjà niveau / owner / ruleset.

### `progression` (référence)

```ts
progression {
  id: integer PK
  featureId: integer FK → features.id (cascade)   // owner + niveau + ruleset hérités
  kind: text $type<ChoiceKind>          // 'subclass'|'pact_boon'|'fighting_style'|'expertise'
                                        // |'invocations'|'asi_or_feat'|'metamagic'|'maneuvers'
                                        // |'ability_scores'|'skill'|'language'|'tool'
                                        // |'cantrip'|'spell'|'ancestry'|'weapon_mastery'
  count: JSON<Formula>                  // {op:'fixed',value:2} ou {op:'lookup',table:[0,2,2,3,…]}
  optionSource: JSON<OptionSource>
  replaceable: boolean                  // ex: invocations échangeables au level-up
}

type OptionSource =
  | { type: 'enum';            values: string[] }
  | { type: 'subclasses' }
  | { type: 'feature_group';   group: FeatureTag }          // invocation/metamagic/maneuver/fighting_style/pact_boon
  | { type: 'skills';          from: SkillKey[] | 'all' }
  | { type: 'proficient_skills' }
  | { type: 'languages';       from?: string[] }
  | { type: 'tools';           from?: string[] }
  | { type: 'abilities';       from: AbilityKey[]; distributions: ('2+1'|'1+1+1')[] }
  | { type: 'spells';          spellClass: string; maxLevel?: number; cantripsOnly?: boolean }
  | { type: 'feats';           category?: FeatCategory }
```

**Companion** : colonne nullable **`features.tag`** `$type<FeatureTag>()` (indexable) pour
énumérer les features-options d'un `feature_group`.

`count` réutilise le moteur `shared/utils/formula.ts` (op `lookup` = table par niveau).
⚠️ Le contexte de formule d'un choix doit utiliser le niveau de **la classe propriétaire**
(pas la classe principale) en multiclasse.

### `character_choices` (config)

Une ligne par pick atomique ; valeurs typées / FK ([D5](./decisions.md#d5)).

```ts
character_choices {
  id: integer PK
  characterSheetId: integer FK
  progressionId:    integer FK → progression.id
  classLevel: integer?
  // Référentiel (au plus un renseigné) :
  selectedSubclassId: integer? FK → subclasses.id
  selectedFeatureId:  integer? FK → features.id      // invocation/style/métamagie/manœuvre/don
  selectedSpellId:    integer? FK → spells.id
  selectedAbilityId:  text?    FK → ability_scores.id
  // Résiduel typé + composé :
  selectedValue: text? $type<SkillKey | ...>          // seulement si aucune table
  payload: JSON?                                      // triade {str:2,dex:1}
}
// unique (characterSheetId, progressionId, selectedSubclassId, selectedFeatureId,
//         selectedSpellId, selectedAbilityId, selectedValue)
```

### Exemples

| Feature (owner) | `kind` | `count` | `optionSource` | Sélection |
|---|---|---|---|---|
| Archétype martial (Guerrier L3) | `subclass` | fixed 1 | `{subclasses}` | `selectedSubclassId` |
| Pacte (Occultiste L3) | `pact_boon` | fixed 1 | `{feature_group:'pact_boon'}` | `selectedFeatureId` |
| Style de combat (Guerrier L1) | `fighting_style` | fixed 1 | `{feature_group:'fighting_style'}` | `selectedFeatureId` |
| Manifestations occultes | `invocations` | `lookup:[0,2,2,3,…]` | `{feature_group:'invocation'}` | N × `selectedFeatureId` |
| Expertise (Roublard L1) | `expertise` | fixed 2 | `{proficient_skills}` | 2 × `selectedValue` |
| Bonus de carac. (Historique 5.5) | `ability_scores` | fixed 1 | `{abilities,distributions}` | `payload={str:2,dex:1}` |

`character_choices` devient **LA source des décisions** ; `character_classes.subclassId`/
`pactBoon` et la matérialisation des invocations en dérivent (migration additive, [D8](./decisions.md#d8)).

---

## 5. Résolution

Deux couches ([D10](./decisions.md#d10)) :
- **Catalogue** (classes/espèces/sorts/définitions de `progression`) — statique, déterministe,
  **cachable au edge** par ruleset (KV / `routeRules`).
- **Projection perso** — dynamique. Une fonction pure `resolve(character, catalog) →
  { choix dus, options résolues, valeurs dérivées }` dans `shared/rules/`, lancée par le
  serveur (autorité + validation) et le client (UX). `optionSource:{proficient_skills}` se
  résout contre l'état du perso → non cachable.

Résolution **live** : la fiche dérive les features/effets actifs en joignant
`character_choices → features` + gating niveau/sous-classe (comme les traits d'espèce). Pas
de matérialisation sauf état runtime (`currentUses`).

---

## 6. Tables à modifier

| Table | Changement |
|---|---|
| `character_sheets`, `character_species`, `classes`, `backgrounds` | `ruleset` — **Phase 2** (enablement, après la clean) |
| `classes` | colonnes d'identité : `subclass_level`, `spellcasting_type`, (+ 5.5 `weapon_mastery_count`) |
| `backgrounds` | aligner sur l'espèce : `background_features` (join) + effects + `progression` pour la triade 5.5 |
| `features` | `tag` (feature_group) ; `ruleset` (dons standalone sans parent) |
| `spell_classes` | ⚠️ `ruleset` — les listes de sorts par classe changent en 5.5 |
| `spells` | ⚠️ `ruleset` (migration `0089`, Lot A) — description/effets divergents → **lignes séparées par édition** |
| `items` | `mastery_property` (maîtrise d'armes 5.5) |
| `effects` (union) | + `saving_throw_proficiency` ; `skill_proficiency_choice {count,from}` |
| `character_ability_scores` | en 5.5, base pure ; triade d'historique dérivée via `choix → ability_increase` |
| nouvelles | `progression`, `character_choices`, `skills` |

---

## 7. API

Auth/ownership **déjà correct** (middleware `character-sheets-authz`). Helper `useDrizzle()`
**existe mais est contourné**. Améliorations priorisées :

**🔴 Robustesse**
1. **Transactions** — `db.batch()` (atomique D1) sur create/level-up/rest ; aujourd'hui ~10 inserts non atomiques. ([D14](./decisions.md#d14))
2. **Dériver + valider côté serveur** (sous-classe∈classe, compétences∈autorisé, sort légal) au lieu de faire confiance au client.

**🟠 Cohérence / DRY**
3. Standardiser l'accès données : encapsuler le workaround hub:db (`srcSchema` + `as any`) dans un module ; `useDrizzle()` partout.
4. Middleware d'authz **attache la sheet à `event.context`** → supprime le boilerplate `if(!id) 400`/`findFirst`/`404` (~20×).
5. Enveloppe d'erreur cohérente + i18n (aujourd'hui mix FR/EN) sur `nuxt-zod-i18n`.
6. Zod dérivé de `shared/rules/` (fini les `z.enum(['str',…])` recopiés).

**🟢 Perf (Cloudflare)**
7. Cacher le **catalogue** au edge (KV / `routeRules`) — statique par ruleset.
8. Alléger le read-model du GET (arbre profond, `featureEffects→effect` niché 2×).

**🔵 Surface**
9. Consolider les endpoints catalogue épars sous `/api/catalog/*` avec `ruleset`.
10. Réconcilier le god-PUT (`index.put`) vs les PUT granulaires.

---

## 8. Tests

Contrat de valeurs D&D vérifiées, pas snapshots aveugles ([D12](./decisions.md#d12)).
Fixtures : Ambroise + 1 martial + 1 caster. Cible = la dérivation, testée d'abord sur les
sous-composables purs (`useCharacterAbilities`, `useCharacterClasses`) puis re-pointée sur
les fonctions extraites en `shared/rules/`. Le projet `nuxt` (happy-dom) est configuré mais
vide → premier test à créer.
