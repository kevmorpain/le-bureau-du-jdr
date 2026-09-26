# Audit de complétude des parcours — bugs 2014 non tracés

> Registre **parallèle** à la roadmap ([`dnd-5.5.md`](./dnd-5.5.md)). La Phase 1 est un refactor
> **iso-comportement** (contrat d'équivalence, [D12](./decisions.md#d12)/[D13](./decisions.md#d13)) :
> elle **préserve** le comportement 2014 existant, **bugs compris**. Les tests d'équivalence
> affirment « identique à avant » — ils **reconduisent donc silencieusement** tout bug préexistant.
> Les audits déjà faits (aidedd, [`architecture-audit.md`](./architecture-audit.md)) portaient sur
> la **fidélité des données/nommage**, pas sur la **complétude des parcours** (création à haut
> niveau, level-up multi-paliers). Ce fichier trace cette classe d'angle mort et les bugs qu'elle
> recèle. **Ces correctifs ne relèvent NI de la Phase 1 (iso-comportement) NI de la Phase 2
> (contenu 5.5)** : ce sont des chantiers de correction 2014 à part entière.
>
> **Registre jumeau** : [`fonctionnalites-manquantes.md`](./fonctionnalites-manquantes.md) trace
> ce qui **n'existe pas** (effets seedés jamais appliqués, capacités sans mécanique, règles
> absentes). Ici, le comportement existe et il est **faux** ; là-bas, il est **absent**.

## Classe de risque

« Choix qui se **répètent par palier de niveau**, où la CRÉATION à un niveau élevé doit
configurer **plusieurs** instances (ou refléter les instances déjà appliquées), mais le flux a
été écrit en supposant une seule instance / le palier exact. » Invisible aux tests d'équivalence
(qui figent le comportement) **et** aux audits de contenu (qui vérifient les données). Seul un
test **fonctionnel** les révèle.

## Bugs identifiés

### B1 — Arcanums mystiques non cumulatifs (Occultiste) · front + serveur — ✅ RÉSOLU
- **Symptôme** : créer un occultiste à un niveau ≠ 11/13/15/17 (12, 14, 15–20…) n'affiche aucun
  sélecteur d'arcanum ; à un niveau de palier, un seul arcanum, jamais les précédents (à 13, pas
  d'accès à l'arcanum niv. 6 débloqué à 11). La fiche, elle, supporte les 4 (`arcanum_6/7/8/9`).
- **Racine front** : `BuilderState.arcaneMysteriumSpellId: number | null` (**singulier**) + un seul
  sélecteur affiché pour l'arcanum du niveau EXACT (`app/composables/useCharacterBuilder.ts`,
  `app/components/character_builder/StepSpells.vue`).
- **Racine serveur** : `server/utils/characterCreate.ts` n'accepte qu'un `arcaneMysteriumSpellId`
  et mappe la source via `ARCANUM_LEVEL_TO_SOURCE[<niveau du perso>]` → `undefined` hors
  11/13/15/17 (rien stocké). Idem `characterLevelUp.ts`.
- **Correctif** : état front `arcaneMysteriumSpellIds: Record<niveauSort, spellId>` (multi) ;
  `arcaneMysteriumSpellLevels[]` dérivé de **tous** les points de choix `spell` du catalogue
  (`resolveChoices` gate déjà `classLevel ≥ ownerLevelRequired`) ; UI `StepSpells` en **boucle**
  (un bloc par palier débloqué) ; payload `arcaneMysteria: [{spellLevel, spellId}]` ; serveur
  `characterCreate` valide chaque arcanum contre la choice de **même `maxLevel`** (V5, rejette un
  palier non débloqué ou un sort hors-niveau) et écrit la source par niveau de **sort**
  (`ARCANUM_SPELL_LEVEL_TO_SOURCE`), non plus par niveau du perso.
- **Le level-up était déjà correct** (mono-palier : `ARCANUM_LEVEL_TO_SOURCE[newLevel]` mappe le
  palier tout juste atteint) → laissé intact. **Aucune migration** (`character_spells.source`
  accepte déjà `arcanum_6..9`).
- Découvert : vérif visuelle du lot 6b (2026-08-02). **✅ RÉSOLU** ; tests dans
  `test/nuxt/createCharacter.test.ts` (arcanums cumulatifs niv. 17 + rejets palier/sort illégaux).

