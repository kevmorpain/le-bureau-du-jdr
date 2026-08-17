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
| **F2** | haute | `progression`/`character_choices` câblé **seulement** pour Occultiste + lignée Elfe. Les choix des 10 autres classes (ASI/style/expertise/sous-classe) sont **front, dupliqués** builder↔level-up (`useLevelUp.ts:21-34`, `useCharacterBuilder.ts:132,464`, `LevelUpStepClass.vue:130-171`). C'est le « point 6 » non fait. | partiellement |
| **F3** | haute | Aucune dérivation d'origine pour `character_skills` : compétences classe/historique **matérialisées figées** (`characterCreate.ts:575-582`), incohérent avec les maîtrises désormais dérivées. | oui (historiques) |
| **F4** | ✅ partiel (#52) | `loadInvocations` filtré par `ruleset` (fait). Reste : 6 endpoints `/api/catalog/*` créés mais **non consommés** (surface morte doublant les legacy) → repointer le front ou supprimer. | partiellement |
| **F5** | moyenne | `WEAPON_PROF_KEYS` (`character-builder.ts:60-70`) émet des tokens EN **morts** (`longsword`…) que `createCharacter` ignore. Chemin mort. **À faire DANS F2** (le blob front disparaît). | non |
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
  - `armorProficiencyKeys` / `weaponProficiencyKeys` (création, `new.vue:204-205`) : acceptés par le
    schéma, **ignorés** par `createCharacter` (les maîtrises sont désormais DÉRIVÉES du porteur de
    classe, volet B). Payload **mort** = **F5**, à retirer quand le blob front disparaît (dans F2).
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
    - roublard (**expertise** upsert→`expert` + `newSkills` + sous-classe au level-up) ;
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
- **P1 — le cœur (EN COURS).** **F2** (généraliser `progression` au 2014, commencer par `subclass` commun à
  toutes et déjà supporté par `resolve.ts`/`buildCatalog`, retirer le blob `character-builder.ts`
  au fur et à mesure — F5 s'y fait) **+ F3** (dériver les compétences sur le même mécanisme). Sous
  golden-master. Sérialisé sur le modèle puis front.
  - **F2 · sous-classe — tranche 1 (MODÈLE) : ✅ FAIT.** L'identité (`classes.subclass_level`) était
    déjà là (migration 0080) ; manquait la « décision → progression ». Posée comme source unique côté
    DONNÉES : helper `server/db/seeds/data/subclassChoice.ts` (`subclassChoiceFeature(className)` →
    feature owner à `subclass_level`, portant une progression `kind:'subclass'`, `optionSource:{subclasses}`,
    `count` fixed 1), câblé dans les 12 wrappers de classe (Occultiste inclus). Verrouillé par
    `test/unit/subclassChoice.test.ts` (les 12 classes vs `CLASS_IDENTITY`) + `test/nuxt/subclassProgression.test.ts`
    (mécanisme données→`buildCatalog`→`resolveChoices`/`dueChoices`, dû au bon niveau). **Additif** :
    ne touche NI `createCharacter`/`characterLevelUp` (golden-master inchangé) NI le front (blob encore
    en place). ⚠️ _Effet de bord au re-seed_ : la feature owner (« Archétype martial »… non taguée) sera
    matérialisée sur les fiches créées/montées après re-seed — cohérent avec les owners de l'Occultiste
    (« Faveur de pacte » déjà matérialisée), et contenu D&D correct. Non couvert par la suite (seeds =
    `hub:db`, cf. F11) → validé statiquement + au mécanisme.
  - **F2 · sous-classe — tranches suivantes** : (2, SERVEUR) `createCharacter`/`characterLevelUp`
    enregistrent le pick en `character_choices.selected_subclass_id`, `character_classes.subclass_id`
    en DÉRIVE (rules-engine.md §4, migration additive) — SOUS golden-master (diff attendu : ajout de la
    fixture sous-classe + apparition des lignes `choices`) ; (3, FRONT) builder + level-up lisent le
    niveau/les options depuis le catalogue (`loadClasses` les expose déjà) au lieu du blob
    `app/data/character-builder.ts` — retrait progressif du blob (F5 : clés de maîtrise mortes s'y font).
    Puis rejouer le même patron pour **style de combat** (cf. Inventaire front-only, cat. A) et le reste.
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
