# Character Builder — Document de référence

Formulaire de création de personnage D&D 5e (2014) en 6 étapes, inspiré de l'interface de Baldur's Gate 3.
Accessible via `/characters/new`.

## Contexte technique

- **Stack** : Nuxt 4 + Vue 3 + Nuxt UI (dark, amber) + TypeScript
- **État** : `useCharacterBuilder` composable, persisté en localStorage
- **Données riches** : `app/data/character-builder.ts` (races, classes, backgrounds) — hardcodées côté frontend car la DB ne stocke pas ces infos détaillées
- **Soumission** : POST `/api/character_sheets` étendu, crée character_sheets + character_classes + character_ability_scores + character_skills + character_spells + character_inventory

---

## Architecture des fichiers

```
app/pages/characters/new.vue                   ← orchestrateur (remplace l'existant)
app/composables/useCharacterBuilder.ts         ← état global (localStorage)
app/data/character-builder.ts                  ← données riches D&D 5e
app/components/character_builder/
  BuilderShell.vue                             ← layout 3 colonnes responsive
  BuilderSidebar.vue                           ← navigation étapes avec valeur sélectionnée
  BuilderPreview.vue                           ← aperçu droit temps réel
  BuilderSummary.vue                           ← écran final avant soumission
  StepRace.vue                                 ← Étape 1
  StepClass.vue                                ← Étape 2
  StepAbilities.vue                            ← Étape 3
  StepSpells.vue                               ← Étape 4 (casters uniquement)
  StepDescription.vue                          ← Étape 5
  StepEquipment.vue                            ← Étape 6
```

---

## BuilderState — shape complet

```ts
interface BuilderState {
  // Étape 1 — Race
  raceId: string | null           // clé interne ex: 'elf', 'human'
  isVariantHuman: boolean         // true = humain variante (+1+1+compétence)
  subraceId: string | null        // ex: 'high-elf', 'hill-dwarf'
  halfElfBonuses: string[]        // 2 carac. choisies (pas CHA) ex: ['str','dex']
  variantHumanBonuses: string[]   // 2 carac. choisies (toutes 6) ex: ['int','wis']
  variantHumanSkill: string | null // compétence bonus ex: 'arcana'
  dragonAncestry: string | null   // ex: 'red', 'gold'

  // Étape 2 — Classe
  classId: string | null          // ex: 'wizard', 'fighter'
  subclass: string | null         // nom de la sous-classe ex: 'École d\'Évocation'
  skills: string[]                // compétences choisies ex: ['arcana', 'history']
  level: number                   // 1–20
  fightingStyle: string | null    // ex: 'Archerie', 'Duel'

  // Étape 3 — Caractéristiques
  abilityMethod: 'standard' | 'pointbuy' | 'roll'
  abilities: Record<string, number | null>   // scores de base AVANT bonus raciaux
  abilityAssigns: Record<string, number>     // index dans le tableau standard
  pbScores: Record<string, number>           // scores achat de points
  rolledSets: { dice: number[], total: number }[] | null

  // Étape 4 — Sorts (casters uniquement)
  selectedCantrips: number[]   // IDs de sorts (table spells en DB)
  selectedSpells: number[]

  // Étape 5 — Description
  name: string
  backgroundId: string | null  // clé interne ex: 'sage', 'criminal'
  alignment: string | null     // ex: 'lg', 'cn'
  personality: string
  ideals: string
  bonds: string
  flaws: string

  // Étape 6 — Équipement
  equipChoices: (string | null)[]  // choix par groupe d'équipement de classe
  equipment: string[]              // liste finale des noms d'items
}
```

---

## Les étapes

### Étape 1 — Race (`StepRace.vue`)

**But** : Choisir la race/espèce du personnage. Impact : bonus de carac., vitesse, traits, langues, vision dans le noir.

**Données** : `RACES` depuis `app/data/character-builder.ts`.