### B2 — Base d'ASI non cumulative entre paliers (création) · front (affichage)
- **Symptôme** : avec ≥2 paliers d'ASI à la création (ex. niv. 4 et 8), chaque palier affiche la
  base de CRÉATION comme « avant », sans refléter les ASI des paliers précédents. Ex. CHA 15,
  +2 au niv. 4 (affiche 15→17), puis niv. 8 affiche encore « 15 » au lieu de 17.
- **Racine** : `app/components/character_builder/StepAsi.vue` `baseScore(ab)` (l.214) renvoie
  `abilities[ab] + raceBonuses[ab]` (base de création), utilisé comme « avant » de **chaque**
  palier. Le cap à 20 (`finalAfterAsi`, l.232) est, lui, cumulatif-correct → **le score final est
  bon** ; seul l'**affichage intermédiaire** par palier est trompeur.
- **Fix** : chaque palier affiche le **total final** — `base (+ASI des autres paliers) +ce palier → total`
  — la contribution du palier courant restant distincte (`otherAsiBonus()` + `finalAfterAsi()`).
- Découvert : signalé par l'utilisateur (2026-08-02). **✅ RÉSOLU**.

### B3 — Coup agonisant : mod de CHA recalculé sans le bonus d'espèce · front (calcul)
- **Symptôme** : Décharge occulte avec Coup agonisant applique **+CHA de base+ASI** aux dégâts, en
  omettant le bonus d'**espèce**. Ex. niv. 12, CHA 20 (via espèce +2) : to-hit **+9** et DD **17**
  (corrects, mod +5) mais dégâts par rayon **+4** au lieu de +5.
- **Racine** : `app/components/character_sheet/MagicSection.vue` `charismaModifier` (l.721) reconstruit
  le mod à la main = `floor((baseAbilityScores.cha + Σ ASI − 10) / 2)` → **omet les bonus d'espèce et
  d'effets**. Le to-hit/DD, eux, utilisent le mod **canonique** `abilityModifiers['cha']`.
- **Fix** : utiliser le mod canonique (`abilityModifiers.cha`). **✅ RÉSOLU.**
- Découvert : vérif visuelle 6b (2026-08-02, utilisateur).

### B4 — Bonus de caractéristique des DONS non appliqués (création) · front (calcul) — ✅ RÉSOLU
- **Symptôme** : un demi-don (Vigueur, Résilient…) pris comme don bonus ou à un palier d'ASI, qui
  accorde un bonus de carac., n'était reflété ni dans l'**Aperçu** (ni PV/CA/mods dérivés) ni dans les
  **paliers d'ASI suivants** du builder.
- **Racine** : `app/composables/useCharacterBuilder.ts` `finalAbilities` = `min(20, base + racial + ASI)`,
  qui **omettait les bonus de dons** ; `StepAsi.vue` (`baseScore`/`otherAsiBonus`/`finalAfterAsi`) idem.
