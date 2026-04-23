# Architecture des composables

## Vue d'ensemble

`useCharacterSheet` est un **coordinateur** qui orchestre des sous-composables en couches. Chaque couche dépend des précédentes — ne jamais inverser ce sens.

```
useCharacterClasses        → espèce, classes, level, proficiencyBonus, speciesEffects
  ↓
useCharacterAbilities      → scores, modificateurs, compétences, jets de sauvegarde
  ↓ (formulaContext construit ici pour éviter les dépendances circulaires)
useCharacterConditions     → états, épuisement, défenses, vitesse, PV max
useCharacterSpellcasting   → caractéristique d'incantation, DD, emplacements de sort
useCharacterSpells         → liste des sorts du personnage, filtres, actions (fetch séparé)
useCharacterInventory      → inventaire, équipement, maîtrises, effets magiques (fetch séparé)
```

`useCharacterSpells` et `useCharacterInventory` sont des domaines **indépendants** : ils ont leur propre `useFetch` et ne dépendent pas des couches précédentes (sauf `spellSlots` passé en `deps` à `useCharacterSpells`). Ils sont instanciés dans le coordinateur pour exposer leurs actions via l'API publique de `useCharacterSheet`.

### Pourquoi `formulaContext` est dans le coordinateur

`formulaContext` a besoin de `abilityModifiers` (couche 2) et alimente les features qui utilisent `speciesEffects` (couche 1). Le mettre dans un sous-composable créerait une dépendance circulaire. Il reste donc dans `useCharacterSheet.ts`.

De même, `resolvedFeatures`, `classFeatureEffects` et `allEffects` sont construits dans le coordinateur avant d'être passés à `useCharacterConditions`.

---

## Où ajouter du nouveau contenu

| Type de contenu | Où le mettre |
|---|---|
| Données d'espèce ou de classe | `useCharacterClasses` |
| Scores / modificateurs / compétences | `useCharacterAbilities` |
| Conditions, épuisement, défenses, vitesse | `useCharacterConditions` |
| Incantation, emplacements de sorts | `useCharacterSpellcasting` |
| Sorts du personnage (liste, fetch, actions) | `useCharacterSpells` |
| Inventaire, équipement, maîtrises | `useCharacterInventory` |
| Logique qui dépend de plusieurs couches | `useCharacterSheet` (coordinateur) |
| Nouveau domaine indépendant avec fetch propre | Nouveau `app/composables/character/useCharacter<Domain>.ts` |

### Règles

- Les sous-composables reçoivent leurs dépendances inter-couches via un paramètre `deps` explicite — pas d'imports croisés entre eux.
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

2. **`character_classes.spellcastingAbility`** — surcharge optionnelle par personnage-classe. Utilisée pour les subclasses lanceurs de sorts sur des classes de base non-magie (Chevalier mystique → `'int'`, Filou ésotérique → `'int'`, Voie des quatre éléments → `'wis'`).

**Dérivation dans le composable :**
```ts
// surcharge character_classes ?? défaut classes ?? null
return mainClass.spellcastingAbility ?? mainClass.class?.spellcastingAbility ?? null
```

Le setter du computed writable écrit sur `character_classes.spellcastingAbility` de la classe principale. Le deep watch de `[id].vue` persiste via `PUT /api/character_sheets/{id}`.

> Le cas occultiste multiclasse (emplacement de pacte → Cha obligatoire vs emplacement d'une autre classe → caractéristique de cette classe) est une règle UI à gérer séparément, non modélisée pour l'instant.
