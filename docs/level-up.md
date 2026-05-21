# Montée de niveau — Document de référence

Wizard de montée de niveau D&D 5e (2014). Accessible via `/characters/{id}/level-up`.

## Contexte technique

- **Page :** `app/pages/characters/[id]/level-up.vue` — layout `blank`, fetche `GET /api/character_sheets/{id}` avec les relations complètes
- **Composable :** `app/composables/useLevelUp.ts` — état global, étapes actives, validation, soumission
- **Composants :** `app/components/level_up/`
- **Shell partagé :** `app/components/wizard/WizardShell.vue` (réutilisé depuis le builder)
- **Soumission :** `POST /api/character_sheets/{id}/level-up`
- **État :** `useState('level-up-state')` (partagé entre les composants de l'étape)

---

## LevelUpState — shape complet

```ts
interface LevelUpState {
  pickedClassId: string | null       // clé frontend ex: 'wizard', 'warlock'
  isMulticlass: boolean              // true = nouvelle classe (multiclassage)
  fromLevel: number                  // niveau actuel (0 si multiclasse)
  toLevel: number                    // niveau cible

  // PV
  hpMethod: 'average' | 'roll' | 'manual'
  hpRolled: number | null            // résultat du jet brut (sans CON)
  hpManual: number | null            // saisie manuelle brute (sans CON)
  hpGained: number | null            // PV gagnés final (avec CON) — calculé automatiquement

  // Aptitudes (step features)
  newSubclassId: number | null       // DB id de la sous-classe choisie
  newSubclassName: string | null     // nom DB (pour résolution server-side)
  fightingStyle: string | null       // ex: 'Archerie'
  expertiseSkills: string[]          // clés de compétences (Roublard/Barde)
  pactBoon: 'chain' | 'blade' | 'tome' | null  // Faveur du Pacte (Occultiste niv.3)
  pactWeaponInventoryId: number | null          // ID inventaire si pactBoon='blade'
  pactBoonCantripIds: number[]                  // 3 sorts mineurs si pactBoon='tome'

  // ASI / Don (step asi)
  asiChoice: 'asi' | 'feat' | null
  asiBonuses: Record<AbilityKey, number>  // valeurs de 0 à 2, total = 2
  featId: string | null              // clé frontend ex: 'lucky', 'tough'

  // Multiclassage (step skills)
  newSkills: string[]                // compétences gagnées via multiclassage

  // Magie (step spells)
  newCantripIds: number[]            // IDs sorts DB
  newSpellIds: number[]              // IDs sorts DB
}
```

---

## Les étapes

Toutes les étapes sont dans `ALL_LU_STEPS` mais certaines sont filtrées selon les conditions ci-dessous.

### Étape 1 — Classe (`LevelUpStepClass.vue`) — toujours active

**But :** Choisir la classe à monter de niveau ou prendre une nouvelle classe (multiclassage).

**UI :**
- Bandeau "État actuel" avec badge coloré par classe existante
- **Section A — Continuer une classe** : cartes par classe existante, affiche le niveau actuel → suivant, les features débloquées au prochain niveau (depuis `CLASSES.levelMilestones`), et les badges : ⚡ Sous-classe / ✦ ASI / ⚔ Style de combat / ★ Expertise
- **Section B — Nouvelle classe** : grille de toutes les classes non encore prises, avec les badges de prérequis (vert = OK, rouge = insuffisant) tirés de `LU_MULTICLASS_PREREQS`

**Validation :** `pickedClassId !== null`

**Effets sur le state :** `pickContinue` ou `pickMulticlass` reset tous les champs dépendants (subclass, fightingStyle, expertiseSkills, asi, spells)

---

### Étape 2 — PV (`LevelUpStepHp.vue`) — toujours active

**But :** Déterminer les PV gagnés ce niveau (modificateur CON inclus automatiquement).

**Méthodes (3 onglets) :**
- **Moyenne** : ⌈dX/2⌉ + 1 + CON — automatique, affiché en gros
- **Jet de dé** : bouton "🎲 Lancer 1dX" → `hpRolled` = random(1..hitDie) ; `hpGained` = max(1, hpRolled + conMod)
- **Saisie manuelle** : input brut → `hpGained` = max(1, hpManual + conMod)

**Aperçu** : si `hpGained` défini, affiche `PV max : N → N+hpGained`

**Validation :** `hpGained != null && hpGained > 0`

---

### Étape 3 — Aptitudes (`LevelUpStepFeatures.vue`) — toujours active

**But :** Gérer les aptitudes spéciales débloquées ce niveau. Le contenu est conditionnel.

**Contenu conditionnel :**

| Condition | UI affichée |
|---|---|
| `isSubclassLevel` (niveau de sous-classe atteint et pas encore de sous-classe) | Grille de sous-classes pour la classe choisie |
| `needsFightingStyle` (Guerrier niv.1/10, Paladin niv.2, Rôdeur niv.2) | Cartes radio des styles de combat |
| `needsExpertise` (Roublard niv.1/6, Barde niv.3/10) | Picker de 2 compétences parmi les compétences maîtrisées |
| `needsPactBoon` (Occultiste niv.3, sans boon existant) | Cartes radio Pacte de la Chaîne / Lame / Tome |

Si aucune condition → affiche un résumé des aptitudes débloquées (liste informative).

**Validation :**
- `isSubclassLevel` → `newSubclassId !== null`
- `needsFightingStyle` → `fightingStyle !== null`
- `needsExpertise` → `expertiseSkills.length >= 2`
- `needsPactBoon` → `pactBoon !== null`
- Sinon → toujours valide

**Cas Pacte du Tome :** SI `pactBoon === 'tome'` → l'étape "Magie" devient requise pour choisir 3 sorts mineurs de n'importe quelle classe

---

### Étape 4 — Carac. / Don (`LevelUpStepAsi.vue`) — conditionnelle

**Affiché uniquement si** `isAsiLevel` :
```ts
LU_ASI_LEVELS = {
  fighter: [4, 6, 8, 12, 14, 16, 19],
  rogue:   [4, 8, 10, 12, 16, 19],
  // toutes les autres classes :
  default: [4, 8, 12, 16, 19],
}
```

**But :** Choisir entre amélioration de caractéristiques (+2 répartis librement) ou un don.

**UI :**
- Choix ASI : 6 boutons +/− par caractéristique, budget total = 2 pts, max +2 par stat, cap à 20
- Choix Don : grille de cartes des `LU_FEATS` (12 dons, description courte)

**Validation :**
- `asiChoice === 'feat'` → `featId !== null`
- `asiChoice === 'asi'` → `sum(asiBonuses) === 2`

**Note serveur :** Les ASI sont stockées dans `character_ability_score_improvements` (table dédiée), pas dans `character_ability_scores`. Le GET de la fiche les inclut via `abilityScoreImprovements`. Le composable `useLevelUp` les accumule dans `finalAbilities` pour les prérequis de multiclassage.

---

### Étape 5 — Compétences (`LevelUpStepSkills.vue`) — conditionnelle

**Affiché uniquement si** `needsMulticlassSkills` (multiclassage dans une classe qui octroie des compétences) :
```ts
LU_MULTICLASS_SKILL_COUNT = { bard: 1, ranger: 1, rogue: 1 }
LU_MULTICLASS_SKILL_POOL  = {
  bard:   null,    // toutes les compétences
  ranger: ['animalHandling', 'athletics', 'insight', 'investigation',
           'nature', 'perception', 'stealth', 'survival'],
  rogue:  ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation',
           'investigation', 'perception', 'performance', 'persuasion',
           'sleightOfHand', 'stealth'],
}
```

**Validation :** `newSkills.length >= LU_MULTICLASS_SKILL_COUNT[classId]`

---

### Étape 6 — Magie (`LevelUpStepSpells.vue`) — conditionnelle

**Affiché si** `hasSpellcasting` :
```ts
hasSpellcasting = pickedClass.spellcasting !== null && toLevel >= spellcasting.startsAtLevel
// startsAtLevel = 1 pour les lanceurs complets, 2 pour les demi-lanceurs
```

**But :** Choisir les nouveaux sorts/sorts mineurs gagnés ce niveau (et les 3 sorts mineurs du Pacte du Tome si applicable).

**UI :**
- Bandeau stats d'incantation (DD, bonus d'attaque, emplacements au niveau cible)
- Onglets : Sorts mineurs | Sorts connus (ou Grimoire / Sorts préparés)
- Cartes sorts fetchées depuis `/api/spells?classId=X`
- Tri par école + concentration/rituel comme dans le builder

