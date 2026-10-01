# Seeds

Les seeds peuplent la DB avec les données de référence (classes, espèces, sorts, objets…). Chaque seed est une fonction async dans `server/db/seeds/`.

## Comment lancer un seed

Les seeds s'exécutent via l'endpoint `POST /api/admin/seed`, protégé par le header `x-seed-secret`.

### En développement

Utiliser le skill `/seed-dev` (nécessite que `npm run dev` tourne dans un terminal séparé).

### En production (D1 Cloudflare)

Utiliser le skill `/seed-prod`. Le code doit être déployé au préalable (attendre que le CI ait tourné).

> ⚠️ Les seeds sont idempotentes mais relancer en prod consomme du quota D1. À réserver aux nouvelles données.

---

## État des seeds

Toutes les seeds de référence sont idempotentes — elles peuvent être relancées sans risque de doublon.

| Seed | Fichier | Idempotence | Notes |
|---|---|---|---|
| `abilityScores` | `ability_scores.ts` | `onConflictDoNothing` | |
| `damageTypes` | `damage_types.ts` | `onConflictDoNothing` | |
| `magicSchools` | `magic_schools.ts` | `onConflictDoNothing` | |
| `rollTables` | `roll_tables.ts` | Par (key, ruleset), resynchronisé | Tables à lancer (Pic de magie sauvage). **Avant les classes** : leurs capacités y renvoient |
| `characterSpecies` | `character_species.ts` | Vérification par nom | 13 entrées (9 espèces + 4 sous-espèces) |
| `classes` | `classes.ts` | Select + update/insert | |
| `backgrounds` | `backgrounds.ts` | `upsertByName` | |
| `barbare` … `warlock` | `[classe].ts` | Vérification par (classId, nom) | 12 classes, features + sous-classes. `warlock.ts` insère aussi le catalogue de manifestations occultes (`warlock_invocations.ts`, 33 entrées avec `featureType: 'eldritch_invocation'`) |
| `spells` | `spells.ts` | `upsertByName` + `onConflictDoNothing` pour liens | Insère aussi les associations `spell_classes` |
| `items` | `items.ts` | `onConflictDoNothing` | |
| `characterSheets` | `character_sheets.ts` | Vérification par nom | **Dev uniquement** — commenté dans `run.ts` |

### Séparation prod / dev

`characterSheets` est commentée dans `run.ts` — elle crée des personnages de test qui n'ont pas leur place en prod.

---

## Ordre d'exécution

```
Étape 1 (parallèle) : abilityScores, damageTypes, magicSchools, rollTables, characterSpecies, classes, backgrounds
Étape 2 (parallèle) : barbare, barde, clerc, druide, guerrier, magicien,
                       moine, paladin, rôdeur, roublard, ensorceleur, warlock
Étape 3 (séquentiel): spells → items
```

L'étape 3 est séquentielle : `spells` génère ~165 requêtes D1 (sorts + liens `spell_classes`), ce qui provoque des locks D1 si `items` tourne en même temps.

---

## Pattern : helper `seedClass`

Toutes les classes utilisent le helper `server/db/seeds/lib/seedClass.ts`. Un seed de classe se résume à :

```ts
import { seedClass } from './lib/seedClass'
import { barbareName, barbareFeatures, barbareSubclasses } from './data/barbare'

export default async function seed() {
  return seedClass(barbareName, barbareFeatures, barbareSubclasses)
}
```

Le helper gère :
1. Retrouver la classe par nom (skip avec warning si absente)
2. Insérer les features de classe (idempotent par `classId + name`)
3. Upsert les sous-classes (idempotent par `classId + name`)
4. Insérer les features de sous-classe (idempotent par `subclassId + name`)
5. Lier les effets via `feature_effects` (`onConflictDoNothing`)
6. Lier la table à lancer d'une feature (`rollTable: 'wild_magic_surge'` → `features.roll_table_id`). Les
   clés sont résolues avant toute écriture : si `rollTables` n'a pas tourné, le seed échoue sans rien écrire

Retourne `{ featuresInserted, subclassesInserted }`.

### Ajouter une nouvelle classe

