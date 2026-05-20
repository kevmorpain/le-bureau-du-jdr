# Fiche de personnage — sections et données

Page : `app/pages/characters/[id].vue`

La fiche charge le personnage via `GET /api/character_sheets/{id}` (include toutes les relations Drizzle sauf les sorts). Un deep watch avec debounce 1 s persiste les changements via `PUT /api/character_sheets/{id}`. Les sections qui font leurs propres fetches (inventaire, sorts) ont leurs propres composables.

---

## Mise en page

La page utilise un **dashboard 3 colonnes** (`dashboard-grid`) :

| Colonne gauche (240px) | Colonne centrale (flex) | Colonne droite (240px) |
|---|---|---|
| `AbilityScoresSection` | `QuickStatsSection` | `HitPointsSection` |
| `ProficienciesSection` | `CombatModeSection` *(combat only)* | `DeathSavingThrowSection` |
| | | `HitDiceSection` |
| | `ClassFeaturesSection` | `DefensesSection` |
| | `MagicSection` | `StatusSection` |
| | `InventorySection` | `SpellSlotsSection` |
| | `SpeciesTraitsSection` + `BackgroundSection` | `ConcentrationSection` |
| | | `QuickNotesSection` |

La plupart des sections de la colonne centrale sont enveloppées dans `CollapsibleSection` (état persisté en localStorage via `storage-key`). En-tête fixe : `DashboardHeaderSection`.

---

## En-tête (`DashboardHeaderSection`)

Barre sticky sous la nav principale. Affiche :
- Nom du personnage + niveau total
- Description courte : espèce · historique · classe(s) avec niveaux
- Conditions actives (badges cliquables pour les retirer)

**Boutons d'action :**
- **Repos court** / **Repos long** → `useRest` → `POST /api/character_sheets/{id}/rest`
  - Repos court : recharge les aptitudes `rechargeType: 'short_rest'`
  - Repos long : recharge tout + restaure les PV max + recharge les emplacements de sort
- **Mode Combat** : toggle local `combatMode`. À l'activation, lance automatiquement l'initiative. Affiche/masque `CombatModeSection`.

---

## Colonne gauche

### Caractéristiques (`AbilityScoresSection`)

Affiche les 6 scores (FOR/DEX/CON/INT/SAG/CHA) avec :
- Score de base (éditable) + bonus d'espèce (automatique depuis les effets)
- Modificateur calculé
- Jets de sauvegarde (maîtrise depuis `character_ability_scores`)
- Compétences regroupées par caractéristique (maîtrise + expertise depuis `character_skills`)

**Source :** `character_ability_scores` pour les scores de base, effets d'espèce/classe pour les bonus, `character_skills` pour les maîtrises.
**Persistence :** `v-model` → deep watch → PUT.

### Maîtrises (`ProficienciesSection`)

Maîtrises d'armes, d'armures, de langues et d'outils.