**UI** :
- Grille responsive de cartes races : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`
- Carte : emoji (text-4xl), nom (font-bold), bonus en amber (ex: "+2 FOR +1 CHA"), description courte
- Clic → expansion inline de la carte : traits raciaux (bullet · amber), tags vitesse/taille, vision dans le noir si applicable
- Carte sélectionnée : `border-amber-500 bg-amber-500/10`

**Section Sous-races** (apparaît si race choisie a des subraces) :
- Même grille de cartes, style compact
- Races avec subraces : Elfe (Haut-Elfe, Elfe des Bois, Drow), Nain (Nain des Collines, Nain des Montagnes), Halfelin (Pied-Léger, Robuste), Gnome (des Rochers, des Forêts)

**Cas spéciaux** :
- **Humain** : toggle "Humain classique / Humain Variante" — variante donne +1+1 à 2 carac. au choix + 1 compétence bonus parmi toutes
- **Humain Variante** : picker +1+1 (6 boutons, max 2) + select compétence bonus
- **Demi-Elfe** : picker +1+1 (5 boutons STR/DEX/CON/INT/WIS uniquement, max 2)
- **Drakéide** : picker ascendance draconique (grille 10 types), obligatoire pour valider

**Validation step** :
```ts
raceId !== null
&& (pas de sous-races || subraceId !== null)
&& (raceId !== 'half-elf' || halfElfBonuses.length === 2)
&& (raceId !== 'dragonborn' || dragonAncestry !== null)
&& (!isVariantHuman || (variantHumanBonuses.length === 2 && variantHumanSkill !== null))
```

**Sidebar** : affiche `race.name` (+ subrace si applicable) sous l'étape "Race"

**DB mapping** (`app/data/character-builder.ts`) :
```ts
// Noms exacts en DB (character_species.name) :
'high-elf'        → 'Haut-elfe'
'wood-elf'        → 'Elfe des bois'
'drow'            → null (pas en DB — ignorer ou utiliser 'Elfe des bois')
'hill-dwarf'      → 'Nain des collines'
'mountain-dwarf'  → 'Nain des montagnes'
'lightfoot'       → 'Halfelin pied-léger'
'stout'           → 'Halfelin robuste'
'human'           → 'Humain'
'variant-human'   → 'Humain'
'dragonborn'      → 'Drakéide'
'rock-gnome'      → 'Gnome des rochers'
'forest-gnome'    → 'Gnome des forêts'
'half-elf'        → 'Demi-elfe'
'half-orc'        → 'Demi-orc'
'tiefling'        → 'Tieffelin'
```

---

### Étape 2 — Classe (`StepClass.vue`)

**But** : Choisir la classe, le niveau, les compétences, le style de combat (si applicable) et la sous-classe (si niveau atteint).

**Données** : `CLASSES` depuis `app/data/character-builder.ts`.

**UI** :
- Grille 3×4 de cartes classes (emoji, nom, rôle, dé de vie, jets de sauvegarde)
- Chaque classe a une couleur propre (voir `CLASSES`)
- Après sélection de classe, afficher en dessous :
  1. **Sélecteur de niveau** (1–20, grille de boutons 4×5) avec jalons surlignés
  2. **Capacités de classe** (liste des features de départ)
  3. **Compétences** (X au choix parmi N) : toggle buttons
  4. **Style de combat** si applicable (Guerrier/Paladin/Rôdeur) : cartes radio
  5. **Sous-classe** si niveau atteint : cartes radio

**Validation step** :
```ts
classId !== null
&& skills.length === CLASSES.find(c => c.id === classId)?.skillChoices.count
&& (!hasFightingStyle || fightingStyle !== null)
```

**Sidebar** : affiche `${className} niv.${level}`

**DB mapping** : résolution par nom dans la table `classes`
```
'barbarian' → 'Barbare'
'bard'      → 'Barde'
'cleric'    → 'Clerc'
'druid'     → 'Druide'
'fighter'   → 'Guerrier'
'monk'      → 'Moine'
'paladin'   → 'Paladin'
'ranger'    → 'Rôdeur'
'rogue'     → 'Roublard'
'sorcerer'  → 'Ensorceleur'
'warlock'   → 'Occultiste'
'wizard'    → 'Magicien'
```
Sous-classes : résolution par `name` dans la table `subclasses`.

---

### Étape 3 — Caractéristiques (`StepAbilities.vue`)

**But** : Définir les 6 valeurs de carac. via 3 méthodes. Les bonus raciaux s'ajoutent automatiquement dans l'aperçu.

**UI** :
- 3 onglets : Tableau standard | Achat de points | Jet de dés
- **Tableau standard** : 6 scores cliquables (15/14/13/12/10/8) + 6 cases carac. à remplir par clic
- **Achat de points** : budget 27 pts, +/− par carac. (8–15), coût non linéaire
- **Jet de dés** : bouton "Lancer" → génère 6 sets 4d6 drop lowest, assigner comme tableau standard
- Grille 3×2 des caractéristiques : score final (base+racial), modificateur

**Validation step** :
```ts
ABILITIES.every(ab => abilities[ab] !== null)
```

**Sidebar** : affiche "Assigné ✓" ou "X/6 assignées"

---

### Étape 4 — Sorts (`StepSpells.vue`)

**But** : Choisir les sorts de départ pour les classes incantateurs.

**Affiché uniquement si** : `CLASSES.find(c => c.id === classId)?.spellcasting !== null`

**UI** :
- Bandeau stats d'incantation : DD de sort, bonus d'attaque, carac. d'incantation, emplacements par niveau
- Onglets : Sorts mineurs | Sorts connus (ou "Grimoire" pour Magicien, "Sorts préparés" pour Clerc/Druide/Paladin/Rôdeur)
- Cartes sorts : nom, école (colorée), portée, concentration/rituel, ▾ pour description
- Sélection par clic (dot amber si sélectionné)

**Validation step** :
```ts
const cantripsOk = cantripsNeeded === 0 || selectedCantrips.length >= cantripsNeeded
const spellsOk = spellsNeeded === 0 || selectedSpells.length >= spellsNeeded
cantripsOk && spellsOk
```

**Données** : API call `/api/spells?classId=X` pour récupérer les sorts filtrés par classe

**Sidebar** : affiche le nombre de sorts sélectionnés

---

### Étape 5 — Description (`StepDescription.vue`)

**But** : Donner une identité au personnage : nom, historique, alignement, traits de personnalité.

**UI** :
- **Nom** : grand input (font-size 18px, fond panel)
- **Historique** : grille 3 colonnes de cartes (nom, description courte, compétences en amber)
  - Carte sélectionnée : affiche bonus de compétences + feature de l'historique
- **Alignement** : grille 3×3 (code court LB/NB/CB…, nom complet, description)
- **Traits de personnalité** : 4 textareas (Personnalité, Idéaux, Liens, Défauts)
  - Chaque textarea a un bouton "+ Suggestions" qui affiche les suggestions de l'historique

**Validation step** :
```ts
name.trim().length >= 1 && backgroundId !== null && alignment !== null
```

**Sidebar** : affiche nom + historique

**DB mapping** : résolution historique par `name` dans la table `backgrounds`

---

### Étape 6 — Équipement (`StepEquipment.vue`)

**But** : Choisir l'équipement de départ de la classe + équipement automatique de l'historique.

**UI** :
- **Équipement de classe** : groupes de choix (option A / option B via boutons radio)
- **Équipement automatique** : items inclus sans choix (affichés grisés)
- **Équipement d'historique** : liste automatique selon historique choisi
- **Récapitulatif** : tous les items sélectionnés en chips

**Validation step** :
```ts
equipment.length > 0
```

**DB mapping** : résolution des noms d'items vers `itemId` dans la table `items` (lookup par nom). Si non trouvé, l'item est ignoré silencieusement.

**Sidebar** : affiche le nombre d'items

---

## Écran de résumé (`BuilderSummary.vue`)

Affiché après validation de l'étape 6 (bouton "Terminer").

**UI** :
- Emoji + Nom du personnage (large)
- Race · Classe niv.X · Historique · Alignement
- Grille 3×2 : PV max, CA, Vitesse, Initiative, Maîtrise, Perception passive
- Grille 6 carac. : score + mod
- Jets de sauvegarde + Compétences
- Boutons : "Créer le personnage" (POST → redirect vers fiche) + "Modifier" (retour étape)

---

## BuilderPreview — calculs live

```ts
// Bonus raciaux
const raceBonuses = computed(() => { /* from RACES data */ })

