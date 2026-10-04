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
| Polyvalence (trait du Demi-elfe) | `skill` | fixed 2 | `{skills, from:'all'}` | 2 × `selectedValue` |
| Sort mineur (trait de la lignée Haut-elfe) | `cantrip` | fixed 1 | `{spells, spellClass:'wizard', cantripsOnly}` | `selectedSpellId` |
| Maîtrises d'historique (Acolyte) | `language` | fixed 2 | `{languages}` | 2 × `selectedValue` |
| Maîtrises de la classe (Barde) / de multiclassage | `tool` | fixed 3 / 1 | `{tools, from:[instruments]}` | N × `selectedValue` |
| Maîtrise en double (règle générale) | `skill` / `tool` | `var:duplicate_skills` / `duplicate_tools` | `{skills}` / `{tools}` | N × `selectedValue` |
| Magie des fées (trait de la Fadette) | `spellcasting_ability` | fixed 1 | `{enum, values:['int','wis','cha']}` | `selectedValue` |

`character_choices` devient **LA source des décisions** ; `character_classes.subclassId`/
`pactBoon` et la matérialisation des invocations en dérivent (migration additive, [D8](./decisions.md#d8)).

### Propriétaire d'un point de choix

`buildCatalog` le déduit de la feature porteuse : **classe** (`class_id`, ou la classe de la sous-classe),
**lignée** (`lineage_id`), **espèce** ou **historique** (liens `species_features` / `background_features`),
ou **règle générale** (`choice_carrier` sans aucun propriétaire, `global`). `resolveChoices` ne propose un
choix qu'au personnage qui détient ce propriétaire ; un choix hors classe se résout au niveau total (au
moins 1, pour le builder avant la classe). Pour une classe, le porteur de maîtrises de départ
(`proficiency_grant`, `classGrant:'start'`) ne vaut que pour la 1re classe, celui de multiclassage
(`classGrant:'multiclass'`) que pour une classe rejointe (`projection.mainClassId`). Le nombre dû d'une
règle générale vient du personnage (`projection.duplicates`, variables de formule `duplicate_*`).

Les doublons se comptent par **source fixe** (`proficiencyDuplicates`, `shared/rules/duplicateProficiencies.ts`) : compétences
d'espèce ∩ d'historique, outils de chaque classe (départ de la 1re, sous-ensemble de multiclassage des autres) ∩
d'historique. Au level-up, rejoindre une classe peut en ouvrir de nouveaux : `levelUpReplacements` (serveur) compte avant et
après, et demande `après − max(avant, remplacements déjà enregistrés)` — un doublon refusé à la création ne revient pas.
Le front lit le résultat (`GET /api/character_sheets/:id/level-up-replacements?classId=`) ; le POST du level-up le revalide.

### Sorts toujours préparés (domaine, serment, cercle)

Les sorts de domaine du Clerc, de serment du Paladin et de cercle du Druide sont des effets `always_prepared_spell
{ spellName, unlockLevel, terrain? }` posés sur la feature de sous-classe qui les décrit (`alwaysPreparedSpells.ts`, seed et
migrations 0114-0115). Ils ne sont **pas stockés** : `loadAlwaysPreparedSpells` les dérive à la lecture de la sous-classe et
du niveau de classe, et le GET `/spells` les ajoute avec `alwaysPrepared: true`. Un sort que le catalogue n'a pas encore
n'apparaît pas, et apparaît de lui-même une fois seedé. Le `terrain` du Cercle de la terre est un point de choix `terrain`
(`LABEL_CHOICE_KINDS`) porté par la sous-classe : une valeur, sans effet dérivé, que lit seulement cette dérivation.

### Caractéristique d'incantation d'espèce

Les `spell_grant` d'un trait d'espèce déclarent leur `spellcastingAbility` (Charisme pour le Tieffelin et le Drow). Quand
le trait porte un point de choix `spellcasting_ability` (Magie des fées de la Fadette, migration 0122), le pick remplace
cette valeur à la lecture de la fiche (`applySpellcastingAbilityPicks`, appelé par `loadSheetRelations`) ; sans pick, la
valeur des effets reste le défaut. Un sort de source `species` s'incante avec cette caractéristique
(`statsForSpell`, `useCharacterSpellcasting`) et non avec celle de la classe active.

### Chemin générique des picks de maîtrise

Les choix `skill` / `tool` / `language` (une valeur par pick), `cantrip` (un sort), `terrain` et `spellcasting_ability` (un libellé) passent tous par le
même chemin (`server/utils/choicePicks.ts`) : payload `choicePicks` à la création et au level-up, validé
contre `resolveChoices` (`choicePicksError` : point de choix proposé, nombre, options), stocké en
`character_choices`, et la maîtrise **dérivée** à chaque lecture (`deriveChoiceProficiencies` → champ
`choiceEffects` du GET de la fiche). Les compétences de classe y passent aussi ; seules les étapes du
builder leur restent propres. Un changement d'historique purge les picks de ses points de choix et ceux
des remplacements de maîtrises en double.

---

### Ressources de classe

Ki, points de sorcellerie, rages, Inspiration bardique, Conduit divin, Forme sauvage, Imposition des mains : **un compteur**,
pas un concept à part. `features.maxUsesFormula` (maximum) + `rechargeType` + `character_features.currentUses` (**dépensé**).
Ce qui s'y ajoute vit dans `features.meta` (`FeatureMeta`) et dans des effets typés, **sans règle par classe dans le code** :

| Donnée | Rôle |
|---|---|
| `meta.resource` | clé de la réserve (`RESOURCE_KEYS`) ; deux features de même clé **partagent** le compteur (Conduit divin Clerc/Paladin, AideDD Multiclassage : maximum le plus haut, lu au plus haut des membres, écrit sur tous) |
| `meta.pool` | réserve dépensée par paquets : « n / N » avec Dépenser / Regagner plutôt qu'une pastille par point |
| `meta.unlimitedFromClassLevel` | plus de limite (Rage 20) |
| `meta.whileActive` + `character_features.active` | effets en vigueur tant que la capacité est active (Rage) ; `suspendedByHeavyArmor` ; un repos (court ou long) y met fin |
| `meta.spends` / `meta.cost` | usages décrits en texte et payés par la réserve (ki) / capacités d'une autre feature payées par elle (Métamagie, `spell_level` = niveau du sort) |
| `meta.saveDcAbility` | DD de la réserve (DD de ki) |

**Formules au niveau de la classe propriétaire** : `featureFormulaContext` remplace `class_level` par le niveau de la classe qui
porte la feature (`class_feature` → sa classe, `subclass_feature` → la classe de la sous-classe). Un Moine 5 / Barbare 3 compte
ses rages sur 3 et son ki sur 5. Les `Formula` des effets ci-dessous s'évaluent de même.

Effets : `extra_attack` (maximum, jamais cumulé), `weapon_damage_dice` (Attaque sournoise, Châtiment divin amélioré),
`melee_strength_damage_bonus` (Rage, en `whileActive`), `resource_die` (dé d'Inspiration), `resource_regain` (regain au repos,
partiel ou total), `slot_damage_dice` (Châtiment divin), `beast_shape` / `beast_shape_challenge` (Forme sauvage, Cercle de la lune).
Les dérivations pures — `deriveClassTraits`, `resourceGroups`, `restRecovery` — sont dans `shared/rules/classResources.ts`
(client **et** serveur : le repos lit la même règle) ; conversion de points de sorcellerie et coûts dans `shared/rules/sorcery.ts`.

Le seed et la migration 0120 portent les mêmes données ; `test/fixtures/classResourcePatches.ts` énumère les features concernées
et `test/nuxt/classResourcesMigration.test.ts` garde l'égalité.

### CA sans armure, vitesse et bonus fixes

| Effet | Rôle |
|---|---|
| `unarmored_defense` `{ base, abilities, shield }` | CA sans armure de corps = `base` + modificateurs listés (Barbare 10 + DEX + CON, Moine 10 + DEX + SAG, Résistance draconique 13 + DEX) ; la meilleure source l'emporte, jamais la somme (`bestUnarmoredDefense`). `shield: false` : un bouclier la suspend (Moine) |
| `speed_bonus` `{ amount: Formula, while? }` | bonus de vitesse de **marche** (Déplacement rapide, Déplacement sans armure, don Mobile, objets) ; `while` = `no_heavy_armor` ou `no_armor_no_shield` ; la formule se lit au niveau de la classe propriétaire |
| `walking_speed` | vitesse de **base** absolue des traits d'espèce et de lignée ; jamais additionnée |
| `swimming_speed` / `climbing_speed` / `burrowing_speed` / `flying_speed` | vitesses de déplacement hors marche ; la plus haute l'emporte, aucun bonus ne s'y applique |
| `equipment_penalty` `{ penalty: 'speed', armor_type, override: true }` | neutralise la pénalité de Force des armures de ce type (Nain) |
| `weapon_attack_bonus` / `weapon_damage_bonus` `{ amount, weapons: 'all' \| 'melee' \| 'ranged' }` | bonus fixe signé aux jets d'attaque / de dégâts de chaque arme équipée, en plus de son `magicBonus` ; capacités, objets actifs et effets temporaires (`weaponBonusParts`, `shared/rules/effectBonuses.ts`) ; le Mode Combat nomme les sources au survol |
| `advantage` `{ rollType, ability, condition }` | avantage au jet (`check`, `saving_throw`, `attack`, `initiative`) ; sans `condition` il joue toujours (Rage, Instinct sauvage), avec il attend que le joueur désigne la situation au jet (voir « Jets de d20 ») ; `unless` : états actifs qui le suspendent (Sens du danger) ; `scope: 'strength_melee'` : attaque de mêlée menée avec la Force (Attaque téméraire) ; les conditions s'affichent aussi dans les défenses |

### Jets de d20

Chaque jet de d20 de la fiche porte un type (`D20Kind` : `attack`, `check`, `save`, `initiative`). La fiche (`useCharacterRolls`) en tire une **politique** — sources d'avantage et de désavantage, relance, plancher, plage de critique — que `useDiceRoller` reçoit par `provide` / `inject` et applique ; les sites d'appel ne portent jamais de règle. Tout est pur et testé dans `shared/rules/rolls.ts` ([D22](./decisions.md#d22)).

| Effet | Rôle |
|---|---|
| `reroll` `{ rollType: 'd20', trigger }` | relance le d20 qui donne `trigger` (Chanceux : 1) ; avec avantage ou désavantage, un seul dé |
| `half_proficiency` `{ abilities, rounding }` | moitié du bonus de maîtrise aux jets de caractéristique sans maîtrise (Touche-à-tout : tous, inférieur ; Athlète accompli : Force, Dextérité, Constitution, supérieur) ; ne se cumulent pas |
| `proficient_check_minimum` `{ minimum }` | un d20 plus bas compte pour `minimum` aux jets de compétence maîtrisée (Savoir-faire) |
| `critical_range` `{ from }` | les attaques d'arme sont des critiques dès `from` (Champion : 19, 18) ; la plus large l'emporte |
| `critical_extra_dice` `{ dice: Formula }` | dés de l'arme ajoutés au critique en mêlée (Critique brutal : 1, 2, 3), lus par `deriveClassTraits` au niveau de la classe |
| `spell_damage_bonus` `{ amount }` | bonus fixe signé à chaque jet de dégâts d'un sort (objets, capacités, effets temporaires) |
| `weapon_damage_dice` `needsAdvantage` | l'avantage au dernier jet d'attaque permet les dés (Attaque sournoise) : coché si avantage, refusé si désavantage, « à confirmer » sinon |
| `halve_damage_reaction` | case « dégâts ÷ 2 » de la saisie de dégâts (Esquive instinctive), avant résistance et vulnérabilité |

Sources fixes d'un jet : états (`conditionMechanics`), épuisement (1 : caractéristique, 3 : attaque et sauvegarde), armure non maîtrisée (jets basés sur Force ou Dextérité), Discrétion en armure à Discrétion désavantageuse, arme lourde en Petite taille. Un avantage et un désavantage s'annulent quel qu'en soit le nombre. Le joueur peut forcer Avantage, Désavantage ou Normal (qui écarte toutes les sources) pour le prochain jet, désigner la situation d'un avantage conditionnel (contre Effrayé, Poison, Magie…), et marquer des dégâts critiques à la main (cible paralysée). Un critique à l'attaque double les dés des dégâts suivants jusqu'à l'attaque suivante ; les modificateurs ne doublent jamais.

Pénalité d'armure (AideDD, Armures) : une armure dont `strength_requirement` dépasse le score de Force de la fiche retire 3 m
(`armorSpeedPenalty`). Les fonctions pures sont dans `shared/rules/armorClass.ts` et `shared/rules/speed.ts` ; la fiche les
assemble dans `useCharacterSheet` (base + bonus − pénalité, puis conditions). Seed et migration 0123 portent les mêmes données :
`test/nuxt/armorClassSpeedMigration.test.ts` garde l'égalité. Même chose pour les effets de jets : migration 0124,
`test/nuxt/rollEffectsMigration.test.ts` ; conditions d'avantage : migration 0125,
`test/nuxt/advantageConditionsMigration.test.ts`.

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

Auth/ownership **déjà correct** (middleware `character-sheets-authz`). Améliorations priorisées :

**🔴 Robustesse**
1. **Transactions** — `db.batch()` (atomique D1) sur create/level-up/rest ; aujourd'hui ~10 inserts non atomiques. ([D14](./decisions.md#d14))
2. **Dériver + valider côté serveur** (sous-classe∈classe, compétences∈autorisé, sort légal) au lieu de faire confiance au client.

**🟠 Cohérence / DRY**
3. ✅ Accès données standardisé : `db` et `schema` de `server/utils/db.ts` partout ([#210](https://github.com/kevmorpain/le-bureau-du-jdr/issues/210)). Seuls restent les casts de `.batch()`, absent du type `BaseSQLiteDatabase`.
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
