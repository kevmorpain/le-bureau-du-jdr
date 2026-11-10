# D&D 5.5 (2024) — vue d'ensemble & roadmap

> **Point d'entrée** du chantier. Ce qui change en 5.5, le principe de cohabitation, et le
> plan. Le design technique est dans [`rules-engine.md`](./rules-engine.md), les décisions dans
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

## 3. État et suite

- **Phase 1 — base propre, iso-2014** ✅ : `shared/rules/`, union `Effect` étendue, `progression` /
  `character_choices`, résolution pure `resolveChoices` ([D10](./decisions.md#d10)), autorité serveur
  en `db.batch()` ([D14](./decisions.md#d14)), front lisant `/api/catalog/*`, sous tests
  d'équivalence ([D12](./decisions.md#d12), [D13](./decisions.md#d13)).
- **Phase 2.1 — discriminant `ruleset`** ✅ ([D2](./decisions.md#d2)) : posé sur les fiches et le
  catalogue, sorts compris ; résolution, pickers et écritures filtrent par édition. Moteur 5.5
  construit mais dormant : triade `ability_scores`, `asi_or_feat`, lignées ([D17](./decisions.md#d17)),
  `weapon_mastery`.
- **Phase 2.2 — contenu 5.5** : aucun contenu 2024 n'est seedé. Épopée
  [#201](https://github.com/kevmorpain/le-bureau-du-jdr/issues/201) (label `5.5`), qui liste les
  prérequis (F14 [#106](https://github.com/kevmorpain/le-bureau-du-jdr/issues/106),
  F7 [#120](https://github.com/kevmorpain/le-bureau-du-jdr/issues/120),
  F19 [#130](https://github.com/kevmorpain/le-bureau-du-jdr/issues/130),
  F6 [#119](https://github.com/kevmorpain/le-bureau-du-jdr/issues/119)) et les décisions à trancher
  ([#200](https://github.com/kevmorpain/le-bureau-du-jdr/issues/200)). Périmètre : espèces,
  historiques + triade + don d'origine, classes, maîtrise d'armes, dons, UI d'origines, fiche
  ruleset-aware.

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

**Restant à trancher au fil des lots** : liste à cocher dans
[#200](https://github.com/kevmorpain/le-bureau-du-jdr/issues/200) (traits d'espèce et lignées,
triade des historiques, accès à la maîtrise d'armes, catégories de dons, changement de `ruleset` en
cours de création).
