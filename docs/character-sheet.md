# Fiche de personnage — sections et données

Page : `app/pages/characters/[id].vue`

La fiche charge le personnage via `GET /api/character_sheets/{id}` (include toutes les relations Drizzle sauf les sorts). Un deep watch avec debounce 1 s persiste les changements via `PUT /api/character_sheets/{id}`. Les sections qui font leurs propres fetches (inventaire, sorts) ont leurs propres composables.

---

## En-tête (`UPageHeader`)

| Composant | Affiche | Source de donnée | Persistence |
|---|---|---|---|
| `CharacterNameSection` | Nom du personnage | `character_sheets.name` | Deep watch → PUT |
| `ClassesSection` | Nom(s) de classe(s) | `character_classes` + relation `class` | Via `EditClassesSection` |
| `LevelSection` | Niveau total | Somme des `character_classes.level` (computed) | — |
| `HitDiceSection` | Dés de vie restants | `character_sheets.currentHitDie` (JSON) | Deep watch → PUT |
| `DeathSavingThrowSection` | Jets de sauvegarde contre la mort | `useStorage()` (localStorage) | localStorage |

**Boutons d'action :**
- **Repos court** / **Repos long** → `useRest` → `POST /api/character_sheets/{id}/rest`
  - Repos court : recharge les aptitudes `rechargeType: 'short_rest'`
  - Repos long : recharge tout + restaure les PV max + recharge les emplacements de sort
- **Modifier** : bouton présent, non implémenté (prévu pour éditer nom/classe/espèce/alignement)

---

## Barre de stats

| Composant | Affiche | Source | Persistence |
|---|---|---|---|
| `ArmorClassSection` | Classe d'armure | Computed : armure équipée + modificateur DEX + bouclier + effets magiques | — |
| `HitPointsSection` | PV actuels / PV max / PV temporaires | `character_sheets.{currentHp, maxHp, temporaryHp}` | `v-model` → deep watch |
| `StatusSection` | Conditions actives, résistances/immunités, épuisement, ancestralité draconique | Conditions : localStorage • Résistances : effets d'espèce/classe/inventaire | localStorage + deep watch |
| `InitiativeSection` | Bonus d'initiative | Computed : modificateur DEX ± effets | — |
| `SpeedSection` | Vitesse de déplacement | Computed : espèce + conditions (entrave, paralysie…) | — |
| `PassivePerceptionSection` | Perception passive | Computed : 10 + modificateur Perception | — |
| `InspirationSection` | Inspiration (oui/non) | `character_sheets.inspiration` | `v-model` → deep watch |

---

## Caractéristiques (`AbilityScoresSection`)

Affiche les 6 scores (FOR/DEX/CON/INT/SAG/CHA) avec :
- Score de base (éditable) + bonus d'espèce (automatique depuis les effets)
- Modificateur calculé
- Jets de sauvegarde (maîtrise depuis `character_ability_scores`)
- Compétences regroupées par caractéristique (maîtrise + expertise depuis `character_skills`)

**Source :** `character_ability_scores` pour les scores de base, effets d'espèce/classe pour les bonus, `character_skills` pour les maîtrises.
**Persistence :** `v-model` → deep watch → PUT.

**`ProficiencyBonusSection`** : bonus de maîtrise, purement computed depuis le niveau total. Affiché à côté des caractéristiques.

---

## Combat (`CombatSection`)

Liste les armes équipées avec bonus d'attaque et dés de dégâts calculés depuis :
- Propriétés de l'arme (`items.properties`)
- Modificateur STR ou DEX selon le type d'arme
- Bonus de maîtrise si `isWeaponProficient`
- Bonus magique (`character_inventory.magicBonus`)

**Source :** `character_inventory` (fetch séparé via `useCharacterInventory`).

---

## Inventaire (`InventorySection`)

Liste tous les objets du personnage avec quantité, état équipé, bonus magique, notes.

**API :** `GET /api/character_sheets/{id}/inventory` (fetch séparé, indépendant du deep watch).
**Ajout :** `AddItemSlideover` → `POST /api/character_sheets/{id}/inventory`
**Équiper/déséquiper :** `PUT /api/character_sheets/{id}/inventory/{entryId}`
**Supprimer :** `DELETE /api/character_sheets/{id}/inventory/{entryId}`

Les effets magiques des objets équipés (`character_inventory.magicEffects`) sont injectés dans `allEffects` et peuvent modifier CA, résistances, vitesse, etc.

