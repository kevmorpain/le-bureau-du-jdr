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
| `characterSpecies` | `character_species.ts` | Vérification par nom | 13 entrées (9 espèces + 4 sous-espèces) |
| `classes` | `classes.ts` | Select + update/insert | |
| `backgrounds` | `backgrounds.ts` | `upsertByName` | |
| `barbare` … `warlock` | `[classe].ts` | Vérification par (classId, nom) | 12 classes, features + sous-classes |
| `spells` | `spells.ts` | `upsertByName` + `onConflictDoNothing` pour liens | Insère aussi les associations `spell_classes` |
| `items` | `items.ts` | `onConflictDoNothing` | |
| `characterSheets` | `character_sheets.ts` | Vérification par nom | **Dev uniquement** — commenté dans `run.ts` |

### Séparation prod / dev

`characterSheets` est commentée dans `run.ts` — elle crée des personnages de test qui n'ont pas leur place en prod.

---

## Ordre d'exécution

```
Étape 1 (parallèle) : abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds
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
| `spells.ts` | 43 sorts avec composantes, dégâts/soins, DC, concentration, rituel |
| `spell_class_mappings.ts` | Associations sorts↔classes |
| `items.ts` | Objets (armes, armures, équipement, outils) |

Ces fichiers font autorité sur les valeurs de référence — en cas de divergence avec la DB, la DB a tort.

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