- **Correctif** : nouveau `featBonusByAbility` (somme des effets `ability_increase` fixes +
  `ability_increase_choice` résolu via `featChoices`, sur le don bonus ET les dons d'ASI), replié dans
  `finalAbilities` et dans l'affichage par palier de `StepAsi`. La fiche appliquait déjà `ability_increase`
  (via `featureEffects`, `useCharacterAbilities`) → cohérence création ⟺ fiche.
- Découvert : vérif visuelle 6b (2026-08-02). **✅ RÉSOLU.**

### B5 — pas de jet d20 « pour toucher » pour les sorts d'attaque · front (feature) — ✅ RÉSOLU
Lancer un sort ne jetait que **dégâts / soins** ; **aucun jet d20 + bonus d'attaque** n'existait
(le « Bonus d'attaque » de l'en-tête n'était qu'un affichage). Ajout d'un bouton **Attaque** pour
les sorts à jet pour toucher (dégâts **sans `dc`**) : `rollSpellAttack` jette `d20 + bonus d'attaque
de sort`, **un par attaque** (un par rayon pour les multi-attaques comme la Décharge occulte).

### B6 — Aperçu des emplacements au level-up = mono-classe · front (affichage) — ✅ RÉSOLU
- **Symptôme** : au level-up, l'aperçu « avant → après » des emplacements de sorts était faux pour un
  personnage à **deux classes lanceuses** (ex. Magicien/Clerc) : il ne reflétait que la classe montée,
  pas le total combiné du multiclassage.
- **Racine** : `app/components/level_up/LevelUpStepSpells.vue` calculait `oldSlots`/`newSlots`
  via `spellSlotsAtLevel(casterType, fromLevel/toLevel)` — la table d'**une seule** classe. La **fiche**,
  elle, est correcte : le serveur stocke le total combiné via `combinedSpellSlots` (`shared/rules/spellSlots.ts`,
  depuis le lot 5d).
- **Correctif** : `oldSlots`/`newSlots` passent par `combinedSpellSlots` sur **toutes** les classes
  lanceuses du perso (le pool affiché suit la classe montée : régulier vs pacte). Mono-classe →
  résultat **identique à avant** (zéro régression).
- Découvert : audit du lot 6c (2026-08-02). **✅ RÉSOLU.**

### B7 — Désavantage « arme lourde + petite taille » jamais déclenché · front (calcul) — ✅ RÉSOLU
- **Symptôme** : un Halfelin ou un Gnome (taille Petite) maniant une arme **lourde** (épée à deux
  mains, arbalète lourde…) n'affichait aucun avertissement de désavantage (PHB 2014 p. 147).
- **Racine** : `app/composables/character/useCharacterInventory.ts` comparait
  `species.size` aux abréviations **françaises** `'P'`/`'TP'`, alors que la colonne stocke les codes
  de l'enum `CreatureSize` (`'S'`/`'T'`, cf. `server/db/schema/character_species.ts` et les seeds).
  La condition était donc toujours fausse — un test n'existait pas, la donnée n'étant affichée nulle part.
- **Correctif** : codes et libellés séparés dans `shared/rules/creatureSize.ts`
  (`hasHeavyWeaponDisadvantage`, `creatureSizeLabel`), consommés par le composable ET par la
  section Identité (qui affiche enfin la catégorie de taille). Tests : `test/unit/creatureSize.test.ts`
  (libellés ⟺ enum, toutes les espèces seedées portent un code connu, `'P'` n'est plus un code).
- Découvert : câblage du lot 2 « données en DB mais invisibles » (2026-09-07). **✅ RÉSOLU.**

### B8 — Bonus d'espèce AU CHOIX perdus à la création (Fadette) · front (payload) — ✅ RÉSOLU
- **Symptôme** : créer une Fadette, répartir ses bonus flexibles (+2/+1 ou +1/+1/+1) — le builder
  les affiche jusqu'au récapitulatif, la fiche créée porte les scores **sans** ces bonus.
- **Racine** : `app/pages/characters/new.vue` ne pliait dans `abilityScores` que les choix
  **Demi-elfe** et **Humain variant** ; `state.fairyAsiBonuses` ne quittait jamais le client. La
  Fadette n'a — volontairement — aucun effet `ability_increase` fixe
  (`server/db/seeds/data/character_species.ts`, trait « Augmentation de caractéristiques ») : rien
  côté serveur ne pouvait re-dériver le bonus. L'**affiché** (`raceBonuses` de
  `useCharacterBuilder`) et l'**enregistré** (payload) étaient deux listes de cas particuliers
  distinctes — ajouter une espèce à bonus au choix n'en touchait qu'une.
- **Correctif** : source unique `app/utils/raceAbilityBonuses.ts` (`chosenRaceAbilityBonuses`),
  consommée par `raceBonuses` **et** par le payload de création. Test :
  `test/unit/raceAbilityBonuses.test.ts`.
- **Portée** : correctif pour les créations **suivantes** ; les fiches déjà créées gardent leurs
  scores erronés (à corriger via l'édition des caractéristiques sur la fiche).
- **Dette assumée** : le modèle propre — point de choix composite `ability_scores` +
  `character_choices` — existe **côté serveur** (`server/utils/abilityScoreDerivation.ts`,
  validation V7 de `server/utils/characterCreate.ts`) mais reste non câblé au front
  (`originAbilityBonuses` est renvoyé par le GET fiche sans aucun consommateur dans `app/`, et
  aucune progression `ability_scores` n'est seedée). Le brancher n'est **pas** un chantier isolé :
  c'est un wagon de l'un des deux lots qui produiront la même brique — **F2 · ASI/expertise**
  ([`consolidation-2014.md`](./consolidation-2014.md), « options front à repointer sur le même
  patron ») ou le **lot historiques 5.5** ([`dnd-5.5.md`](./dnd-5.5.md) : « Historiques → triade
  (`progression` `kind:'ability_scores'`) »), qui devra de toute façon seeder ce `kind`, rendre un
  sélecteur de répartition et afficher le bonus dérivé sur la fiche. D'ici là, le pliage dans les
  scores stockés reste le patron 2014 des autres bonus au choix.
- Découvert : signalé par l'utilisateur (2026-09-16). **✅ RÉSOLU.**

### B9 — Picker d'expertise vide au level-up (compétences dérivées ignorées) · front — ✅ RÉSOLU
- **Symptôme** : un Roublard ou un Barde créé après la dérivation des compétences (F3) arrive à son
  palier d'expertise (Roublard 6, Barde 3/10) avec un picker **vide** ou presque, et l'étape
  « Aptitudes » reste bloquée (2 choix exigés). Même classe d'erreur, sans blocage : l'étape
  « Compétences » du multiclassage ne marquait pas « déjà maîtrisé » une compétence dérivée.
- **Racine** : `app/composables/useLevelUp.ts` reconstruisait les maîtrises à partir de
  `character_skills` seul, qui ne porte plus que les overrides et l'expertise. Un Roublard 5 créé
  par le serveur n'y a que ses 2 lignes `expert` → éligibles = maîtrisées − expertes = ∅. Les
  octrois d'espèce (Sens aiguisés → Perception), d'invocation (Présence captivante) et de don
  (Doué) manquaient aussi, y compris dans la rustine `ownedSkills` du picker Doué.
- **Correctif** : le level-up lit les maîtrises dans la **même couche que la fiche**
  (`useCharacterAbilities`), alimentée par `useAbilityEffectInputs` (`useCharacterSheet.ts`) : les
  entrées « effets » dérivées du payload GET, désormais partagées par la fiche, le level-up et la
  lentille de sorts (`useSpellLens`, qui en portait une troisième copie). `ownedSkills` disparaît
  (`proficientSkills` est complet) ; l'éligibilité d'expertise vit dans le composable.
- **Serveur** : rien à changer ici — `expertiseWriteStmts` upserte une ligne `expert` sans exiger de
  ligne `proficient` préalable. La validation (delta dû, clés connues, pas déjà experte) est arrivée
  séparément (#91, `validateLevelUpExpertise`) ; la maîtrise préalable y reste front-autoritaire, donc
  couverte par ce correctif.
- **Tests** : `test/nuxt/levelUpSheetDerivation.test.ts` — Roublard 5 créé par le vrai chemin
  serveur, octrois espèce/invocation/don, et **contrat d'équivalence** fiche ⟺ level-up compétence
  par compétence (vérifié : échoue sur le code d'avant).
- **Au passage** : le récapitulatif (`LevelUpSummary.vue`) affichait les clés brutes des expertises
  (« deception, perception ») → libellés.
- Découvert : relecture du code après F3 (2026-09-23), confirmé par test. **✅ RÉSOLU.**

### B10 — Caractéristiques du level-up sans bonus d'espèce ni de don · front (calcul) — ✅ RÉSOLU
- **Symptôme** : au level-up, les caractéristiques ignorent les bonus d'espèce **fixes** et ceux des
  dons. Nain des collines (CON stockée 14, +2 d'espèce) : le level-up calcule CON 14 / mod +2, la
  fiche CON 16 / mod +3 (mesuré en test). Touche le **gain de PV** (valeur persistée), les
  prérequis de multiclassage, l'« avant » des ASI et les modificateurs de sorts du wizard.
- **Racine** : `app/composables/useLevelUp.ts` `finalAbilities` = base stockée + ASI. Or le stocké
  n'inclut que les bonus d'espèce **au choix** (`app/pages/characters/new.vue`, pliage) ; les bonus
  fixes et de dons viennent des effets, que seule la fiche appliquait. Même famille que B3/B4.
- **Correctif** : `finalAbilities` = totaux `abilityScores` de la couche abilities, déjà instanciée
  par B9. Tous ses consommateurs le lisaient comme « score total actuel » (PV, prérequis de
  multiclassage, plafond à 20 de l'étape ASI, aperçu/récapitulatif, modificateur d'incantation) :
  aucun n'a eu à changer.
- **Tests** : `test/nuxt/levelUpSheetDerivation.test.ts` — nain des collines (CON, mod, PV moyens) et
  contrat d'équivalence fiche ⟺ level-up sur les six caractéristiques (espèce, demi-don, ASI, palier
  non atteint) ; échouent sur le code d'avant.
- **Hors périmètre** : les choix **du palier en cours** (ASI, demi-don) ne rejaillissent pas sur le mod
  de CON des PV gagnés ni, pour le demi-don, sur l'aperçu « après » — règle des PV rétroactifs à
  sourcer avant d'y toucher.
- Découvert : délimitation du périmètre de B9 (2026-09-23). **✅ RÉSOLU.**

### B11 — Multiclasser vers un lanceur ne propose aucun sort · front (calcul) — ✅ RÉSOLU
- **Symptôme** : au level-up, prendre un 1er niveau d'une classe lanceuse (ex. Guerrier 3 →
  Occultiste 1) n'offrait ni sort mineur ni sort connu — l'étape Magie affichait seulement
  « Emplacements mis à jour ».
- **Racine** : `LevelUpStepSpells.vue` calculait le dû comme `TABLE[toLevel - 1] − TABLE[Math.max(0,
  fromLevel - 1)]`. En multiclasse `fromLevel = 0` (`LevelUpStepClass.vue`), le `Math.max` relisait la
  valeur du **niveau 1** → delta nul. Défauts voisins du même composant : grimoire toujours à 2 (il en
  faut 6 au niveau 1 de Magicien), niveau des sorts proposés tiré des emplacements **combinés** (un
  Clerc 5 → Magicien 1 se voyait proposer des sorts de niveau 3), « Avant » forcé à vide en
  multiclasse, aucun choix exigé par la validation. Données : le **Rôdeur 2014 connaît** ses sorts
  (AideDD) mais était codé « préparé » → jamais de sort à choisir, même en mono-classe ; Occultiste
  niveau 18 = 15 sorts connus au lieu de 14.
- **Règle** (AideDD, multiclassage) : sorts connus et préparés déterminés **classe par classe**, comme
  un mono-classé — seul le niveau **dans la classe** compte (exemple rôdeur 4/magicien 3).
- **Correctif** : source unique `shared/rules/spellsKnown.ts` (tables, mode connus/préparés/grimoire,
  `spellsLearnedOnLevelUp`) consommée par le level-up **et** le builder ; `useLevelUp` porte le dû, le
  niveau max (`maxSpellLevelForLevel` de la classe) et la validation, plafonnée aux candidats encore
  inconnus du catalogue (un catalogue incomplet — 4 sorts mineurs de Clerc seedés — ne bloque pas).
  Tests : `test/unit/spellsKnown.test.ts`, `test/nuxt/levelUpSpells.test.ts` (composant monté).
- **Hors périmètre, à suivre** : aucune validation **serveur** des sorts (nombre, liste de classe,
  niveau) ni à la création ni au level-up ; `character_spells` ne rattache pas un sort à sa classe
  (la fiche choisit une classe lanceuse « active ») ; pas de **remplacement** d'un sort connu au
  level-up ; le **builder** compte le grimoire du Magicien comme des sorts préparés (mod + niveau au
  lieu de 6 + 2/niveau) ; lanceurs de tiers (Chevalier occulte, Filou ésotérique) sans étape Magie.
- Découvert : signalé par l'utilisateur (2026-09-23). **✅ RÉSOLU.**

## Suspects à vérifier (audit non encore fait)
- Level-up en **multiclasse** hors sorts (flux de choix, résolution d'IDs de classe) — sorts : B11.
- Invocations **échangeables** (`replaceable`) au level-up.
- Choix accordés par une **sous-classe** à plusieurs niveaux.
- Complétude des **sorts / cantrips connus** à la création d'un caster de haut niveau (grimoire du
  Magicien au builder : cf. B11).

## Protocole d'audit proposé (~30 min)
Pour **chaque** classe : créer un perso **niveau 20**, dérouler le wizard, cocher que **chaque**
choix par palier (ASI, dons, sous-classe, invocations, arcanums, style de combat, expertise,
métamagie, manœuvres, sorts connus) est **configurable** ET **affiché cumulativement**. Puis un
**level-up** de chaque type (palier de sous-classe, ASI, invocation, arcanum, multiclasse).
