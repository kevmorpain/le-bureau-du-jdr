# Audit — Système d'effets, dérivation & modèle de choix

> **But** : vérifier que le socle (effects uniformes + dérivation depuis classe/espèce/
> historique) est sain **avant** d'y greffer le support 5.5. Fait à partir du code réel
> (composables + endpoints + seeds), pas des docs.
>
> **Décision de séquencement (validée)** : on pose d'abord la **base propre à iso-2014**,
> sous filet de **tests d'équivalence**, *puis* on construit le versioning 5.5 comme
> « données + flag ». Voir §9.

## Verdict global

Socle **largement sain**. Le système d'effets est bien conçu et réutilisable. La
dérivation « entité → + choix → + overrides » est réalisée **pour l'espèce, les dons et
les objets**. Trois écarts à corriger avant le 5.5 :

1. **Classe & historique ne sont pas dérivables** — leurs grants vivent dans le front et
   sont figés à la création (§4).
2. **Les points de choix ne sont pas modélisés** — la « progression » (quoi/quand/parmi
   quoi) est front-only *et dupliquée* entre builder et level-up ; les choix résolus sont
   éparpillés dans des colonnes ad hoc (§6).
3. **Le serveur fait confiance à des valeurs calculées côté client** au lieu de les
   dériver (§8).

---

## 1. Le système d'effets

- Table `effects` = **union discriminée typée**, dédupliquée par `(type, value)` au seed.
- Branchée via **deux tables de jointure** : `feature_effects` et `item_effects`.
- Consommation : agrégation en `allEffects` (`useCharacterSheet`) puis `filter` par type.

| Entité | Via | État |
|---|---|---|
| Traits d'espèce | `species_features` → `feature_effects` | ✅ riche |
| Features de classe / sous-classe | `features` → `feature_effects` | ⚠️ présents mais **quasi vides** |
| Dons | `features` (`feat`) | ✅ (résolution des choix) |
| Invocations | `features` (`eldritch_invocation`) | ✅ |
| Objets magiques | `item_effects` | ✅ |
| **Sorts** / **stats de base d'arme** | modèles propres (`damages`/`properties`) | ✅ **volontaire & sain** |

Bon design. Frontière « effects = modificateurs passifs ; sorts & armes = mécaniques
actives » saine. Point mineur : deux tables de jointure de même forme (owner non
polymorphe) — acceptable.

---

## 2. La dérivation des données de personnage

Split net entre **dérivé** et **figé** :

| Donnée | Traitement |
|---|---|
| Bonus de carac. (espèce) | **Dérivé** (`ability_increase`) |
| Compétences / langues / outils d'espèce & dons | **Dérivé** (effects + overrides) |
| Vision, résistances, sorts accordés, bonus PV/init/passifs | **Dérivé** |
| Compétences / JS / maîtrises de **classe & historique** | **Figé** → `character_skills`, `character_proficiency_overrides` |

**Confirmations rassurantes :**
- Carac. de base **bien stockées comme base** (le builder envoie `state.abilities`, pas
  les finales) → `total = base + effects` correct, **sans double comptage**. La mention
  « bonus raciaux inclus » de `character-builder.md` est **obsolète**.
- Choix & overrides bien modélisés : ASI, `character_features.choices`, sous-classe,
  overrides `grant`/`revoke`. ✅

L'intention « dériver puis appliquer choix + overrides » est réalisée — **mais seulement
pour l'espèce et les dons**.

---

## 3. L'écart structurel

`classes` = `hitDice` + `spellcastingAbility`. `backgrounds` = arrays. **Aucune donnée de
maîtrise/JS/compétences-au-choix de classe en DB** : elle est calculée dans
`app/data/character-builder.ts`, transmise au `POST`, gelée en lignes par-perso.
Conséquences : front = source de vérité, aucune propagation, pas de validation serveur,
et **duplication qui double en 5.5**.

Sous-écart : **incohérence de matérialisation**. Traits d'espèce = 100 % dérivés ;
features de classe = matérialisées en `character_features`. Deux modèles pour « ce que le
perso possède ».

---

## 4. Les trois catégories de données de classe

Le refactor doit distinguer **trois natures**, pas deux :