**Validation :**
- Si `pactBoon === 'tome'` → `pactBoonCantripIds.length >= 3`
- Sinon → toujours valide (les sorts sont optionnels pour les préparateurs)

---

## Écran de résumé (`LevelUpSummary.vue`)

Affiché après "Terminer" sur la dernière étape (via `showSummary = true` dans `level-up.vue`).

**UI :**
- Bandeau de niveau avec progression
- Résumé de chaque choix (classe, PV, aptitudes, ASI/don, sorts)
- Bouton "Confirmer" → `useLevelUp.submit()` → redirect vers la fiche
- Bouton "← Modifier" → `showSummary = false` (retour au wizard)

---

## LevelUpPreview (`LevelUpPreview.vue`)

Panneau de droite (ou accordéon mobile) avec les stats live du personnage **après** montée de niveau. Affiche : niveau total, PV max projeté, modificateur CON, liste des sorts mineurs/sorts connus, slots de sort au niveau cible.

---

## API `POST /api/character_sheets/{id}/level-up`

Corps :
```ts
{
  classDbName: string               // nom en DB ex: 'Guerrier', 'Occultiste'
  isMulticlass: boolean
  hpGained: number                  // PV finaux (avec CON) — toujours > 0
  subclassName?: string | null      // nom DB de la sous-classe
  fightingStyle?: string | null
  expertiseSkills?: string[]
  asiChoice?: 'asi' | 'feat' | null
  asiBonuses?: Record<string, number> | null
  featId?: string | null
  newSkills?: string[]
  newCantripIds?: number[]
  newSpellIds?: number[]
  pactBoon?: 'chain' | 'blade' | 'tome' | null
  pactWeaponInventoryId?: number | null
  pactBoonCantripIds?: number[]
}
```

