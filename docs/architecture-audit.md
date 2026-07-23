# Audit — Système d'effets & dérivation des données de personnage

> **But** : vérifier que le socle (effects uniformes + dérivation depuis classe/espèce/
> historique) est sain **avant** d'y greffer le support 5.5. Fait à partir du code réel
> (composables + endpoints + seeds), pas des docs.

## Verdict global

Le socle est **largement sain**. Le système d'effets est bien conçu et réellement
réutilisable. La dérivation « entité → + choix → + overrides » **est réalisée pour
l'espèce, les dons et les objets**. Il reste **un écart structurel** : la **classe** et
l'**historique** ne sont pas des entités dérivables — leurs mécaniques vivent dans le
front (`app/data/character-builder.ts`) et sont **figées à la création** en lignes
par-personnage. C'est le principal chantier de robustesse, et il conditionne le 5.5.

---

## 1. Le système d'effets

- Table `effects` = **union discriminée typée** (`ability_increase`, `skill_proficiency`,
  `weapon_proficiency`, `darkvision`, `damage_resistance`, `spell_grant`…), dédupliquée
  par `(type, value)` au seed.
- Branchée via **deux tables de jointure** : `feature_effects` (feature → effect) et
  `item_effects` (item → effect).
- Consommation : agrégation en `allEffects` (`useCharacterSheet`) puis `filter(e => e.type === …)`.

**Émetteurs d'effets :**

| Entité | Via | État |
|---|---|---|
| Traits d'espèce | `species_features` → `feature_effects` | ✅ riche |
| Features de classe / sous-classe | `features` → `feature_effects` | ⚠️ présents mais **quasi vides** (les maîtrises n'y sont pas) |
| Dons | `features` (type `feat`) → `feature_effects` | ✅ (avec résolution des choix) |
| Invocations | `features` (type `eldritch_invocation`) | ✅ |
| Objets magiques | `item_effects` | ✅ |
| **Sorts** | — (modèle propre `damages`/`heal`/`dc`/`multiAttack`) | ✅ **volontaire** |
| **Stats de base d'arme** | — (modèle propre `properties`) | ✅ **volontaire** |

**Conclusion** : bon design. La frontière « effects = modificateurs passifs ; sorts &
armes = mécaniques actives avec modèle riche » est **saine**, pas un défaut. Point mineur :
les deux tables de jointure ont la même forme (owner non polymorphe) — acceptable, à
surveiller si un 3ᵉ émetteur apparaît.

---

## 2. La dérivation des données de personnage

Constat central : **split net entre dérivé et figé.**

| Donnée | Traitement | Preuve |
|---|---|---|
| Bonus de carac. (espèce) | **Dérivé** (effect `ability_increase`) | `useCharacterAbilities` : `total = base + species + feature + asi` |
| Compétences / langues / outils d'**espèce & dons** | **Dérivé** (effects + overrides) | `useCharacterSheet.languageProficiencies`, `skillProficiencies` |
| Vision, résistances, sorts accordés, bonus PV/init/passifs | **Dérivé** (effects) | `useCharacterConditions`, `useCharacterAbilities` |
| Compétences de **classe** | **Figé** → `character_skills` (source `class`) | `POST` : `d.classSkills.map(...)` |
| Jets de sauvegarde de **classe** | **Figé** → `character_skills` (`${ab}_save`) | `POST` : `d.classSavingThrows.map(...)` |
| Maîtrises armes/armures/outils/langues de **classe & historique** | **Figé** → `character_proficiency_overrides` (`grant`) | `POST` : `d.armorProficiencyKeys.map(...)` |

**Deux confirmations rassurantes :**
- Les **carac. de base sont bien stockées comme base** (le builder envoie
  `state.abilities`, pas les finales ; les bonus raciaux viennent des effects).
  → `total = base + effects` est **correct, sans double comptage**. La mention
  « scores avec bonus raciaux inclus » de `character-builder.md` est **obsolète**.
- Les **choix & overrides sont bien modélisés** : ASI
  (`character_ability_score_improvements`), choix de don (`character_features.choices`),
  sous-classe (`character_classes.subclassId`), overrides `grant`/`revoke`
  (`character_proficiency_overrides`). ✅

**L'intention « dériver de l'entité, puis appliquer choix + overrides » est donc réalisée
— mais seulement pour l'espèce et les dons.** Classe & historique la court-circuitent.

---

## 3. L'écart structurel (le vrai sujet)

`classes` = `hitDice` + `spellcastingAbility` uniquement. `backgrounds` = arrays de
compétences/outils/langues. **Aucune donnée de maîtrise/JS/compétences-au-choix de classe
n'existe en DB.** Elle est calculée dans `app/data/character-builder.ts`, transmise au
`POST`, et gelée en lignes par-perso. Conséquences :

1. **Le front est la source de vérité**, pas l'entité DB.
2. **Aucune propagation** : corriger une classe ne met pas à jour les persos existants.
3. **Le serveur ne peut ni dériver ni valider** les grants de classe.
4. **La duplication va doubler en 5.5** (deux jeux de données front à maintenir).

**Sous-écart — incohérence de matérialisation.** Deux modèles pour « ce que le perso
possède » :
- Traits d'**espèce** : **100 % dérivés** (jamais stockés par perso ; lus depuis
  `species.speciesFeatures`).
