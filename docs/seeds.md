# Seeds

Les seeds peuplent la DB avec les données de référence (classes, espèces, sorts, objets…). Chaque seed est une fonction async dans `server/db/seeds/`.

## Comment lancer un seed

Les seeds s'exécutent via une **Nitro task** définie dans `server/tasks/seed.ts`. Deux façons de la déclencher en développement :

1. **NuxtHub DevTools** → onglet "Tasks" → `db:seed`
2. **HTTP** (dev server lancé) : `POST http://localhost:3000/_nitro/tasks/db:seed`

La task est organisée en étapes ordonnées (les données de référence avant les fiches personnage) et toutes les seeds sont commentées par défaut. Décommenter uniquement ce dont on a besoin avant de lancer.

> ⚠️ En production, les seeds s'exécutent de la même façon via NuxtHub (onglet Database → Tasks). Ne jamais lancer une seed destructive en prod sans vérifier d'abord.

---

## État des seeds

| Seed | Fichier | Safe à relancer ? | Notes |
|---|---|---|---|
| `abilityScores` | `ability_scores.ts` | ❌ | INSERT simple, échouera si déjà présent |
| `damageTypes` | `damage_types.ts` | ❌ | INSERT simple |
| `magicSchools` | `magic_schools.ts` | ❌ | INSERT simple |
| `characterSpecies` | `character_species.ts` | ❌ | INSERT simple |
| `classes` | `classes.ts` | ✅ | UPDATE par nom + INSERT si absent |
| `warlock` | `warlock.ts` | ❓ | À vérifier |
| `spells` | `spells.ts` | ❌ | INSERT simple |
| `characterSheets` | `character_sheets.ts` | ❌ | INSERT simple |
| `items` | `items.ts` | ❓ | À vérifier |

Les seeds "INSERT simple" échoueront silencieusement ou en erreur si les données existent déjà. Pour les relancer, il faut soit vider la table, soit les réécrire avec un upsert.

---

## Problème connu : `db.run(sql\`...\`)` dans les Nitro tasks

La seed `classes` utilise `db.run(sql`...`)` pour faire des UPDATE — mais cette syntaxe **ne fonctionne pas** dans le contexte des Nitro tasks avec `hub:db`. Les updates sont silencieusement ignorés.

**Contournement local :** accéder directement à la DB SQLite avec Node.js :

```bash
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite');
db.prepare('UPDATE classes SET spellcasting_ability = ? WHERE name = ?').run('wis', 'Clerc');
// etc.
"
```

Le fichier `.sqlite` est dans `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`. Le hash change si la DB est recréée.

**Fix à faire :** réécrire la seed `classes` pour utiliser `db.update()` Drizzle à la place de `db.run(sql`...`)`.

---

## Données de référence : fichiers `data/`

Les données brutes vivent dans `server/db/seeds/data/` :

| Fichier | Contenu |
|---|---|
| `classes.ts` | 12 classes D&D 5e avec `spellcastingAbility` par défaut |
| `character_species.ts` | Espèces jouables avec leurs aptitudes et effets |
| `spells.ts` | Sorts avec composantes, dégâts/soins, DC, concentration, rituel |
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