1. Créer `server/db/seeds/data/[classe].ts` avec `[classe]Name`, `[classe]Features`, `[classe]Subclasses`
2. Créer `server/db/seeds/[classe].ts` (3 lignes, voir pattern ci-dessus)
3. Exporter depuis `server/db/seeds/index.ts`
4. Ajouter l'appel dans l'étape 2 de `server/db/seeds/run.ts`

---

## Pattern : helper `upsertByName`

Pour les seeds simples (check-by-name + insert) : `server/db/seeds/lib/upsertByName.ts`.

Utilisé par `backgrounds.ts` et `spells.ts`.

---

## Sorts et associations classe

Les sorts vivent dans `server/db/seeds/data/spells.ts`. Les associations sorts↔classes sont dans `server/db/seeds/data/spell_class_mappings.ts` — un fichier dédié pour ne pas surcharger le data file.

Ajouter un sort à une classe :
```ts
// spell_class_mappings.ts
{ spellName: 'Nouveau sort', classNames: ['Magicien', 'Barde'] },
```

Le seed insère automatiquement les liens `spell_classes` (table de jointure `spellId × classId`) en même temps que les sorts.

---

## Données de référence : fichiers `data/`

| Fichier | Contenu |
|---|---|
| `classes.ts` | 12 classes D&D 5e |
| `character_species.ts` | 13 espèces/sous-espèces avec traits et effets |
| `[classe].ts` | Features + sous-classes par classe (12 fichiers) |
| `warlock_invocations.ts` | 33 manifestations occultes (PHB 2014 + TCoE) avec prérequis et effets (`spell_grant`, `eldritch_blast_modifier`, `pact_weapon_modifier`, `sight_modifier`, `skill_proficiency`, `advantage`…) |
| `spells.ts` | ~62 sorts avec composantes, dégâts/soins, DC, concentration, rituel |
| `spell_class_mappings.ts` | Associations sorts↔classes |
| `rollTables.ts` | Tables à lancer, clé canonique dans `shared/rules/rollTables.ts` ; texte repris d'AideDD |
| `items.ts` | Objets (armes, armures, équipement, outils) |

Ces fichiers font autorité sur les valeurs de référence — en cas de divergence avec la DB, la DB a tort.

---

## Rédaction du contenu seedé

Descriptions de capacités, sorts et tables s'affichent telles quelles sur la fiche. Le texte vient
d'AideDD ([D16](./decisions.md#d16), méthode : [`dnd-5.5.md`](./dnd-5.5.md) §4), avec ces conventions :

- **Quantités de ressources en chiffres** : « 1 action », « 1 action bonus », « 2 points de
  sorcellerie ». Une action ou un point se dépense : le chiffre dit d'un coup d'œil combien il en
  faut. Pas d'élision devant un chiffre : « est **de** 1 action », jamais « d'1 action » (précédent :
  `ensorceleur_metamagic.ts`, « Sort accéléré »). Ne vise que les quantités : « votre réaction »,
  « un emplacement de sort de niveau 1 » restent en toutes lettres.
- **Corriger les fautes, pas la règle** : on corrige l'orthographe et la grammaire du texte repris
  (accords, conjugaison, « œil »), pas une tournure correcte, même maladroite. Une reformulation peut
  déplacer la règle ; elle se propose, elle ne s'applique pas au passage.
- **Chercher la convention avant de réécrire** : avant de changer une tournure, regarder comment les
  seeds l'écrivent déjà, par exemple :
  `grep -rhoE "(1|une) action( bonus)?" server/db/seeds/data/ | sort | uniq -c`.

Le stock n'est pas encore uniforme (des « une action » subsistent) : la convention s'applique au
contenu neuf ou retouché, l'harmonisation du reste est un chantier à part.

---

## `classes.spellcastingAbility` : valeurs de référence

| Classe | Caractéristique |
|---|---|
| Barde | `cha` |
| Clerc | `wis` |
| Druide | `wis` |
| Ensorceleur | `cha` |
| Magicien | `int` |
| Occultiste | `cha` |
| Paladin | `cha` |
| Rôdeur | `wis` |
| Barbare, Guerrier, Moine, Roublard | `null` (non-lanceurs par défaut) |

Les classes non-lanceurs peuvent avoir une surcharge par personnage via `character_classes.spellcastingAbility` (ex. Chevalier mystique → `int`).
