# Architecture des composables

## Vue d'ensemble

`useCharacterSheet` est un **coordinateur** qui orchestre des sous-composables en couches. Chaque couche dépend des précédentes — ne jamais inverser ce sens.

```
useCharacterClasses        → espèce, classes, level, proficiencyBonus
useAbilityEffectInputs     → effets d'entrée de la couche 2 (espèce, aptitudes débloquées, dons, ASI,
                             maîtrises dérivées par le GET) — sans fetch ni stockage
  ↓
useCharacterAbilities      → scores (`computeAbilityScores`, shared/rules/abilityScores), modificateurs, compétences,
                             jets de sauvegarde ; + `activeEffectSources` (objets actifs + effets
                             temporaires, fiche seulement)
  ↓ (formulaContext construit ici pour éviter les dépendances circulaires)
useCharacterConditions     → états, épuisement, défenses, vitesse, PV max (shared/rules/hitPoints)
useCharacterVitals         → PV, PV temporaires et jets contre la mort comme l'état de shared/rules/damage
useCharacterSpellcasting   → caractéristique d'incantation, DD, emplacements de sort
useCharacterSpells         → liste des sorts du personnage, filtres, actions (fetch séparé)
useCharacterInventory      → inventaire, équipement, maîtrises, effets magiques, CA (fetch séparé)
useCharacterTemporaryEffects → effets temporaires de la fiche (colonne JSON, sans fetch)
```

`useCharacterSpells` et `useCharacterInventory` sont des domaines **indépendants** : ils ont leur propre `useFetch` et ne dépendent pas des couches précédentes (sauf `spellSlots` passé en `deps` à `useCharacterSpells`). Ils sont instanciés dans le coordinateur pour exposer leurs actions via l'API publique de `useCharacterSheet`.

### Pourquoi `formulaContext` est dans le coordinateur

`formulaContext` a besoin de `abilityModifiers` (couche 2) et alimente les features résolues du coordinateur. Le mettre dans un sous-composable créerait une dépendance circulaire. Il reste donc dans `useCharacterSheet.ts`.

De même, `resolvedFeatures`, `classFeatureEffects` et `allEffects` sont construits dans le coordinateur avant d'être passés à `useCharacterConditions`.

---

## Où ajouter du nouveau contenu

| Type de contenu | Où le mettre |
|---|---|
| Données d'espèce ou de classe | `useCharacterClasses` |
| Scores / modificateurs / compétences | `useCharacterAbilities` |
| Nouvelle source d'effets (maîtrise, bonus de carac.) | `useAbilityEffectInputs` (`useCharacterSheet.ts`) |
| Conditions, épuisement, défenses, vitesse | `useCharacterConditions` |
| Incantation, emplacements de sorts | `useCharacterSpellcasting` |
| Sorts du personnage (liste, fetch, actions) | `useCharacterSpells` |
| Inventaire, équipement, maîtrises | `useCharacterInventory` |
| Logique qui dépend de plusieurs couches | `useCharacterSheet` (coordinateur) |
| Nouveau domaine indépendant avec fetch propre | Nouveau `app/composables/character/useCharacter<Domain>.ts` |

### Règles

- Les sous-composables reçoivent leurs dépendances inter-couches via un paramètre `deps` explicite — pas d'imports croisés entre eux.
- Hors de la fiche (level-up, lentille de sorts), ne jamais reconstruire maîtrises ou caractéristiques à
  la main : instancier `useCharacterAbilities` avec `useAbilityEffectInputs`. `character_skills` ne porte
  que les overrides et l'expertise ; le lire seul donne un résultat faux (cf. `audit-completude.md` B9).
  Les effets d'objets n'y sont pas (l'inventaire a son propre fetch) : seule la fiche les passe, avec les
  effets temporaires, en `activeEffectSources`, via une forward-declaration car l'inventaire est instancié
  après la couche 2.
- Ce que le serveur doit lire **comme la fiche** (PV max au repos, au level-up, à la création) vit dans `shared/rules/`,
  pas dans un composable : `computeAbilityScores` et `shared/rules/characterEffects.ts` (effets d'espèce, de capacités,
  d'ASI, objets actifs, effets temporaires) sont appelés par les composables **et** par `sheetHitPoints`
  (`shared/rules/hitPoints.ts`), alimenté côté serveur par `server/utils/characterSheetLoader.ts` — le chargement du GET,
  partagé avec `characterRest`, `characterLevelUp` et `createCharacter` (cf. [D19](decisions.md#d19)).
- Les constantes module-level (listes, maps) vont en tête de fichier, avant le composable.
- Les types privés au fichier (ex. `DefenseEntry`, `SaveStatus`) ne sont pas exportés.
- Les constantes utiles à l'extérieur (ex. `binaryConditions`, `abilitySkillKeys`) sont exportées directement depuis le fichier, pas via le `return` du composable.

---

## Pattern d'injection de dépendances

```ts
export const useCharacterAbilities = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    speciesEffects: ComputedRef<Effect[]>
    proficiencyBonus: ComputedRef<number>
  },
) => { ... }
```

- `characterSheet` est toujours optionnel (`?`) avec accès safe (`?.`) pour permettre l'usage sans personnage chargé.
- `deps` regroupe les valeurs provenant des couches supérieures.

---

## Système `spellcastingAbility`

La caractéristique d'incantation est stockée à **deux niveaux** :

1. **`classes.spellcastingAbility`** — valeur par défaut fixe par classe D&D 5e (ex. Magicien = `'int'`, Clerc = `'wis'`). `null` pour les classes non-lanceurs par défaut (Barbare, Guerrier, Moine, Roublard).

2. **`subclasses.spellcastingAbility`** — surcharge par sous-classe, pour les sous-classes lanceuses de sorts d'une classe qui n'incante pas (Chevalier occulte → `'int'`, Escroc arcanique → `'int'`).

**Dérivation dans le composable :**
```ts
// sous-classe ?? défaut de la classe ?? null
const ability = subclass?.spellcastingAbility ?? cls?.spellcastingAbility ?? null
```

En multiclasse lanceur, chaque sort porte sa classe (`character_spells.class_id`, migration 0113) : le DD, le bonus d'attaque
et les dégâts d'un sort se calculent avec la caractéristique de SA classe (`statsForCasterClass`), la classe « active »
choisie sur la fiche ne servant que de repli (sort d'espèce, de don, ou antérieur à la colonne).

**Lanceurs du tiers** (`shared/rules/subclassCasting.ts`) : le Chevalier occulte et l'Escroc arcanique incantent à partir du
niveau 3 de leur classe alors que `classes.spellcasting_type` reste `none`. Leurs faits (table de sorts, école, liste du
Magicien) sont indexés par nom de sous-classe, comme `CLASS_DB_NAMES` l'est pour les classes ; le type d'incantation effectif
d'une classe s'obtient par `effectiveCasterType`, utilisé partout où le serveur calcule les emplacements.

Le setter du computed writable écrit sur `character_classes.spellcastingAbility` de la classe principale. Le deep watch de `[id].vue` persiste via `PUT /api/character_sheets/{id}`.

> Le cas occultiste multiclasse (emplacement de pacte → Cha obligatoire vs emplacement d'une autre classe → caractéristique de cette classe) est une règle UI à gérer séparément, non modélisée pour l'instant.
