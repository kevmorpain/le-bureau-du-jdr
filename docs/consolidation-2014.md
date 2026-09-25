# Consolidation du socle 2014 — passation & plan

> Doc de passation portable (voyage avec git). État au 2026-08-14. But : pouvoir reprendre le
> chantier « rendre le socle 2014 propre/DRY avant le contenu 5.5 » depuis n'importe quel appareil.

## Où on en est

- **Phase 1 (base propre, iso-2014)** : close et en prod.
- **Phase 2 — appareillage moteur du 5.5** : fait et en prod.
  - Discriminant `ruleset` (`'5'`/`'5.5'`) + durcissement du filtrage (PR #25, #43).
  - Modèle **espèce = base + lignée** (ADR D17) — espèces = origines 2024.
  - **Moteur de choix composites** C1–C4 : triade `ability_scores`, `asi_or_feat`, `weapon_mastery`.
  - **Volet B — dérivation des maîtrises depuis l'origine** : CLOS et en prod (PR #48→#51).
    Les maîtrises de base (armes/armures de classe, outils fixes d'historique) sont **dérivées**
    de porteurs `proficiency_grant`, plus matérialisées ; le strip des grants legacy est déployé
    (migration `0092`). Seuls les vrais deltas du joueur sont stockés.
- **Audit de propreté (2026-08-13)** : réalisé en sous-agent contexte neuf, lecture seule.
  354 tests verts à l'époque. 11 constats (F1–F11) ci-dessous.
- **P0 (consolidation)** : catalogue *ruleset-safe* (F1 + F4-partiel) **FAIT & MERGÉ (PR #52)** ;
  **golden-master d'équivalence création/level-up FAIT** (filet non négociable avant F2, cf. ci-dessous).

**AUCUN contenu 5.5 n'est encore seedé.** Tout le « point 2 » de la roadmap (contenu 5.5) est devant.

## North Star (critère de validation, pas une feature)

> **Aucune règle spécifique à une classe/espèce/historique dans le code ; tout se dérive des données.**

Formulé par le PM (l'utilisateur) : le but n'est pas de livrer du contenu custom, c'est de *valider*
que le schéma est modulaire. Si une entité a un chemin de code bespoke, c'est un bug de modularité.
Ce critère **tranche les décisions ouvertes** vers l'option propre :
- **F2 → généraliser** `progression`/`character_choices` à tout le 2014 (au lieu d'assumer la dup front) ;
- **F3 → dériver** les compétences de classe/historique (comme les maîtrises) ;
- **F7 → lignée seule** (retirer la colonne legacy `dragonborn_ancestry`).

**Périmètre borné** (anti gold-plating) = `(bloque le 5.5)` ∪ `(violation DRY sur le chemin du 5.5)`
∪ `(sert le critère)`. On **défère** F8/F9/F10/F11 (dette de fond, non bloquante).

## Les 11 constats de l'audit (résumé portable)

Le rapport complet vit dans le scratchpad de session (local) ; l'essentiel :

| # | Sévérité | Constat | Bloque 5.5 |
|---|---|---|---|
| **F1** | ✅ **résolu (#52)** | Upserts de catalogue par NOM SEUL → un homonyme 5.5 écrasait le 2014. Passé en `(name, ruleset)`. | oui (levé) |
| **F2** | ✅ sous-classe, style de combat, expertise, ASI | `progression`/`character_choices` généralisé aux 4 points de choix ; le front lit le catalogue partout (plus aucune table front). ASI = une progression `asi_or_feat` par palier (owner discret, `count 1`), source unique le seed [`asi.ts`](../server/db/seeds/data/asi.ts) ; expertise = `count` cumulatif ; style de combat = effets appliqués sur la fiche. | non (levé) |
| **F3** | ✅ **résolu (#85/#86/#87)** | Compétences classe/historique + JS de classe **dérivés** à la lecture (effets `skill_proficiency`/`saving_throw_proficiency`), plus matérialisés figé. Historique = effets sur le porteur (#85) ; JS = classe **principale** seulement (#86, règle multiclasse) ; compétences de classe = choix `progression skill` + `character_choices` (#87, **migration 0099** pour éviter la fenêtre déploiement→reseed d'un CHOIX). `character_skills` ne garde que overrides joueur + expertise. | non (levé) |
| **F4** | ✅ partiel (#52) | `loadInvocations` filtré par `ruleset` (fait). Reste : 6 endpoints `/api/catalog/*` créés mais **non consommés** (surface morte doublant les legacy) → repointer le front ou supprimer. | partiellement |
| **F5** | ✅ partiel (F2 tranche 3) | `WEAPON_PROF_KEYS` (tokens EN morts `longsword`…) + le payload vestigial `armor/weaponProficiencyKeys` de `new.vue` **retirés** (`createCharacter` les ignorait, volet B). Reste `ARMOR_PROF_KEYS` (tokens corrects, référence de `classProficienciesFront.test.ts`) → part avec cette copie front (volet B étape 4). | non |
| **F6** | moyenne | `originAbilityBonuses`/`weaponMasteries` sérialisés à chaque GET fiche mais **non lus** ; `items.mastery_property` sans consommateur. Pipeline maîtrise d'armes 5.5 **construit mais dormant**. À câbler au seed 5.5. | non |
| **F7** | moyenne | Colonne legacy `character_sheets.dragonborn_ancestry` + souffle-par-ascendance = chemin **parallèle** au modèle lignée (Drakéide 2014 déjà migrée en lignées). Trancher avant la Drakéide 5.5. | oui (Drakéide) |
| **F8** | basse | `spells.ts:13-36` redéfinit `enum AbilityScore`/`DamageType` (doublons de `shared/rules` + table `damage_types`). Ménage D6 non appliqué ici. | non |
| **F9** | basse | Table `skills` (D7) référencée par **aucune FK** (`character_skills.skill_key` = `text` nu) → lookup décoratif. | non |
| **F10** | basse | Typecheck baseline **9 server / 64 app**, bénin (inférence `useFetch`, `User.id` d'augmentation nuxt-auth-utils). Seul bug mort tangible : `useCharacterInventory.ts:313` compare `CreatureSize` aux codes FR `'P'/'TP'` (toujours faux). Ni CI ni build CF ne typecheckent. | non |
| **F11** | basse (by-design) | Snapshots Drizzle figés à `0039` → `db:generate` inutilisable, plus de détection auto de dérive. Garde-fou : `test/unit/migrations.test.ts` rejoue 0000→dernier sur base vierge. | non |

**Crédité (propre)** : autorité serveur uniforme create/level-up/rest (`db` injecté, `db.batch()`
atomique, garde de cohérence d'édition, slots dérivés depuis `spellSlots.ts`), `resolve.ts` pur,
dérivations espèce/dons/objets/lignée/maîtrises cohérentes.

## Inventaire « front-only » (choix collectés côté client — converge sur F2/F5)

Audit du flux builder/level-up ↔ serveur (2026-08-16, en marge du golden-master). Trois catégories,
par gravité — la plupart se résolvent AVEC F2 (généralisation `progression`) / F5 (blob front mort) :

- **A. Collecté par le wizard mais NON persisté (vrai trou).**
  - **Style de combat** — création : dans `BuilderState` (`useCharacterBuilder.ts:40`), bloque l'étape
    (`:536`), mais **jamais envoyé** (absent du payload `new.vue`). Level-up : envoyé
    (`useLevelUp.ts:556`), accepté par `levelUpSchema` (`characterLevelUp.ts:37`) mais **jamais lu**
    par `characterLevelUp` → jeté. Bilan : choix **perdu dans les deux flux**, effet (Défense +1 CA,
    Archerie +2…) jamais appliqué. Le tag `fighting_style` ET le `ChoiceKind` existent DÉJÀ
    (`featureTags.ts:32`, `choices.ts:30`) ; seul le CONTENU 2014 n'est pas migré (le seed a un unique
    `class_feature` descriptif « Style de combat », sans tag/progression/options). **Chantier F2** :
    seeder les 6 styles en features taguées + progression + matérialisation via `character_choices`,
    comme les invocations.
  - **Expertise à la création** (nuance) — semble **non capturée du tout** par le builder (aucun champ
    d'état, rien au payload), alors qu'un Roublard/Barde créé niv ≥ 1 devrait la choisir. « Non
    implémenté à la création » plutôt que « collecté-puis-jeté ». Au level-up, elle EST persistée
    (cf. golden-master archétype E).
- **B. Envoyé mais volontairement ignoré — donnée NON perdue (dérivée ailleurs).**
  - `armorProficiencyKeys` / `weaponProficiencyKeys` (création) : ✅ **RETIRÉS du payload** (F2 tranche 3 /
    F5). Ils étaient acceptés par le schéma (toujours optionnels) mais **ignorés** par `createCharacter`
    (maîtrises DÉRIVÉES du porteur de classe, volet B). La map morte `WEAPON_PROF_KEYS` est supprimée du blob.
- **C. Envoyé mais abandonné en fallback silencieux.**
  - `inventoryItemNamesUnresolved` (création) : items non résolus en id côté client → **loggés puis
    non persistés**. Un objet custom / de la monnaie-en-texte peut disparaître sans bruit.

**Hors de cette liste** (pour lever l'ambiguïté) : les **listes d'options** de sous-classe/ASI des 10
classes non-Occultiste viennent d'`app/data` (front-dupliqué = F2), mais le CHOIX résultant
(`subclassId`, `asiBonuses`, `asiFeats`) EST persisté — pas « perdu ». Et l'état d'encounter
(`activeConditions`, `deathSavingThrows`, `armorClass`) est **localStorage par design**
(cf. `docs/persistence.md`) — pas un bug (`armorClass` = dette assumée faute de système d'équipement).

## Plan

- **P0 — débloquer le seed 5.5 (no-op 2014).**
  - **F1 + F4-partiel : ✅ FAIT & MERGÉ (PR #52).** Upserts `(name, ruleset)` via
    `server/db/seeds/lib/rulesetOf.ts` ; `loadInvocations` filtré. Suivi noté in-code : le lien
    sort↔classe de `spells.ts` (`classIdByName`) reste par nom → à reprendre en `(nom, ruleset)`
    au lot des sorts 5.5.
  - **Golden-master d'équivalence création/level-up : ✅ FAIT.** `test/nuxt/goldenMaster.test.ts`
    (+ fixture/sérialiseur `test/nuxt/fixtures/goldenMaster.ts`) fige la sortie NORMALISÉE de
    `createCharacter` + `characterLevelUp` pour **cinq** archétypes, en **16 snapshots** committés
    (`__snapshots__/goldenMaster.test.ts.snap`) — choisis pour couvrir les mécanismes de CHOIX que
    F2 refactore :
    - martial (Guerrier→Champion : sous-classe & ASI **au level-up**) ;
    - lanceur complet (Magicien **Elfe** : lignée = le SEUL `character_choices` déjà écrit en 2014 ;
      emplacements dérivés) ;
    - Occultiste (pacte/manifestations/arcanum **+ ASI & dons À LA CRÉATION** : `asiBonuses`,
      `asiFeats` source `asi`, `bonusFeatureId` source `bonus`) ;
    - roublard (**expertise** →`expert` à la création niv 1 — le serveur refuse une expertise hors palier
      au level-up — + `newSkills` + sous-classe au level-up) ;
    - multiclasse (Guerrier/Occultiste : emplacements de pacte combinés).

    Les clés étrangères y sont résolues en NOMS et les id auto-incrément/horodatages écartés →
    lisible et déterministe. Quand F2 déplacera les choix de classe (ASI/style/sous-classe/expertise,
    aujourd'hui front-dupliqués) vers `progression`/`character_choices`, le `git diff` du `.snap`
    montrera EXACTEMENT le changement de comportement serveur (typiquement : des lignes `choices` qui
    apparaissent). Diff inattendu = régression ; diff attendu = relu puis re-généré (`vitest -u`).
    **Filet NON négociable avant F2, posé.**
    - _Dette de couverture ASSUMÉE_ (non bloquante — chemins hors du risque F2 direct, à ajouter au
      besoin) : pactes **Lame/Tome**, multiclassage lanceur **plein+plein / plein+demi** (branche
      `spellcasting` combinée), **demi-lanceur** (`half`). Hors périmètre : `characterRest`.
    - _Non figeable aujourd'hui_ : le **style de combat** n'a AUCUNE sortie serveur (cf. « Inventaire
      front-only », cat. A) — ce n'est PAS « hors périmètre » mais un choix perdu à rapatrier en F2.
      Quand F2 le câblera, l'archétype **Guerrier** du golden-master devra voir apparaître son choix
      de style dans le snapshot → diff ATTENDU (relire + `vitest -u`).
- **P1 — le cœur : ✅ FAIT.** **F2** (généraliser `progression` au 2014 : sous-classe, style de combat,
  expertise, ASI — tous mergés+déployés, blob `character-builder.ts` rétréci d'autant) **+ F3** (dériver
  les compétences classe/historique + JS sur le même mécanisme, tranches #85/#86/#87 mergées+déployées).
  Le tout sous golden-master (diff relu + `vitest -u` à chaque bascule matérialisation→dérivation).
  - **F2 · sous-classe — tranche 1 (MODÈLE) : ✅ FAIT.** L'identité (`classes.subclass_level`) était
    déjà là (migration 0080) ; manquait la « décision → progression ». Posée comme source unique côté
    DONNÉES : helper `server/db/seeds/data/subclassChoice.ts` (`subclassChoiceFeature(className)` →
    feature owner à `subclass_level`, portant une progression `kind:'subclass'`, `optionSource:{subclasses}`,
    `count` fixed 1), **injecté par `seedClass`** pour toute classe ayant des sous-classes — même
    mécanisme que le carrier de maîtrises (`buildProficiencyCarrier`), donc DRY et inoubliable pour
    une future classe (pas de câblage dupliqué par wrapper). Verrouillé par
    `test/unit/subclassChoice.test.ts` (map = les 12 classes de `CLASS_IDENTITY` **et** de `classesData`,
    pour que `seedClass` ne saute pas en silence une classe non mappée) + `test/nuxt/subclassProgression.test.ts`
    (mécanisme données→`buildCatalog`→`resolveChoices`/`dueChoices`, dû au bon niveau). **Additif** :
    ne touche NI `createCharacter`/`characterLevelUp` (golden-master inchangé) NI le front (blob encore
    en place).
  - **F2 · sous-classe — owner INVISIBLE (option B) : ✅ FAIT.** L'owner du choix porte le nouveau
    `feature_type` **`choice_carrier`** (schema/features.ts) : lu par le catalogue (`buildCatalog` ne
    filtre pas le type) mais **jamais matérialisé** sur la fiche (le sweep de grants passifs filtre
    `class_feature`) — la sous-classe choisie + ses features sont déjà affichées, comme pour les points
    de choix d'espèce déjà masqués dans `index.get.ts`. Aucune migration (pas de CHECK sur `feature_type`).
    Preuve : `createCharacter.test.ts` (un `choice_carrier` de niv ≤ perso n'est PAS copié, le
    `class_feature` passif l'est) + `subclassProgression.test.ts` (le catalogue le remonte malgré le type).
    Les owners VISIBLES de l'Occultiste (Faveur de pacte…) restent des `class_feature` matérialisées —
    _résidu noté_ : par symétrie ils sont eux aussi redondants avec l'option choisie ; les masquer serait
    une décision UX SÉPARÉE (non prise ici, l'utilisateur a choisi B ciblée sous-classe).
  - **F2 · sous-classe — tranche 2 (SERVEUR + backfill prod) : ✅ FAIT.** `createCharacter`/
    `characterLevelUp` résolvent la progression `subclass` de la classe et écrivent le pick en
    `character_choices.selected_subclass_id` (LA source, rules-engine.md §4) ; `character_classes.
    subclass_id` reste écrit (projection dénormalisée pour le read-model / la matérialisation des
    features de sous-classe) — additif, symétrique de la lignée, garde défensive si pas de progression.
    Golden-master : la fixture seede les owners `choice_carrier` (Guerrier/Magicien/Roublard) → diff
    REVU = apparition de lignes `choices` (subclass) et **0 ligne de feature** (owner invisible confirmé
    au snapshot). **Backfill prod** : migration `0093_subclass_choice_carriers` crée owner+progression
    pour les 12 classes sur les bases déployées (pendant du seed, comme `0082` pour l'Occultiste), avec
    gardes `NOT EXISTS` (idempotent, mieux que 0082) et tolérance base vierge (`INSERT...SELECT FROM
    classes`). Testé base peuplée + idempotence (`subclassBackfill.test.ts`) ; descriptions identiques au
    seed (convergence). La dette « prod n'a pas la donnée » est donc **levée**.
  - **F2 · sous-classe — tranche 3 (FRONT) : ✅ FAIT.** builder + level-up lisent le NIVEAU d'accès et
    les OPTIONS de sous-classe DANS LE CATALOGUE au lieu du blob `app/data/character-builder.ts` :
    - `useBuilderEntities` repointé `/api/classes` → **`/api/catalog/classes`** (≡ `loadClasses`, cachable
      au edge — F4) ; son type `DbClass` porte désormais `subclassLevel` + sous-classes imbriquées, et il
      expose `subclassCatalogFor(classDbId)` = source unique du niveau/des options (builder ET level-up).
    - **Gating = miroir de `needsPactBoon`** : `catalogChoices.some(c => c.kind === 'subclass')` dans
      `useCharacterBuilder` (`needsSubclass`) ; `choicesAtToLevel.some(c => c.kind === 'subclass' &&
      c.ownerLevelRequired === toLevel)` dans `useLevelUp` (`isSubclassLevel`). `LevelUpStepClass` dérive
      ses badges via `subclassLevelFor(builderClassId)` (catalogue), `LevelUpStepFeatures` lit ses options
      via `/api/catalog/classes/[name]/subclasses` (F4).
    - **Blob rétréci** : `ClassData.subclassLevel` et `subclasses[]` **retirés** (les 12 entrées + l'interface) ;
      `subclassLabel` (libellé FR d'affichage, aucune colonne DB) conservé.
    - Couvre les classes à sous-classe niv 1 (Clerc/Ensorceleur/Occultiste) comme niv 2/3, et le
      multiclasse au level-up (le `count`/gating utilise le niveau de la classe **propriétaire**).
    - **Tests** : `classesIdentityFront.test.ts` repointé — l'assertion sur le `subclassLevel` du blob
      (supprimé) laisse place à la dérivation catalogue-driven verrouillée contre `CLASS_IDENTITY` (les
      12 classes × 20 niveaux : dû au bon niveau/pas avant, options = sous-classes, pick déjà fait via
      `character_choices` → plus dû) ; l'équivalence du **type d'incantation** (emplacements front-driven)
      reste sur le blob. `git diff` du snapshot golden-master **vide** (serveur non touché). 385 → 399 tests.
    - **F5 (dans la foulée) : partiel.** Le payload vestigial `armorProficiencyKeys`/`weaponProficiencyKeys`
      (ignoré par `createCharacter`, volet B) est retiré de `new.vue`, et la map morte **`WEAPON_PROF_KEYS`**
      (tokens EN `longsword`…) supprimée du blob. `ARMOR_PROF_KEYS` est **conservé** : ses tokens sont
      corrects (light/medium/…) et il sert encore de référence d'équivalence à `classProficienciesFront.test.ts`
      (volet B, drift-protection) — il disparaîtra avec cette copie front (volet B étape 4).
    - **Résidu remonté (non traité ici, décision UX à l'utilisateur)** : le **builder n'impose PAS** la
      sélection d'une sous-classe même au niveau d'accès (`isStepComplete('class')` ne la vérifie pas — état
      pré-existant, inchangé par cette tranche), alors que le **level-up l'exige** (`isStepComplete('features')`).
      Le gating catalogue affiche le picker au bon niveau ; rendre le choix obligatoire à la création serait un
      changement de comportement à décider séparément.
  - **F2 · style de combat — chantier en 4 tranches (décision utilisateur : appliquer AUSSI les effets).**
    Contrairement à la sous-classe, le style de combat n'existait NULLE PART comme donnée (choix **perdu**
    aux deux flux, cf. Inventaire cat. A) ET porte des effets mécaniques jamais appliqués → chantier plus gros.
    Décisions utilisateur : (1) périmètre = capturer/persister/matérialiser **+ appliquer les effets** sur la
    fiche ; (2) options **dupliquées par classe** (sous-ensembles différents : Guerrier 6, Paladin 4, Rôdeur 4).
    - **Tranche 1 (FONDATION) : ✅ FAIT (cette PR).** Effet `fighting_style_modifier` (`kind` discriminant,
      façon `eldritch_blast_modifier`) ; `FeatureType` `'fighting_style'` (option non matérialisée par les
      sweeps, comme `eldritch_invocation`) ; module unique `server/db/seeds/data/fightingStyles.ts` (6 styles
      PHB + sous-ensembles/niveaux par classe) ; features-options injectées par `seedClass`
      (`fightingStyleOptionFeatures`), progression `kind:'fighting_style'` posée sur la feature owner « Style de
      combat » (guerrier/paladin/rodeur.ts) ; **`buildCatalog` filtre `feature_group` par classe propriétaire**
      (no-op invocations/pacte Occultiste, tous `class_id`=Occultiste). Additif : owner reste `class_feature`
      visible, aucune écriture serveur → golden-master **inchangé**. Tests : `fightingStyles.test.ts` (contrat) +
      `fightingStyleProgression.test.ts` (filtre par classe + gating). ⚠️ Le **Rôdeur récupère Duel** (le blob
      front l'omettait). Prod : PAS de backfill ici (dormant, rien ne lit la progression serveur) → tranche 2.
    - **Tranche 2 (SERVEUR) : ✅ FAIT.** `createCharacter`/`characterLevelUp` résolvent le style choisi (par
      nom) via l'util DI `server/utils/fightingStyle.ts` (`resolveFightingStylePick`) → écrivent le pick en
      `character_choices.selected_feature_id` (source) + matérialisent la feature-option (comme les invocations).
      **Autorité serveur = gating par niveau** : l'util refuse un style sous le palier d'accès (owner
      `levelRequired` : Guerrier 1, Paladin/Rôdeur 2) — un Paladin niv 1 qui envoie « Défense » ne le reçoit pas.
      Owner « Style de combat » → **`choice_carrier` (invisible)** (guerrier/paladin/rodeur.ts). `new.vue` envoie
      désormais `fightingStyle` à la création (le choix était **collecté puis perdu**). Golden-master : archétype
      A (Guerrier « Défense » niv 1) → **diff revu** (apparition du choix `fighting_style` + feature Défense,
      A seul). Tests : `fightingStyleServer.test.ts` (création persistée, **gating** Paladin niv 1, level-up
      Paladin 1→2, classe non martiale ignorée) + fixture golden-master étendue (Guerrier + Paladin FS).
      **Prod** : migration `0098` (auto) flippe l'owner existant → `choice_carrier` ; les options + la progression
      viennent du seed des classes → geste prod `?only=guerrier,paladin,rodeur` (idempotent, après déploiement).
      ⚠️ **Résidu remonté** : le 2e style du **Champion niv 10** (« Style de combat supplémentaire », progression
      possédée par la sous-classe) N'EST PAS câblé — chantier séparé (owner `ownerSubclassId`, cas unique).
    - **Tranche 3 (APPLICATION DES EFFETS) : ✅ FAIT.** Le style choisi (feature `fighting_style`
      matérialisée) porte un effet `fighting_style_modifier` qui remonte à `allEffects` (via
      character_features → resolvedFeatures → classFeatureEffects → baseAllEffects, chemin des
      invocations). `useCharacterInventory` l'applique : **Défense** +1 CA (armé), **Archerie** +2
      attaque à distance, **Duel** +2 dégâts (mêlée à une main, sans autre arme), **Combat à deux
      armes** (mod de carac. aux dégâts de la main secondaire). Logique arithmétique extraite en
      module PUR `shared/rules/fightingStyleEffects.ts` (testé : `test/unit/fightingStyleEffects.test.ts`).
      `great_weapon` (relance de dés) / `protection` (réaction) = non statiques → rendus par la
      description de la feature (qui s'affiche sur la fiche, label « Style de combat »).
      Baseline typecheck (63/10) préservée. **✅ Vérifié visuellement** sur le dev (fiche rendue) :
      Guerrier « Défense » + armure de cuir → CA **14** (11 + DEX +2 + Défense +1) ; Guerrier
      « Archerie » + arc long → Attaque **+6** (DEX +2, maîtrise +2, Archerie +2), dégâts 1d8+2 inchangés.
    - **Tranche 4 (FRONT) : ✅ FAIT — CLÔT le chantier style de combat.** builder (`useCharacterBuilder`/
      `StepClass`) et level-up (`useLevelUp`/`LevelUpStepFeatures`/`LevelUpStepClass`) lisent le niveau/les
      options du catalogue au lieu du blob (miroir exact de la sous-classe) : gating dérivé de `resolveChoices`
      (`needsFightingStyle` = `catalogChoices.some(kind==='fighting_style')`, gaté au palier d'accès) ; options
      (nom + description) via le nouvel endpoint **`/api/catalog/classes/[name]/fighting-styles`** (loader
      `loadFightingStyles`) ; niveau via `ownerLevelRequired` (`fightingStyleLevelFor` pour les badges level-up).
      **Blob retiré** : `FIGHTING_STYLES` + `FIGHTING_STYLE_DESCRIPTIONS` (`character-builder.ts`) +
      `LU_FIGHTING_STYLE_LEVELS` (`useLevelUp.ts`) supprimés. **Le Rôdeur affiche désormais Duel** (l'ancien
      blob l'omettait). Bonus : le builder gate maintenant le style par niveau (Paladin niv 1 n'est plus forcé
      de choisir). Tests : `loadFightingStyles` (catalogSources.test) ; gating catalogue déjà couvert par
      `fightingStyleProgression.test`. Suite 468 verte, typecheck 63/10 baseline. **Reste (autres chantiers F2) :
      expertise/ASI (déjà persistés, options front à repointer sur le même patron).**
- **Tracks parallèles sûrs** (empreinte disjointe) : **F7** (dragonborn → lignée), **F8/F9**
  (hygiène schéma), **F10** (typecheck baseline + bug mort l.313).

⚠️ **Risque #1 = F2** : touche builder + level-up (flux à fort trafic, couverture trouée) → d'où le
golden-master d'abord. **Parallélisation limitée** par les fichiers partagés (`characterCreate`,
`useCharacterSheet`, `seedClass`, `catalog`) et l'env git/worktree ; seuls les tracks à empreinte
disjointe se parallélisent.

## Rappels d'environnement & workflow

- **Env** : Nuxt 4 + Nitro (Cloudflare Workers) + Drizzle + D1. Dev sous Windows + WSL Ubuntu.
- **Tests** : `wsl -d Ubuntu -- bash -ic "cd <worktree> && NUXT_SESSION_PASSWORD=ci_only_dummy_session_password_do_not_use npx vitest run"`.
- **Typecheck** : `npx nuxi prepare` puis `npx tsc --noEmit -p .nuxt/tsconfig.{app,server}.json`.
  **Baseline = 9 server / 64 app** (ne juger que ses propres fichiers). Ni la CI ni le build ne typecheckent.
- **Migrations** : `.sql` + entrée `meta/_journal.json` **à la main** (pas de snapshot ; `db:generate`
  cassé). JAMAIS `db.transaction()`/`BEGIN` (D1 les rejette) → statements séquentiels ou `db.batch()`.
- **Seeds** : idempotents ; désormais keyés `(name, ruleset)` (cf. `lib/rulesetOf.ts`). Seed prod via
  `POST /api/admin/seed?only=<seeds>` (secret dans `.env`). Déploiement CF **auto au push sur `main`**.
- **Docs de référence** : `docs/architecture.md`, `docs/rules-engine.md`, `docs/dnd-5.5.md`,
  `docs/decisions.md`, `docs/audit-completude.md`, `CLAUDE.md` (gotchas hub:db / nuxt dev).
- **Historique du chantier** : PR #48–#51 (volet B), #52 (P0). Messages de commit auto-documentés.