**Opérations dans l'ordre :**
1. Résoudre la classe par `classDbName` (table `classes`)
2. Résoudre la sous-classe par nom (table `subclasses`, match case-insensitive)
3. Charger les `character_classes` actuelles
4. Upsert `character_classes` avec le nouveau niveau + subclassId + pactBoon
5. Insérer les features de classe au nouveau niveau + features de sous-classe ≤ nouveau niveau
6. Mettre à jour `character_sheets.maxHp` (+hpGained) et `currentHitDie` (+1 dé de vie)
7. Insérer les ASI dans `character_ability_score_improvements`
8. Insérer les nouveaux sorts (`isKnown: true, isPrepared: false`)
9. Gérer les effets du Pact Boon (chain → Appel de familier, tome → sorts mineurs, blade → isPactWeapon)
10. Insérer les nouvelles compétences de multiclassage
11. Upserter les compétences en expertise (`proficiencyLevel: 'expert'`)
12. Recalculer et upserter les emplacements de sort (formule multiclasse combinée : full=niveau, half=⌊niveau/2⌋ si ≥2, pact=séparé)

**Retour :** `{ success: true, newLevel, hpGained }`

---

## Constantes clés dans `useLevelUp.ts`

Toutes exportées pour usage dans les composants d'étape :

```ts
LU_ASI_LEVELS           // niveaux ASI par classe
LU_FIGHTING_STYLE_LEVELS // niveaux de style de combat par classe
LU_EXPERTISE_LEVELS      // niveaux d'expertise (Roublard/Barde)
LU_MULTICLASS_PREREQS    // prérequis de carac. pour multiclassage
LU_MULTICLASS_SKILL_POOL // pool de compétences disponibles par multiclassage
LU_MULTICLASS_SKILL_COUNT // nombre de compétences octroyées par multiclassage
LU_MULTICLASS_PROFICIENCIES // maîtrises octroyées par multiclassage (informatif)
LU_FEATS                 // liste des 12 dons disponibles
```

---

## Pattern provide/inject

`level-up.vue` injecte `charSheet` via `provide('charSheet', charSheet)`.

Tous les composants d'étape l'injectent et appellent `useLevelUp(inject('charSheet') as any)`.

Le composable utilise `useState` → une seule instance du state partagée entre tous les composants.
