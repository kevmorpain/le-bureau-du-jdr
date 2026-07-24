# Audit du socle — constats

> **Photo à l'instant T** de la santé du code actuel, faite à partir du code réel
> (composables + endpoints + seeds). Le « quoi construire » est dans
> [`rules-engine.md`](./rules-engine.md), le « pourquoi » dans [`decisions.md`](./decisions.md),
> le plan dans [`dnd-5.5.md`](./dnd-5.5.md).

## Verdict global

Socle **largement sain** : système d'effets bien conçu, dérivation « entité → choix →
overrides » réelle **pour l'espèce, les dons, les objets**. Cinq écarts à corriger avant le 5.5 :

1. **Classe & historique non dérivables** — grants figés à la création depuis le front (§3).
2. **Points de choix non modélisés** — référence front-only *et dupliquée* builder↔level-up (§5).
3. **Ensembles fermés définis 3–5×** — dérive déjà constatée (casse des compétences) (§6).
4. **Le serveur fait confiance au client** au lieu de dériver/valider (§7).
5. **Écritures non atomiques + duplication de règles** côté API (§8).

→ Solutions dans [`rules-engine.md`](./rules-engine.md).

---

## 1. Le système d'effets — sain

- `effects` = union discriminée typée, dédupliquée par `(type, value)`, branchée via
  `feature_effects` / `item_effects`, agrégée en `allEffects` puis filtrée par type.
- Émetteurs : espèce ✅ (riche), features classe/sous-classe ⚠️ (**quasi vides** : les
  maîtrises n'y sont pas), dons ✅, invocations ✅, objets magiques ✅.
- **Sorts** & **stats d'arme** = modèles propres → **sain** (mécaniques actives ≠
  modificateurs passifs).

Point mineur : deux tables de jointure de même forme (owner non polymorphe).

---

## 2. La dérivation — à moitié appliquée

| Donnée | Traitement |
|---|---|
| Bonus de carac. (espèce), compétences/langues/outils d'espèce & dons, vision, résistances, sorts accordés | **Dérivé** (effects + overrides) ✅ |
| Compétences / JS / maîtrises de **classe & historique** | **Figé** → `character_skills`, `character_proficiency_overrides` ❌ |

**Confirmations** : les carac. sont **stockées en base** (le builder envoie `state.abilities`,
pas les finales) → `total = base + effects` correct, **sans double comptage** (la doc
`character-builder.md` disait le contraire, corrigé). Choix & overrides (ASI,
`character_features.choices`, sous-classe, grant/revoke) bien modélisés.

**Mais** l'intention n'est réalisée que **pour l'espèce et les dons**.

---

## 3. L'écart structurel

`classes` = `hitDice` + `spellcastingAbility` ; `backgrounds` = arrays. **Aucune donnée de
maîtrise/JS/compétences de classe en DB** → calculée dans `app/data/character-builder.ts`,
transmise au POST, gelée par-perso. Conséquences : front = source de vérité, aucune
propagation aux persos existants, pas de validation serveur, **duplication qui double en 5.5**.

**Sous-écart** : matérialisation incohérente — traits d'espèce = 100 % dérivés ; features de
classe = matérialisées en `character_features` (même les features sans choix).

---

## 4. Trois natures de données de classe

L'audit révèle qu'il faut distinguer **trois** natures, pas deux : **grants passifs**
(toujours actifs), **faits d'identité** (statiques), **points de choix** (décision à un
niveau). Le refactor s'articule là-dessus → [`rules-engine.md`](./rules-engine.md) §3.

---

## 5. L'état des choix — éparpillé + référence dupliquée

**Config (choix résolu) : éparpillée**
- sous-classe → `character_classes.subclassId`
- pacte → `character_classes.pactBoon`
- ASI → `character_ability_score_improvements`
- don → `character_features.choices` (JSON)
- invocations → `character_features`
- **style de combat → feature texte, effet NON câblé** ❌

**Référence (quoi/quand/parmi quoi) : 100 % front, ET dupliquée** — `needsPactBoon` /
`needsInvocations` / `needsFightingStyle` existent dans `StepClass.vue` **et** dans
`useLevelUp` (`LU_FIGHTING_STYLE_LEVELS`…). Ajouter une règle = éditer deux implémentations front.

---

## 6. Ensembles fermés définis 3–5×

- **Types de dégâts (4×)** : union `DamageTypeKey` (`effects.ts`) + `enum DamageType`
  (`spells.ts`) + table `damage_types` + JSON de seed.
- **Caractéristiques (5×+)** : union `AbilityScoreKey` + `enum AbilityScore` + table +
  **`z.enum(['str',…])` recopié** dans `index.post.ts` (×3), `level-up.post.ts`, `feats.post.ts`.
- **Compétences : le bug de casse est LIVE** — `useLevelUp.ts` et `character-builder.ts`
  utilisent `sleightOfHand`/`animalHandling` (camelCase), pendant que `abilitySkillKeys` et
  la DB utilisent `sleight_of_hand`/`animal_handling` (snake_case). **Déjà divergé.**

---

## 7. Calculs front vs autorité serveur

Le moteur de règles vit dans les composables client ; le serveur **fait confiance** aux
valeurs calculées (`maxHp`, `classSavingThrows`, maîtrises, slots). Duplication : les tables
d'emplacements de sorts existent en **triple** (POST + front + level-up), la formule de PV en
double.

---

## 8. Observations API

Auth/ownership **déjà correct** (middleware `character-sheets-authz`) ; helper `useDrizzle()`
**existe mais est contourné** (`db` de `hub:db` + `srcSchema` + `as any` partout).

- **Aucune transaction** : le POST fait ~10 inserts non atomiques → personnage à moitié créé
  si échec.
- **Boilerplate `[id]` répété** ~20× (`if(!id) 400` + `findFirst` + `404`).
- **Erreurs incohérentes** : formes variées, mix FR/EN.
- **Read-model du GET lourd** : arbre profond, `featureEffects→effect` niché deux fois.
- **Endpoints catalogue épars** (`character_species.get`, `classes.get`, `feats/index.get`…),
  tous devront prendre un `ruleset`.

---

## 9. Points non couverts (à confirmer si besoin)

- `useLevelUp` / `level-up.post.ts` : même modèle de matérialisation, non relu en détail
  (mais duplique la logique de choix — §5).
- Sync offline (`useOfflineSync`, `useOfflineMutation`) : hors périmètre.
- Casse des clés de compétence : à réconcilier par `shared/rules/skills.ts` (§6).