// Scores finaux
const finalAbility = (ab: string) => (state.abilities[ab] ?? 0) + (raceBonuses.value[ab] ?? 0)
const mod = (score: number) => Math.floor((score - 10) / 2)

// PV max
const hpMax = level * Math.ceil((hitDie + 1) / 2) + (level - 1) * mod(finalAbility('con')) + mod(finalAbility('con'))
// (niv 1 = max hitDie, niveaux suivants = moyenne arrondie sup)
// Formule exacte : hitDie + (level-1) * (Math.ceil(hitDie/2) + 1) + level * mod(con)

// CA sans armure
const baseAC = 10 + mod(finalAbility('dex'))

// Vitesse
const speed = subraceData?.speed ?? raceData?.speed ?? 9 // en mètres

// Bonus de maîtrise
const profBonus = Math.ceil(level / 4) + 1

// Perception passive
const passivePerception = 10 + mod(finalAbility('wis')) + (skills.includes('perception') ? profBonus : 0)
```

---

## Conventions UI (obligatoire pour tous les agents)

```css
/* Fond */
bg-(--ui-bg)          /* fond principal */
bg-(--ui-bg-elevated) /* fond panneaux */

/* Accent amber */
text-amber-400
border-amber-500/40
bg-amber-500/10

/* Carte sélectionnée */
border-amber-500 bg-amber-500/10

