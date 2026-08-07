# D&D 5.5 (2024) — vue d'ensemble & roadmap

> **Point d'entrée** du chantier. Ce qui change en 5.5, le principe de cohabitation, et le
> plan. Le design technique est dans [`rules-engine.md`](./rules-engine.md), les constats
> d'audit dans [`architecture-audit.md`](./architecture-audit.md), les décisions dans
> [`decisions.md`](./decisions.md).

Sources (à revalider entrée par entrée au moment de seeder) :
[Règles 2024](https://www.aidedd.org/regles-24/) ·
[Création de perso](https://www.aidedd.org/regles-24/creation-de-personnage/) ·
[Origines](https://www.aidedd.org/regles-24/origines-des-personnages/) ·
[Dons 5.5](https://www.aidedd.org/regles-24/dons/)

---

## 1. Principe : cohabitation, pas remplacement

Les deux systèmes coexistent ; le ruleset (`'5'` | `'5.5'`) est **figé par personnage** à la
création (cf. [D1](./decisions.md#d1), [D2](./decisions.md#d2)). Les fiches 2014 existantes
restent intactes. On pose d'abord la **base propre** (à iso-2014, sous tests d'équivalence),
puis le 5.5 devient « **données + flag** ».

---

## 2. Ce qui change entre la 5 (2014) et la 5.5 (2024)

Bouleversement central : **les bonus de caractéristiques passent de l'espèce vers l'historique.**

| Sujet | `5` — 2014 | `5.5` — 2024 |
|---|---|---|
| **Bonus de carac.** | de l'**espèce** | de l'**historique** : +2/+1 sur deux carac., ou +1/+1/+1 sur trois. Plafond 20 |
| **Espèce** | bonus + traits + sous-races | **traits seuls**, plus de sous-races (→ « lignées » : sorts/traits, sans bonus) |
| **Historique** | compétences + outils + trait | **+ bonus de carac. + un don d'origine** + compétences + outil |
| **Dons** | optionnels (à la place d'un ASI) | **un don d'origine dès le niv.1** ; ~75 dons catégorisés (Origine/Général/Style/Faveur épique) |
| **Espèces** | ~9 + sous-races | **10** (3 nouvelles : aasimar, goliath, orc) |
| **Historiques** | narratifs | **16** mécaniquement chargés |
| **Sous-classe** | niveau variable | **niveau 3 pour toutes** |
| **Maîtrise d'armes** | absente | **nouvelle mécanique** (classes martiales) |
| **Classes** | — | refonte : Rôdeur lance dès niv.1, dés du Moine revus, features remaniées |

**Listes PHB 2024** (à revalider sur aidedd au seed) :
- **Espèces (10)** : Aasimar, Drakéide, Nain, Elfe, Gnome, Goliath, Halfelin, Humain, Orc, Tieffelin.
- **Historiques (16)** : Acolyte, Artisan, Charlatan, Criminel, Artiste, Fermier, Garde, Guide,
  Ermite, Marchand, Noble, Sage, Marin, Scribe, Soldat, Voyageur.

---

## 3. Roadmap

> **Séquencement révisé** : le **nettoyage d'abord**, le `ruleset` **ensuite**. Le flag
> `ruleset` ne sert qu'à *distinguer* les éditions — c'est de l'**enablement**, pas une
> fondation. On le pose donc juste avant d'introduire le contenu 5.5. (Un prototype de
> migration `ruleset` avait été fait puis retiré pour repartir sur une base propre.)

> **Bugs de complétude 2014 (hors iso-comportement)** : les correctifs de *parcours* découverts
> en cours de route (arcanums non cumulatifs, base d'ASI par palier…) sont tracés à part dans
> [`audit-completude.md`](./audit-completude.md). La Phase 1 étant iso-comportement, elle ne les
> corrige pas ; ils forment des chantiers de correction 2014 dédiés.

**Phase 1 — base propre (clean), iso-2014, test-guardée** (migration additive, cf. [D9](./decisions.md#d9), [D13](./decisions.md#d13))
1. **Tests d'équivalence 2014** (le filet, *en premier*) — contrat de valeurs vérifiées
   (Ambroise + 1 martial + 1 caster), cf. [D12](./decisions.md#d12) et `rules-engine.md` §8.
2. **`shared/rules/`** : `skills` (+ table + micro-migration de casse) puis `abilities`
   (tue la duplication + les Zod en dur).
3. **Union `Effect` étendue** (`saving_throw_proficiency`, `skill_proficiency_choice {count,from}`).
4. **Schéma (sans `ruleset`)** : colonnes d'identité `classes` + `progression` +
   `character_choices` + `features.tag` + alignement `backgrounds` + `items.mastery_property`
   + table `skills` (détails : `rules-engine.md` §6).
5. **API + résolution** — découpé en sous-lots (cf. `rules-engine.md` §5/§7) :
   - **5a** ✅ — `resolve()` pur (volet choix) dans `shared/rules/resolve.ts` :
     `resolveChoices(projection, catalog)`, fonction pure serveur+client ([D10](./decisions.md#d10)). *(PR #10, mergé.)*
   - **5b** — **substrat d'autorité** : loader `server/utils/catalog.ts` (`buildCatalog`) +
     **filtrage d'éligibilité** des options (prérequis + `levelRequired` propre à l'option,
     gating sous-classe) dans `resolve.ts`, testés contre les vraies données Occultiste.
     Ferme la boucle seed↔migration↔loader↔resolve.
   - **5c** — `db.batch()` (atomicité D1) sur create/level-up/rest — robustesse **indépendante**
     ([D14](./decisions.md#d14) ; jamais `db.transaction()`).
   - **5d** — **dérivation + validation serveur** via `resolve()` (sous-classe∈classe,
     compétences∈autorisé, sort/invocation légal) ; consolide au passage les tables de slots/PV
     dupliquées en double côté serveur (`architecture-audit.md` §7).
   - **⏸️ 5e (REPORTÉ, adjacent au point 6)** — **consolidation `/api/catalog/*` + cache edge**
     (KV/`routeRules`). Priorité 🟢/🔵 (perf/surface, `rules-engine.md` §7 items 7 & 9), **au
     service du front** (son seul consommateur = point 6), pas du chemin critique d'autorité. Les
     endpoints catalogue épars (`classes.get`, `character_species.get`, `feats/index.get`,
     `invocations/index.get`, `backgrounds/index.get`, subclasses…) restent en place jusque-là.
     **À ne pas oublier avant/avec le point 6.**
6. **Front** : builder **et** level-up lisent le catalogue via l'API ;
   `app/data/character-builder.ts` réduit au flavor ; rendu générique des `progression`.

**Phase 2 — enablement 5.5**
1. **Poser le discriminant `ruleset`** (`'5'`/`'5.5'`, cf. [D2](./decisions.md#d2)) sur
   `character_sheets` + le catalogue (`character_species`, `classes`, `backgrounds`,
   `features`, `spell_classes`) + backfill `'5'`.
2. **Contenu 5.5** : seed (espèces, historiques + triade + don, classes, maîtrise d'armes,
   dons) + UI d'origines (bonus portés par l'historique) + fiche ruleset-aware.

---

## 4. Sourcing du contenu 5.5 (Phase 2) — décidé

**Source = aidedd** : c'est la traduction FR **officielle** du PHB (2014 **et** 2024), donc la page FR
fait autorité pour les libellés stockés/affichés. L'EN (`/feat/<slug>`, `/en/<class>-2024/`) ne sert
qu'à mapper les libellés FR → **clés machine EN** ([D11](./decisions.md#d11)) et de 2ᵉ lecture
anti-bruit. Méthode = **option A** ([D16](./decisions.md#d16)) : fetch des pages de **détail** →
**table validée par l'auteur** → seed.

**WebFetch fonctionne sur aidedd** (l'ancienne note « aidedd bloque le WebFetch » était un faux
positif : les pages d'**aperçu** — `regles-24/`, `regles-24/dons/`, `feat/` — n'ont pas de données
par entrée ; le contenu réel est sur les pages de **détail**, que `WebSearch` sur le domaine
`aidedd.org` révèle). Volets vérifiés fetchables (2026-08-06/07) et leurs patterns d'URL :

| Volet | Page de détail | Vérifié |
|---|---|---|
| Espèces (9) | `regles-24/origines-des-personnages/description-des-especes/` | ✅ taille / vitesse / traits |
| Historiques (16) | `regles-24/origines-des-personnages/description-des-historiques/` | ✅ triade + don d'origine + compétences/outil |
| Classes (12) | `regles-24/classes/<slug>/` | ✅ dé de vie, sauvegardes, maîtrises, bottes, sous-classe, aptitudes/niveau |
| Maîtrise d'armes | `regles-24/equipement/armes/` | ✅ les 8 propriétés + effets (recoupent `shared/rules/masteryProperties.ts`) |
| Dons (~75) | `feat/fr/<slug>` (slugs listés sur `/feat/`) | ✅ catégorie + prérequis + effet |

**Deux règles dures de sourcing** (apprises à la vérification) :
1. **Page de détail uniquement** — jamais les snippets `WebSearch` ni les pages-listes : le snippet
   « Vigilant » servait la version **2014** d'Alert alors que `feat/fr/vigilant` rend la vraie **2024**
   ; les snippets **mélangent les éditions**.
2. **Recouper chaque entrée** — l'extraction WebFetch passe par un petit modèle qui bruite (ex. source
   rendue « PHB 2024 (BR - édition brésilienne) », artefact) ; croiser FR/EN là où le mapping est
   piégeux (maîtrise d'armes, effets de dons).

**Restant à trancher au fil des lots** :
- Traits des espèces → features/effects ; lignées (elfe / gnome / tieffelin / drakéide).
- Historiques → triade (`progression` `kind:'ability_scores'`) + don d'origine + compétences/outil.
- Maîtrise d'armes : accès par classe (nombre de bottes par niveau).
- Dons : catégories, prérequis, répétabilité.
- Comportement UI si changement de `ruleset` en cours de création (reset ?).
