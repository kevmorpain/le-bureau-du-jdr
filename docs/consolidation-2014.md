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
- **P0 (consolidation) — FAIT & MERGÉ (PR #52)** : catalogue *ruleset-safe* (F1 + F4-partiel).

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

## Plan

- **P0 — débloquer le seed 5.5 (no-op 2014).**
  - **F1 + F4-partiel : ✅ FAIT & MERGÉ (PR #52).** Upserts `(name, ruleset)` via
    `server/db/seeds/lib/rulesetOf.ts` ; `loadInvocations` filtré. Suivi noté in-code : le lien
    sort↔classe de `spells.ts` (`classIdByName`) reste par nom → à reprendre en `(nom, ruleset)`
    au lot des sorts 5.5.
  - **Golden-master d'équivalence builder/level-up : À FAIRE (prochaine PR).** Figer la sortie de
    création + level-up pour un échantillon représentatif (martial, caster, occultiste, multiclasse)
    → un `git diff` de comportement saute aux yeux quand on généralisera `progression`. **Filet
    NON négociable avant F2.**
- **P1 — le cœur.** **F2** (généraliser `progression` au 2014, commencer par `subclass` commun à
  toutes et déjà supporté par `resolve.ts`/`buildCatalog`, retirer le blob `character-builder.ts`
  au fur et à mesure — F5 s'y fait) **+ F3** (dériver les compétences sur le même mécanisme). Sous
  golden-master. Sérialisé sur le modèle puis front.
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