| Catégorie | Nature | Modélisation cible |
|---|---|---|
| **Grants passifs** (maîtrises, JS, résistances) | toujours actif | **effects** sur features de classe |
| **Faits d'identité** (dé de vie, niveau de sous-classe, type d'incantation, maîtrise d'armes 5.5) | statique | **colonnes** sur `classes` |
| **Points de choix** (sous-classe, pacte, style de combat, expertise…) | décision requise à un niveau | **modèle référence + config** (§6) |

Principe : **grant accordé → effect ; fait structurel → colonne ; décision → choix.**
Aligner classe & historique sur ce que l'**espèce** fait déjà (pattern de référence).

Extensions nécessaires à l'union `Effect` :
- **nouveau** `saving_throw_proficiency` (les JS n'ont aujourd'hui aucun type d'effet)
- **enrichir** `skill_proficiency_choice` : `{ count }` → `{ count, from }` (la liste
  d'options manque)

---

## 5. Quel est l'état des choix aujourd'hui ?

**Config (le choix résolu) : existe mais éparpillé.**

| Choix | Stockage actuel |
|---|---|
| Sous-classe | `character_classes.subclassId` |
| Pacte | `character_classes.pactBoon` |
| ASI | table `character_ability_score_improvements` |
| Choix de don | `character_features.choices` (JSON) |
| Invocations | lignes `character_features` |
| **Style de combat** | stocké mollement comme feature texte, **effet non câblé** |

**Référence (quoi/quand/parmi quoi) : 100 % front, ET dupliquée.** `needsPactBoon`,
`needsInvocations`, `needsFightingStyle` existent **à la fois** dans `StepClass.vue`
(builder) **et** dans `useLevelUp` (`LU_FIGHTING_STYLE_LEVELS`, `LU_EXPERTISE_LEVELS`…).
`subclassLevel` est une donnée front. Ajouter/changer une règle = éditer deux
implémentations front.

---

## 6. Modèle de choix unifié (référence + config)

Deux tables, **owner-agnostiques** (une classe, sous-classe, espèce ou historique peut
imposer un choix) :

```
── RÉFÉRENCE (la « table de références » / progression) ───────────────
choice_points
  id, ownerType('class'|'subclass'|'species'|'background'), ownerId,
  level, kind, count, optionSource (JSON), prerequisites?

  ex: (class:Occultiste, level 3, kind='pact_boon',      count=1, options={chain,blade,tome})
      (class:Guerrier,   level 3, kind='subclass',       count=1, options=<subclasses>)
      (class:Guerrier,   level 1, kind='fighting_style', count=1, options=<features 'fighting_style'>)
      (class:Roublard,   level 1, kind='expertise',      count=2, options=<compétences maîtrisées>)
      (background:*,      level 1, kind='ability_scores', count=1, options=<triade 5.5>)

── CONFIGURATION (au niveau de la fiche) ──────────────────────────────
character_choices
  characterSheetId, choicePointId, classLevel,
  selectedType('value'|'feature'|'subclass'), selectedRef | selectedValue
```

**Pourquoi c'est robuste/modulaire :**
- **Une seule source de vérité** par classe → builder ET level-up lisent `choice_points`
  (les `needs*` disparaissent du front).
- **Tout choix est enregistré et câblé** : un choix résolu peut pointer vers une
  **feature**, qui porte déjà des **effects** → le style de combat matérialise enfin son
  effet (+1 CA…), comme le reste.
- **Le pattern est déjà validé dans l'app** : les **invocations** sont *déjà* « choisis N
  features parmi un ensemble → matérialisées en `character_features` ». La sous-classe
  aussi. On **généralise deux mécaniques ad hoc en une seule**.
- **Ajouter une classe 5.5 = insérer des lignes**, pas coder des `needs*`.

**Cohabitation** : `subclassId`/`pactBoon` restent le temps de migrer vers
`character_choices` ; la référence s'introduit de façon additive.

---

## 7. Autres tables & points à revoir (ce qu'on avait failli oublier)

| Table / sujet | Constat | Action |
|---|---|---|
| **`spell_classes`** | La **liste de sorts par classe change en 5.5** (des sorts entrent/sortent des listes). Le mapping sort↔classe est **édition-dépendant**. | Ajouter `ruleset` sur `spell_classes` (ou un modèle de liste par édition). ⚠️ à ne pas oublier. |
| **`backgrounds`** | Modélisé en **arrays** (pas de features/effects) → incohérent avec espèce/classe. En 5.5 : + triade de carac. (choix) + don d'origine (feature). | Aligner sur le pattern : `background_features` (join) + effects + un `choice_point` pour la triade. |
| **`features`** | Les **dons** (`featureType='feat'`) n'ont pas de parent → n'héritent pas du ruleset. | Ajouter `features.ruleset` (utile seulement pour les feats standalone). |
| **`items`** | Pas de propriété de **maîtrise d'armes** (weapon mastery 5.5). | Ajouter `mastery_property` sur les armes. |
| **`character_ability_scores`** | Aujourd'hui, les bonus de choix (demi-elfe, humain variant) sont **cuits dans la base**. | En 5.5, garder `character_ability_scores` = **base pure** et dériver la triade d'historique via `choice → ability_increase` (cohérence avec §2). |
| **`subclasses`** | Héritent du ruleset via `classId`. | ✅ pas de colonne à ajouter. |
| **`character_classes.pactBoon` / `subclassId`** | Choix ad hoc. | Migrables vers `character_choices` (additif). |

---

## 8. Calculs front vs autorité serveur

Constat : **le moteur de règles vit dans les composables client ; le serveur est un
simple entrepôt** qui fait confiance aux valeurs calculées par le client (`d.maxHp`,
`d.classSavingThrows`, `d.armorProficiencyKeys`…).

Nuance importante : il **ne faut pas** tout déplacer en endpoints API — la dérivation
d'affichage (modificateurs, mods de compétence, CA, DD de sort) doit rester **client pour
la réactivité instantanée**. Le vrai problème est ailleurs :

1. **Duplication de la logique de règles.** Les tables d'emplacements de sorts existent en
   **triple** : `POST` (`FULL_SLOTS`/`HALF_SLOTS`), front (`FULL_CASTER_SLOTS`) et
   level-up. La formule de PV max est dans le builder **et** dans le level-up.
   → **Extraire dans `shared/`** une seule fois (slots, PV, DD, prof bonus) — utilisable
   client *et* serveur.
2. **Le serveur ne dérive pas, il fait confiance.** `classSavingThrows`, maîtrises, `maxHp`
   sont calculés côté client depuis `app/data` puis écrits tels quels.
   → Une fois le catalogue en DB (§4) + la logique en `shared/`, **le POST dérive
   lui-même** depuis l'entité au lieu de faire confiance au client. Robuste + non
   contournable.

En résumé : **pas « déplacer les calculs en API », mais « extraire le moteur de règles en
`shared/` et donner au serveur l'autorité de dérivation sur ce qu'il persiste ».**

---

## 9. La décision de migration + le séquencement

Faire passer les grants de classe de **figé** à **dérivé** touche les persos **2014
existants** :
- **Additif** *(reco)* : nouveaux persos dérivent ; anciens gardent leurs snapshots
  (overrides redondants mais inoffensifs) ; migration du 2014 plus tard, une fois
  l'équivalence prouvée. **Zéro régression.**
- **Big-bang** : migration immédiate, état final le plus propre, mais migration de
  données + tests d'équivalence obligatoires d'emblée.

**Séquencement (validé) :**

- **Phase 0 — fait** : discriminant `ruleset` (migration 0073).
- **Phase 1 — base propre, iso-2014, test-guardée** :
  - tests d'équivalence 2014 (le filet, à écrire **en premier**)
  - union `Effect` étendue (`saving_throw_proficiency`, `skill_proficiency_choice {count,from}`)
  - colonnes d'identité sur `classes` ; alignement `backgrounds`
  - modèle de choix (`choice_points` + `character_choices`)
  - moteur de règles extrait en `shared/` (slots, PV, DD)
  - endpoints `GET /api/catalog/*` ; builder **et** level-up lisent la DB
  - `app/data/character-builder.ts` réduit au flavor
- **Phase 2 — versioning 5.5** : seed du contenu 5.5 + UI d'origines (bonus portés par
  l'historique) + fiche ruleset-aware. « Données + flag ».

---

## 10. Points non couverts par cet audit (à confirmer si besoin)

- `useLevelUp` / `level-up.post.ts` : suit a priori le même modèle de matérialisation,
  non relu en détail (mais on sait qu'il **duplique** la logique de choix du builder — §5).
- Sync offline (`useOfflineSync`, `useOfflineMutation`) : hors périmètre.
- **Casse des clés de compétence** : le front builder utilise `sleightOfHand` (camelCase),
  la DB/composables `sleight_of_hand` (snake_case) — à réconcilier lors du refactor
  builder→API (piège silencieux).