**Source :** Calculé depuis `allEffects` (effets d'espèce + classe + inventaire) + `character_proficiency_overrides` (ajouts/retraits manuels).
**API overrides :** `GET/PUT/DELETE /api/character_sheets/{id}/proficiency-overrides`

---

## Colonne centrale

### Statistiques (`QuickStatsSection`)

Bandeau horizontal compact avec 6 StatCards :
- **CA** : computed depuis armure équipée + modificateur DEX + bouclier + effets magiques (tooltip avec détail)
- **Initiative** : modificateur DEX ± effets (clic → lancer le dé)
- **Vitesse** : espèce + conditions (entrave, paralysie…) en mètres (tooltip en cases)
- **Perception passive** : 10 + modificateur Perception
- **Maîtrise** : bonus de maîtrise purement computed depuis le niveau total
- **Inspiration** : toggle `character_sheets.inspiration` (v-model → deep watch)

**Persistence :** Inspiration via deep watch → PUT. Tout le reste est computed, non stocké.

### Mode Combat (`CombatModeSection`) *(affiché uniquement si `combatMode` actif)*

Section de gestion du tour de combat :
- **Économie d'action** : boutons Action / Bonus / Réaction (toggle barré/disponible), reset à chaque nouveau tour
- **Déplacement** : jauge de progression, boutons +1,5m / −1,5m / reset, affichage mètres restants
- **Actions disponibles** : armes équipées (boutons Attaque + Dégâts), aptitudes de classe avec type d'action, sorts préparés

État local (non persisté), remis à zéro via "Nouveau tour".

> Les stats détaillées des armes (attaque, dégâts, propriétés, warnings, toggle "à 2 mains" pour versatile, bouton main secondaire pour les armes légères) sont affichées dans `InventorySection` (onglet Armes). `CombatModeSection` reprend les boutons d'action en compact pour le tour en cours.

### Capacités de classe (`ClassFeaturesSection`)

Liste les aptitudes de classe actives avec compteur d'utilisations. Badge dans le titre = nombre d'aptitudes disponibles (uses restantes).

**Source :** `character_sheets.features` (chargé dans le GET principal).
**Persistence des utilisations :** `PUT /api/character_sheets/{id}/features` (via deep watch).

### Magie (`MagicSection`)

Section unifiée : stats d'incantation + liste des sorts.

#### Stats d'incantation
- Caractéristique d'incantation (sélectable, surcharge `character_classes.spellcastingAbility`)
- DD de sauvegarde : 8 + bonus de maîtrise + modificateur
- Bonus d'attaque avec un sort : bonus de maîtrise + modificateur

#### Liste des sorts
Sorts groupés par niveau. Chaque ligne affiche : nom, temps d'incantation, portée, durée, DC (si applicable), concentration, rituel, composantes V/S/M, dégâts/soins calculés avec le vrai modificateur du personnage.

**API :** `GET /api/character_sheets/{id}/spells` (fetch séparé — **non inclus** dans le GET principal).

**Filtres :** "Préparés seulement" / "Disponibles seulement" (état local, non persisté).

**Avertissement somatique :** si la condition `incapacitated` est active, les sorts avec composante S sont grisés.

#### Actions
| Action | API |
|---|---|
| Ajouter un sort | `PUT /api/character_sheets/{id}/spells` |
| Supprimer un sort | `DELETE /api/character_sheets/{id}/spells` |
| Toggle "Préparé" | `PUT /api/character_sheets/{id}/spells` (optimiste, revert on error) |
| Lancer (consommer emplacement) | Décrémente `spellSlots` localement → sync DB via debounce |

Badge dans le titre = nombre de sorts préparés.

### Inventaire (`InventorySection`)

Liste tous les objets du personnage avec quantité, état équipé, bonus magique, notes. Intègre `CurrencySection` (pièces pp/po/pe/pa/pc, source : `character_sheets.*`, persistence : deep watch → PUT).

**API :** `GET /api/character_sheets/{id}/inventory` (fetch séparé, indépendant du deep watch).
**Ajout :** `AddItemSlideover` → `POST /api/character_sheets/{id}/inventory`
**Équiper/déséquiper :** `PUT /api/character_sheets/{id}/inventory/{entryId}`
**Supprimer :** `DELETE /api/character_sheets/{id}/inventory/{entryId}`

Les effets magiques des objets équipés (`character_inventory.magicEffects`) sont injectés dans `allEffects` et peuvent modifier CA, résistances, vitesse, etc.

### Espèce & Historique

Section collapsible qui regroupe `SpeciesTraitsSection` + `BackgroundSection`.

**`SpeciesTraitsSection`** : liste les aptitudes passives de l'espèce (ex. Vision dans le noir, Résistance draconique).
**Source :** `character_sheets.species.speciesFeatures` (chargé dans le GET principal via relations Drizzle imbriquées).

**`BackgroundSection`** : affiche l'historique sélectionné (nom, maîtrises de compétences, capacité via accordion) et les champs de description du personnage (traits de personnalité, idéaux, liens, défauts — via `useCharacterBackground`).
**Source :** `character_sheets.background` + champs libres dans `useCharacterBackground`.
**Édition :** bouton `EditBackgroundSection`.

---

## Colonne droite

### PV (`HitPointsSection`)

PV actuels / PV max / PV temporaires.
**Source :** `character_sheets.{currentHp, maxHp, temporaryHp}`.
**Persistence :** `v-model` → deep watch.

### Jets de mort (`DeathSavingThrowSection`)

Jets de sauvegarde contre la mort (succès/échecs). Bouton "Récupérer" qui restaure 1 PV.
**Source :** `useStorage()` (localStorage).

### Dés de vie (`HitDiceSection`)

Dés de vie restants par classe, utilisation pendant un repos court.
**Source :** `character_sheets.currentHitDie` (JSON).
**Persistence :** deep watch → PUT.

### Résistances & Défenses (`DefensesSection`)

Résistances, immunités, vulnérabilités calculées depuis `allEffects`. Visible uniquement si au moins une entrée. Affiche aussi le sélecteur d'ascendance draconique si la feature `hasDraconicAncestry` est active.

**Source :** `allEffects` (effets d'espèce + classe + inventaire).

### Conditions (`StatusSection`)

Conditions actives, épuisement, alignement. Toggle de chaque condition.
**Source :** conditions via `useStorage()` (localStorage).

### Emplacements de sort (`SpellSlotsSection`)

Bulles interactives par niveau de sort. Visible uniquement si le personnage a des emplacements.

**Source :** `inject('spellSlots')` — injecté depuis `[id].vue` via `provide('spellSlots', spellSlots)`.
Affiche aussi DD de sauvegarde et bonus d'attaque de sort.
**Sync DB :** debounce 500 ms via `useCharacterSpellcasting`.

### Concentration (`ConcentrationSection`)

Visible uniquement si la condition `concentrating` est active. Permet de noter le nom du sort concentré (localStorage) et de rompre la concentration.

**Source :** condition `concentrating` (localStorage) + `localStorage.getItem('cs-concentration-spell')`.

### Notes de session (`QuickNotesSection`)

Zone de texte libre pour notes rapides (PNJ rencontrés, rappels…). Non lié à un personnage.
**Source :** `localStorage.getItem('cs-quick-notes')`.

---

## Patterns clés

**Auto-save :** Le deep watch sur `characterSheet` (debounce 1 s) persiste via `PUT /api/character_sheets/{id}`. Ne couvre **pas** l'inventaire, les sorts ni les emplacements — ces domaines ont leurs propres endpoints et composables.

**`spellSlots` (provide/inject) :** `[id].vue` fournit `spellSlots` via `provide('spellSlots', spellSlots)`. `SpellSlotsSection` l'injecte pour afficher et modifier les emplacements sans passer par tout l'arbre de props.

**`spellContext` (provide/inject) :** `MagicSection` fournit `{ characterLevel, spellcastingModifier }` via `provide('spellContext', ...)`. `DamageSection` et `HealSection` l'injectent pour éviter d'instancier tout l'arbre `useCharacterSheet` depuis un composant leaf.

**`useFetch` et réactivité :** `useFetch` retourne un `shallowRef`. Pour déclencher la réactivité sur une mise à jour d'élément dans un tableau, toujours réassigner `data.value` entier (ex. `.map(...)`) — ne pas muter un élément en place.

**Fetch null-guard :** Tous les `useFetch` dans les composables de personnage retournent `null` comme URL si `characterId` est `undefined`, pour éviter des requêtes parasites quand `useCharacterSheet()` est appelé sans argument (ex. depuis la page spellbook).

**`CollapsibleSection` :** Enveloppe les sections de la colonne centrale. L'état ouvert/fermé est persisté en localStorage via `storage-key`.

---

## Ce qui est dans la DB mais pas encore dans l'UI

| Champ | Table | Statut |
|---|---|---|
| Points d'expérience | — | Pas dans le schéma |
