# Montée de niveau — Document de référence

Wizard de montée de niveau D&D 5e (2014). Accessible via `/characters/{id}/level-up`.

## Contexte technique

- **Page :** `app/pages/characters/[id]/level-up.vue` — layout `blank`, fetche `GET /api/character_sheets/{id}` avec les relations complètes
- **Composable :** `app/composables/useLevelUp.ts` — état global, étapes actives, validation, soumission
- **Composants :** `app/components/level_up/`
- **Shell partagé :** `app/components/wizard/WizardShell.vue` (réutilisé depuis le builder)
- **Soumission :** `POST /api/character_sheets/{id}/level-up`
- **État :** `useState('level-up-state')` (partagé entre les composants de l'étape). Il survit à la
  navigation : la page le remet à zéro à chaque ouverture (`resetWizard()` dans son setup), sinon un
  level-up abandonné déborderait sur le suivant. Chaque état vierge est une copie profonde
  d'`INIT_STATE` (`freshState()`), les étapes modifiant tableaux et objets en place. Gardé par
  `test/nuxt/levelUpReset.test.ts`.

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
  // PV gagnés (avec CON) : pas dans l'état, computed `hpGained` exposé par useLevelUp

  // Aptitudes (step features)
  newSubclassId: number | null       // DB id de la sous-classe choisie
  newSubclassName: string | null     // nom DB (pour résolution server-side)
  fightingStyle: string | null       // ex: 'Archerie'
  expertiseSkills: string[]          // clés de compétences (Roublard/Barde)
  pactBoon: 'chain' | 'blade' | 'tome' | null  // Faveur du Pacte (Occultiste niv.3)
  pactWeaponInventoryId: number | null          // ID inventaire si pactBoon='blade'
  pactBoonCantripIds: number[]                  // 3 sorts mineurs si pactBoon='tome'
  newInvocationIds: number[]                    // Manifestations occultes apprises ce level-up
  replacedInvocationId: number | null           // (Optionnel) ID d'une manifestation à remplacer

  // ASI / Don (step asi)
  asiChoice: 'asi' | 'feat' | null
  asiBonuses: Record<AbilityKey, number>  // valeurs de 0 à 2, total = 2
  featureId: number | null           // id DB du don

  // Maîtrises (step skills)
  newSkills: string[]                // compétences gagnées via multiclassage
  featLanguages: string[]            // langues du don Linguiste (step asi)
  choicePicks: Record<number, Array<string | number>> // points de choix gagnés à ce niveau (instrument du Barde rejoint)

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
- **Section B — Nouvelle classe** : grille de toutes les classes non encore prises, avec les badges de prérequis (vert = OK, rouge = insuffisant) lus dans le catalogue (colonne `classes.multiclass_prerequisites`, migration 0106). Règle (AideDD, multiclassage) : il faut ceux de la nouvelle classe **et** de chaque classe détenue — ces derniers sont rappelés dans l'encart d'aide, avec un bandeau unique s'ils ne sont pas remplis ; chaque carte affiche « Prérequis non remplis » si sa propre classe ne l'est pas. **Non bloquants** (choix produit : le MJ a le dernier mot), donc pas de validation serveur. Chaque carte liste aussi « Maîtrises : … », ce que rejoindre la classe accorde (porteur de multiclassage + nombre de compétences, `proficiencies.multiclass` et `multiclassSkillCount` du catalogue) ; le récapitulatif les reprend dans « Acquis ce niveau ».

**Validation :** `pickedClassId !== null`

**Effets sur le state :** `selectClass(classId, fromLevel)` repart d'un état vierge (`freshState()`) et n'y
écrit que les champs de classe : tous les choix en aval (PV, aptitudes, don, compétences, magie) dépendent
de la classe. Re-sélectionner la classe déjà choisie ne change rien.

---

### Étape 2 — PV (`LevelUpStepHp.vue`) — toujours active

**But :** Déterminer les PV gagnés ce niveau (modificateur CON inclus automatiquement).

**Méthodes (3 onglets) :**
- **Moyenne** : ⌈dX/2⌉ + 1 + CON — automatique, affiché en gros
- **Jet de dé** : bouton "🎲 Lancer 1dX" → `hpRolled` = random(1..hitDie) ; `hpGained` = max(1, hpRolled + conMod) — `null` tant que le dé n'est pas lancé
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
| `needsInvocations` (Occultiste gagne ≥1 invocation au level-up : niv.2/5/7/9/12/15/18) | `InvocationPicker` filtré par niveau / pacte / sorts connus |
| `canReplaceInvocation` (à chaque level-up d'occultiste mono-classe ayant ≥1 invocation) | Liste des invocations connues, sélection optionnelle pour remplacement |

Si aucune condition → affiche un résumé des aptitudes débloquées (liste informative).

**Validation :**
- `isSubclassLevel` → `newSubclassId !== null`
- `needsFightingStyle` → `fightingStyle !== null`
- `needsExpertise` → `expertiseSkills.length >= 2`
- `needsPactBoon` → `pactBoon !== null`
- Manifestations → `newInvocationIds.length === (newInvocationsCount + (replacedInvocationId ? 1 : 0))`
- Sinon → toujours valide

**Cas Pacte du Tome :** SI `pactBoon === 'tome'` → l'étape "Magie" devient requise pour choisir 3 sorts mineurs de n'importe quelle classe

**Cas remplacement de manifestation** : SI `replacedInvocationId !== null`, le picker s'agrandit d'un slot (`totalPickCount = newCount + 1`), masque les invocations déjà connues sauf celle à remplacer, et la dernière invocation choisie est traitée comme remplacement côté serveur. Côté composable `useLevelUp` : `effectivePactBoon = pickedCharClass.pactBoon ?? state.pactBoon`, `knownInvocationIds` extrait depuis `charSheet.features.feature.featureType === 'eldritch_invocation'`, `knownSpellNames` depuis `charSheet.spells.spell.name` (le GET inclut maintenant `spells` + `pactBoon` sur classes).

---

### Étape 4 — Carac. / Don (`LevelUpStepAsi.vue`) — conditionnelle

**Affiché uniquement si** `isAsiLevel` — désormais lu dans le catalogue (F2 ASI) : une progression
`asi_or_feat` par palier (owner discret, `count 1`), due au niveau d'arrivée
(`ownerLevelRequired === toLevel`), comme le style de combat. Les niveaux (défaut `[4,8,12,16,19]` ;
Guerrier `[4,6,8,12,14,16,19]` ; Roublard `[4,8,10,12,16,19]`) viennent du seed
[`server/db/seeds/data/asi.ts`](../server/db/seeds/data/asi.ts), source unique.

**But :** Choisir entre amélioration de caractéristiques (+2 répartis librement) ou un don.

**UI :**
- Choix ASI : 6 boutons +/− par caractéristique, budget total = 2 pts, max +2 par stat, cap à 20
- Choix Don : grille de cartes des `LU_FEATS` (12 dons, description courte)

**Validation :**
- `asiChoice === 'feat'` → `featureId !== null`
- `asiChoice === 'asi'` → `sum(asiBonuses) === 2`

**Note serveur :** Les ASI sont stockées dans `character_ability_score_improvements` (table dédiée), pas dans `character_ability_scores`. Le GET de la fiche les inclut via `abilityScoreImprovements`. Le composable `useLevelUp` expose dans `finalAbilities` les totaux calculés par la même couche que la fiche (`useCharacterAbilities` + `useAbilityEffectInputs` : base + espèce + dons + ASI débloquées) — prérequis de multiclassage, plafond d'ASI, PV, modificateur d'incantation.

---

### Étape 5 — Maîtrises (`LevelUpStepSkills.vue`) — conditionnelle

**Affiché uniquement si** `needsMulticlassSkills` (multiclassage dans une classe qui octroie des compétences)
ou si ce niveau de classe rend dus des points de choix de maîtrise (`newPickChoices` = `choicesGainedAtLevelUp`,
`shared/rules/resolve.ts` : porteur de multiclassage d'une classe rejointe — instrument du Barde, AideDD).
Ces choix passent par le sélecteur générique et partent en `choicePicks`.
Règle PHB 2014 ([AideDD, multiclassage](https://www.aidedd.org/regles/personnalisation/multiclassage/)) :
Barde 1 « au choix », Rôdeur et Roublard 1 « dans la liste de la classe », aucune ailleurs.

`multiclassSkills` = `multiclassSkillGrant()` (`shared/rules/multiclass.ts`, partagé avec le serveur) :
- **nombre** : colonne `classes.multiclass_skill_count` (migration 0103 + seed), lue via `/api/catalog/classes` ;
- **liste** : options de la progression `skill` de la classe (catalogue) — `all` pour le Barde.

Les compétences déjà maîtrisées (`proficientSkills`, lu dans la couche de la fiche) sont grisées.

**Validation :** `newSkills.length >= requiredMulticlassSkillPicks` (le nombre dû, plafonné aux compétences
de la liste encore non maîtrisées), et chaque point de choix de `newPickChoices` complet.

**Serveur :** `newSkills` (clés `skillEnum`, sans doublon) n'est accepté que si la classe est **nouvellement
rejointe** (déduit de `character_classes`, pas du flag client), en nombre ≤ au dû et dans la liste de la
classe. « Déjà maîtrisée » reste front-autoritaire.

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
  classId: number                   // id DB de la classe
  isMulticlass: boolean             // doit refléter la fiche : true ⇔ classe absente de character_classes
  hpGained: number                  // PV finaux (avec CON) — toujours > 0
  subclassId?: number | null
  fightingStyle?: string | null
  expertiseSkills?: SkillKey[]      // clés de SKILL_KEYS, sans doublon (Zod → 422)
  asiChoice?: 'asi' | 'feat' | null
  asiBonuses?: Record<string, number> | null
  featureId?: number | null         // don choisi (asiChoice 'feat')
  featChoices?: { ability?, spellId?, skills?, tools?, languages? } | null
  newSkills?: SkillKey[]            // multiclassage uniquement ; sans doublon (Zod → 422)
  choicePicks?: { progressionId, value? | spellId? }[]  // points de choix gagnés à ce niveau
  newCantripIds?: number[]
  newSpellIds?: number[]
  pactBoon?: 'chain' | 'blade' | 'tome' | null
  pactWeaponInventoryId?: number | null
  pactBoonCantripIds?: number[]
  newInvocationIds?: number[]
  replacedInvocationId?: number | null
  newMetamagicIds?: number[]
  arcaneMysteriumSpellId?: number | null
  bookOfAncientSecretsSpellIds?: number[]   // 2 au plus
}
```

**Opérations dans l'ordre :**
1. Charger la classe par `classId` (table `classes`) ; la sous-classe éventuelle doit lui appartenir
2. Charger les `character_classes` actuelles : le niveau atteint est **dérivé de la DB** (niveau actuel de la classe + 1, soit 1 pour une nouvelle classe), jamais du client
3. Rejeter (422) un `isMulticlass` qui contredit la fiche — `true` sur une classe déjà possédée, `false` sur une classe absente : le reste du payload a été composé pour un autre état (onglet périmé, multiclassage rejoué)
4. Upsert `character_classes` avec le nouveau niveau + subclassId + pactBoon
5. Insérer les features de classe au nouveau niveau + features de sous-classe ≤ nouveau niveau
6. Mettre à jour `character_sheets.maxHp` (+hpGained) et `currentHitDie` (+1 dé de vie)
7. Insérer les ASI dans `character_ability_score_improvements`
8. Insérer les nouveaux sorts (`isKnown: true, isPrepared: false`)
9. Gérer les effets du Pact Boon (chain → Appel de familier, tome → sorts mineurs, blade → isPactWeapon)
9b. **Sorts appris** : `learnedSpellsError` (`server/utils/spellLearning.ts`) borne les sorts choisis — liste de la classe (ou du Magicien pour
    un Chevalier occulte / Escroc arcanique), niveau de sort accessible, nombre au plus égal à ce que les tables accordent,
    Secrets magiques du Barde, écoles de la sous-classe — et `replacedSpellError` le remplacement d'un sort connu
    (`replacedSpellId`). Les emplacements se recalculent avec le type d'incantation effectif de chaque classe (sous-classe comprise).
10. **Manifestations occultes** : `applyInvocationChanges` (cf. `server/utils/invocations.ts`) — si `replacedInvocationId`, DELETE le `character_features` correspondant + purge des `character_spells` source='invocation' liés aux `spell_grant` de cette invocation. Puis INSERT des `newInvocationIds` dans `character_features`, et matérialisation des `spell_grant` en `character_spells` avec `source: 'invocation'` (idempotent via `onConflictDoNothing`).
11. Insérer les nouvelles compétences de multiclassage (validées au préalable : classe rejointe, nombre, liste)
    puis les `choicePicks` en `character_choices`, validés contre les points de choix que ce niveau de classe rend dus
    (`validateLevelUpChoicePicks`, porteur de multiclassage d'une classe rejointe compris)
12. Upserter les compétences en expertise (`proficiencyLevel: 'expert'`). Validées **avant** toute écriture (`validateLevelUpExpertise`) : au plus le delta du `count` cumulatif de la progression `expertise` entre `newLevel − 1` et `newLevel` (`expertiseGainedAtLevel`, même projection que le front), et aucune compétence déjà `expert` dans `character_skills` (toutes sources). La maîtrise préalable de la compétence reste **front-autoritaire** : la fiche permet déjà de poser `expert` à la main sur n'importe quelle compétence (`PUT /skills`), et le set maîtrisé complet n'est composé que côté front.
13. Recalculer les emplacements de sort (full=niveau, half=⌊niveau/2⌋ si ≥2, pact=séparé) — **particularité Pact Magic** : tous les emplacements occultistes sont du même niveau, et ce niveau change avec le niveau d'occultiste (niv. 3 → slots niv. 2, niv. 5 → niv. 3, etc.). Le handler DELETE explicitement les anciens `pact_magic` slots aux autres niveaux avant l'upsert, avec préservation du compteur `used` du précédent niveau.

**Retour :** `{ success: true, newLevel, hpGained }`

---

## Constantes clés dans `useLevelUp.ts`

Toutes exportées pour usage dans les composants d'étape :

```ts
// ASI, style de combat et expertise sont désormais lus dans le CATALOGUE (plus de tables front) :
//   ASI            → `isAsiLevel` / `asiDueForClassLevel` (progression asi_or_feat par palier)
//   style de combat → `needsFightingStyle` / `fightingStyleLevelFor` + endpoint /api/catalog/classes/[name]/fighting-styles
//   expertise       → `needsExpertise` / `expertiseDueForClassLevel` (count cumulatif)
//   compétences de multiclassage → `multiclassSkills` / `requiredMulticlassSkillPicks`
//   maîtrises de multiclassage   → `multiclassGainsOf` (catalogue) ; la fiche les dérive des porteurs (`classEffects`)
//   prérequis de multiclassage   → `currentClassesPrerequisites` / `meetsCurrentClassesPrerequisites` / `multiclassPrerequisitesOf` / `meetsTargetPrerequisites`
LU_FEATS                 // liste des 12 dons disponibles
```

---

## Pattern provide/inject

`level-up.vue` injecte `charSheet` via `provide('charSheet', charSheet)`.

Tous les composants d'étape l'injectent et appellent `useLevelUp(inject('charSheet') as any)`.

Le composable utilise `useState` → une seule instance du state partagée entre tous les composants.