/* Carte non sélectionnée */
border-(--ui-border) bg-(--ui-bg-elevated)

/* Labels de section */
text-xs font-bold uppercase tracking-widest text-muted   /* min 12px */

/* INTERDIT */
text-[10px], text-[11px]  /* aucune taille < 12px */
```

**Composants Nuxt UI à utiliser** : `UCard`, `UButton`, `UBadge`, `UProgress`, `USeparator`, `UTooltip`

**Pas de `UForm`** : le builder gère son propre état et validation via computed.

**Responsive** :
- `lg:grid-cols-3` → 3 colonnes desktop/tablette landscape
- `sm:grid-cols-2` → 2 colonnes tablette portrait
- `grid-cols-1` → 1 colonne mobile

---

## Layout BuilderShell

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky, h-11)                                              │
│ ← Fiches | Création de personnage | D&D 5e 2014                   │
├─────────────┬───────────────────────────────────┬─────────────────┤
│ SIDEBAR     │ ZONE CENTRALE                      │ PREVIEW         │
│ w-48 shrink-0│ flex-1 overflow-y-auto            │ w-56 shrink-0   │
│ sticky      │                                    │ sticky          │
│             │ [slot: step content]               │                 │
│ ○ Race      │                                    │ Progression     │
│   Elfe…     │                                    │ Identité        │
│ ● Classe    │                                    │ Stats           │
│ ○ Carac.    │ ─────────────────────────────────  │ Carac.          │
│ ○ Sorts     │ ← Précédent      Suivant →         │ Compétences     │
│ ○ Descr.    │                                    │                 │
│ ○ Équip.    │                                    │                 │
└─────────────┴───────────────────────────────────┴─────────────────┘

Mobile (<lg) :
- Sidebar → pills horizontales en haut (icône + label, scroll horizontal)
- Preview → accordéon dépliable en bas (collapsed par défaut)
```

---

## Extension POST endpoint (Phase finale)

Le POST `/api/character_sheets` sera étendu pour accepter :
```ts
{
  // existant
  name: string
  speciesId?: number
  alignment?: string
  backgroundId?: number
  classes: Array<{ classId: number, level: number, isMain: boolean, subclassId?: number }>

  // nouveau
  abilityScores?: Record<string, number>        // { str: 16, dex: 14, ... } avec bonus raciaux
  skillProficiencies?: string[]                 // clés de compétences
  selectedSpellIds?: number[]                   // IDs de sorts
  inventoryItemNames?: string[]                 // noms d'items à résoudre en IDs
  fightingStyle?: string                        // texte libre pour l'instant
}
```

En transaction :
1. `character_sheets` insert
2. `character_classes` insert
3. `character_ability_scores` × 6 insert
4. `character_skills` insert (source: 'class' ou 'background')
5. `character_spells` insert (isKnown: true, isPrepared: true)
6. `character_inventory` insert (résolution nom → itemId, silently skip if not found)

---

## Lacunes DB connues

| Table | Colonnes manquantes |
|---|---|
| `character_species` | parentId, abilityBonuses, traits, darkvision — compensé par `app/data/` |
| `classes` | savingThrows, skillChoiceCount, skillChoiceOptions, armorProf, weaponProf, role, spellcastingType — compensé par `app/data/` |
| `backgrounds` | equipment JSON, suggestions personnalité/idéaux/liens/défauts — compensé par `app/data/` |
| `character_sheets` | fightingStyle — stocker comme feature à la création ou ignorer V1 |
| `character_species` | Drow (Elfe Noir) absent de la DB — mapping vers null ou 'Elfe des bois' |