---

## Bourse (`CurrencySection`)

Pièces de platine / d'or / d'électrum / d'argent / de cuivre.

**Source :** `character_sheets.{pp, po, pe, pa, pc}`.
**Persistence :** `v-model` → deep watch → PUT.

---

## Traits d'espèce (`SpeciesTraitsSection`)

Liste les aptitudes passives de l'espèce (ex. Vision dans le noir, Résistance draconique).

**Source :** `character_sheets.species.speciesFeatures` (chargé dans le GET principal via relations Drizzle imbriquées).

---

## Aptitudes de classe (`ClassFeaturesSection`)

Liste les aptitudes de classe actives avec compteur d'utilisations.

**Source :** `character_sheets.features` (chargé dans le GET principal).
**Persistence des utilisations :** `PUT /api/character_sheets/{id}/features` (via deep watch).

---

## Maîtrises (`ProficienciesSection`)

Maîtrises d'armes, d'armures, de langues et d'outils.

**Source :** Calculé depuis `allEffects` (effets d'espèce + classe + inventaire) + `character_proficiency_overrides` (ajouts/retraits manuels).
**API overrides :** `GET/PUT/DELETE /api/character_sheets/{id}/proficiency-overrides`

---

## Magie (`MagicSection`)

Section unifiée : stats d'incantation + liste des sorts + emplacements.

### Stats d'incantation
- Caractéristique d'incantation (sélectable, surcharge `character_classes.spellcastingAbility`)
- DD de sauvegarde : 8 + bonus de maîtrise + modificateur
- Bonus d'attaque avec un sort : bonus de maîtrise + modificateur

### Liste des sorts
Sorts groupés par niveau. Chaque ligne affiche : nom, temps d'incantation, portée, durée, DC (si applicable), concentration, rituel, composantes V/S/M, dégâts/soins calculés avec le vrai modificateur du personnage.

**API :** `GET /api/character_sheets/{id}/spells` (fetch séparé — **non inclus** dans le GET principal).
La relation `spell.school` est chargée dans ce fetch (`with: { spell: { with: { school: true } } }`).

**Filtres :** "Préparés seulement" / "Disponibles seulement" (état local, non persisté).

**Avertissement somatique :** si la condition `incapacitated` est active, les sorts avec composante S sont grisés.

### Emplacements de sort
Bulles interactives dans l'en-tête de chaque niveau. Gérés par `useCharacterSpellcasting`.
**API :** `GET/PUT /api/character_sheets/{id}/spell-slots` (debounce 500 ms).

### Actions
| Action | API |
|---|---|
| Ajouter un sort | `PUT /api/character_sheets/{id}/spells` |
| Supprimer un sort | `DELETE /api/character_sheets/{id}/spells` |
| Toggle "Préparé" | `PUT /api/character_sheets/{id}/spells` (optimiste, revert on error) |
| Lancer (consommer emplacement) | Décrémente `spellSlots` localement → sync DB via debounce |

---

## Ce qui est dans la DB mais pas encore dans l'UI

| Champ | Table | Statut |
|---|---|---|
| Alignement | `character_sheets.alignment` | Affiché dans le header (texte), non éditable |
| Historique | `character_sheets.background` | Non affiché |
| Traits de personnalité / Idéaux / Liens / Défauts | — | Pas dans le schéma |
| Points d'expérience | — | Pas dans le schéma |

---

## Patterns clés

**Auto-save :** Le deep watch sur `characterSheet` (debounce 1 s) persiste via `PUT /api/character_sheets/{id}`. Ne couvre **pas** l'inventaire, les sorts ni les emplacements — ces domaines ont leurs propres endpoints et composables.

**`useFetch` et réactivité :** `useFetch` retourne un `shallowRef`. Pour déclencher la réactivité sur une mise à jour d'élément dans un tableau, toujours réassigner `data.value` entier (ex. `.map(...)`) — ne pas muter un élément en place.

**`spellContext` (provide/inject) :** `MagicSection` fournit `{ characterLevel, spellcastingModifier }` via `provide('spellContext', ...)`. `DamageSection` et `HealSection` l'injectent pour éviter d'instancier tout l'arbre `useCharacterSheet` depuis un composant leaf.

**Fetch null-guard :** Tous les `useFetch` dans les composables de personnage retournent `null` comme URL si `characterId` est `undefined`, pour éviter des requêtes parasites quand `useCharacterSheet()` est appelé sans argument (ex. depuis la page spellbook).
