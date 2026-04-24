# Seeds

Les seeds peuplent la DB avec les données de référence (classes, espèces, sorts, objets…). Chaque seed est une fonction async dans `server/db/seeds/`.

## Comment lancer un seed

Les seeds s'exécutent via une **Nitro task** définie dans `server/tasks/seed.ts`.

### En développement

Utiliser le skill `/seed-dev` (nécessite que `npm run dev` tourne dans un terminal séparé), ou directement :

```bash
curl -X POST http://localhost:3000/_nitro/tasks/seed
```

### En production (D1 Cloudflare)

Utiliser le skill `/seed-prod`, ou manuellement :

```bash
npm run build
wrangler dev --remote
# dans un autre terminal :
curl -X POST http://localhost:8787/_nitro/tasks/seed
```

> ⚠️ `wrangler dev --remote` pointe sur la vraie base de prod. Ne pas lancer sans s'assurer que les seeds sont idempotentes.

---

## État des seeds

Toutes les seeds de référence sont idempotentes — elles peuvent être relancées sans risque de doublon.

| Seed | Fichier | Safe à relancer ? | Notes |
|---|---|---|---|
| `abilityScores` | `ability_scores.ts` | ✅ | `onConflictDoNothing` |
| `damageTypes` | `damage_types.ts` | ✅ | `onConflictDoNothing` |
| `magicSchools` | `magic_schools.ts` | ✅ | `onConflictDoNothing` |
| `characterSpecies` | `character_species.ts` | ✅ | Vérification par nom |
| `classes` | `classes.ts` | ✅ | Select + update/insert |
| `backgrounds` | `backgrounds.ts` | ✅ | |
| `warlock` | `warlock.ts` | ✅ | Vérification par nom |
| `spells` | `spells.ts` | ✅ | `onConflictDoNothing` |
| `items` | `items.ts` | ✅ | `onConflictDoNothing` |
| `characterSheets` | `character_sheets.ts` | ✅ | Vérification par nom — **dev uniquement** |

### Séparation prod / dev

La task `db:seed` exécute uniquement les seeds de référence. `characterSheets` est commentée dans la task — elle crée des personnages de test qui n'ont pas leur place en prod.

---

## Ordre d'exécution

```
Étape 1 (parallèle) : abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds
Étape 2             : warlock (nécessite classes)
Étape 3 (parallèle) : spells, items
```

---

## Pattern : seed par classe

Les features de classe et sous-classes suivent un pattern commun (voir `warlock.ts`) :

1. Retrouver la classe par nom
2. Upsert les sous-classes
3. Insérer les features de classe (idempotent par `classId + name`)
4. Insérer les features de sous-classe (idempotent par `subclassId + name`)
5. Lier les effets via `feature_effects` (`onConflictDoNothing`)

Les données brutes vivent dans `server/db/seeds/data/[classe].ts`.

---

## Données de référence : fichiers `data/`

| Fichier | Contenu |
|---|---|
| `classes.ts` | 12 classes D&D 5e avec `spellcastingAbility` et `hitDice` |
| `character_species.ts` | Espèces jouables avec leurs aptitudes et effets |
| `spells.ts` | Sorts avec composantes, dégâts/soins, DC, concentration, rituel |
| `items.ts` | Objets (armes, armures, équipement, outils) |
| `warlock.ts` | Features Occultiste + sous-classes (Grand Ancien, Fiélon…) |

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