- Features de **classe** : **matérialisées** en `character_features` (une ligne par
  feature possédée, effets résolus live).

La matérialisation des features de classe est en partie justifiée (choix : sous-classe,
dons, ASI ; portes de niveau). Mais les features **sans choix** (ex. « Second souffle »
niv.1) sont aussi figées en lignes → même fragilité que les snapshots.

---

## 4. Recommandation — aligner classe & historique sur le pattern « espèce »

Le vrai axe n'est pas « colonnes vs effects » mais **« rendre la classe & l'historique
dérivables comme l'espèce »**. L'espèce est l'implémentation de référence de l'intention,
et elle fonctionne. On la généralise :

- **Grants → effects** (dérivés, plus de front) :
  - maîtrises armes/armures/outils → `weapon_proficiency` / `proficiency` (existants)
  - jets de sauvegarde → **nouvel effet `saving_throw_proficiency`**
  - compétences au choix → **enrichir `skill_proficiency_choice`** avec la liste
    `{ count, from }` (aujourd'hui `{ count }` seul — la liste `from` manque)
  - historique 5.5 : triade de carac. → `ability_increase_choice` (existe déjà !)
- **Faits d'identité / progression → colonnes sur `classes`** (ce ne sont pas des grants) :
  `subclass_level`, `spellcasting_type`, (`hit_dice` déjà là), + 5.5 `weapon_mastery_count`.

Principe : **grant accordé au perso → effect ; fait structurel de l'entité → colonne.**
Ce n'est pas un compromis risqué : c'est aligner la classe sur un pattern déjà éprouvé
sur l'espèce, qui dérive déjà ses maîtrises live.

---

## 5. La seule décision qui porte un risque

Faire passer les grants de classe de **figé** à **dérivé** change le comportement des
persos **2014 existants** (leurs maîtrises viendraient de l'entité, plus de lignes gelées) :

- **Big-bang** : on retire les lignes snapshot et on dérive tout. État final le plus
  propre ; nécessite une migration de données + des tests d'équivalence (le perso doit
  afficher exactement les mêmes maîtrises avant/après).
- **Additif** : les nouveaux persos (5.5 et suivants) dérivent ; les anciens gardent
  leurs snapshots (qui deviennent des overrides redondants mais inoffensifs) ; on nettoie
  plus tard. **Zéro régression**, transition douce.

→ **Reco : additif.** On construit le pattern dérivé pour le 5.5, on le fait cohabiter,
et on migre le 2014 dans un second temps une fois l'équivalence prouvée par des tests.

---

## 6. Impact sur le découpage (révision du Lot 0)

- **Lot 0a — fait** : discriminant `ruleset` (migration 0073).
- **Lot 0b — socle dérivation classe** : enrichir l'union `Effect`
  (`saving_throw_proficiency`, `skill_proficiency_choice {count, from}`) + colonnes
  d'identité sur `classes` + endpoints `GET /api/catalog/*` qui exposent l'entité résolue.
- **Lot 0c — builder lit la DB** : le builder consomme le catalogue via l'API ;
  `app/data/character-builder.ts` se réduit au flavor. À **iso-2014** (aucun contenu 5.5).
- **Tests d'équivalence** : un perso 2014 créé avant/après doit être identique (maîtrises,
  JS, compétences). C'est le filet qui autorise la migration additive → big-bang plus tard.

---

## 7. Points non couverts par cet audit (à confirmer si besoin)

- `useLevelUp` / `level-up.post.ts` : suit a priori le même modèle de matérialisation
  (`character_features`), non relu en détail ici.
- Sync offline (`useOfflineSync`, `useOfflineMutation`) : hors périmètre.
- Cohérence i18n des clés de compétences (`sleight_of_hand` vs `sleightOfHand` : la DB
  et le front n'utilisent pas la même casse — à vérifier lors du refactor builder→API).
