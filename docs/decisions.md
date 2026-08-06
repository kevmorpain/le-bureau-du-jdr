# Journal de décisions (ADR)

Décisions d'architecture du chantier D&D 5.5 et du nettoyage du socle. Format court :
**Contexte → Décision → Pourquoi**. Les détails techniques vivent dans
[`rules-engine.md`](./rules-engine.md) ; les constats dans [`architecture-audit.md`](./architecture-audit.md).

---

### <a id="d1"></a>D1 — Cohabitation 5 / 5.5, pas remplacement
- **Contexte** : l'app ne gère que la 2014 ; on veut ajouter la 2024.
- **Décision** : les deux systèmes cohabitent ; le ruleset est **figé par personnage** à la création.
- **Pourquoi** : les fiches existantes restent intactes et jouables ; les deux systèmes ne sont pas compatibles poste à poste.

### <a id="d2"></a>D2 — Valeur du ruleset = `'5'` / `'5.5'`
- **Décision** : discriminant `ruleset` (`'5'` | `'5.5'`) sur `character_sheets`, `character_species`, `classes`, `backgrounds`. Millésimes 2014/2024 = repères de lecture seulement.
- **Pourquoi** : noms quasi officiels ; permet à deux entités homonymes (Elfe 5 vs 5.5) de coexister sans matching de nom fragile.
- **Séquencement** : le flag distingue les éditions = **enablement**, pas fondation → posé en **Phase 2**, *après* la phase de clean (cf. roadmap `dnd-5.5.md`). Un prototype de migration a été retiré pour repartir propre.

### <a id="d3"></a>D3 — Classe & historique deviennent dérivables comme l'espèce
- **Contexte** : l'espèce dérive tout via `features`+`effects` ; classe & historique figent leurs grants à la création depuis le front.
- **Décision** : aligner classe & historique sur le pattern espèce. **Grants → effects** ; **identité fixe → colonnes** ; **choix → `progression`** (D4).
- **Pourquoi** : rejette l'idée initiale de colonnes plates (`saving_throws`, `ability_bonuses`) qui **dupliqueraient** ce que les effects font déjà pour l'espèce. On généralise un pattern éprouvé, pas un compromis.

### <a id="d4"></a>D4 — Modèle de choix `progression` + `character_choices`, owner = `featureId`
- **Contexte** : la « référence » des choix (quoi/quand/parmi quoi) est front-only et dupliquée builder↔level-up ; la config est éparpillée (subclassId, pactBoon, ASI, choices JSON).
- **Décision** : table `progression` (référence) liée à une **`feature`** + table `character_choices` (config). Owner = `featureId` (pas d'owner polymorphe).
- **Pourquoi** : la feature porte déjà niveau/owner/ruleset ; « la table de références = quoi/quand » **est** `features`. Une seule source, builder & level-up la lisent.

### <a id="d5"></a>D5 — Valeurs typées / FK, pas de texte libre
- **Décision** : unions typées pour les ensembles fermés (`kind`, `pact_boon`…) ; **FK** partout où une table existe (`selectedSubclassId`, `selectedFeatureId`, `selectedSpellId`, `selectedAbilityId`) ; strings typées seulement pour ce qui n'a pas de table (compétences/langues/outils).
- **Pourquoi** : intégrité + pas de magic strings ; cohérent avec `ability_scores` déjà en table+FK.

### <a id="d6"></a>D6 — Couche `shared/rules/` : const canonique par ensemble fermé
- **Contexte** : chaque ensemble fermé est défini 3–5× (union + enum + table + Zod recopié) → dérive déjà constatée (casse des compétences).
- **Décision** : **une const canonique** par ensemble dans `shared/rules/` ; type, Zod, table et i18n en **dérivent**.
- **Pourquoi** : source unique de vérité ; **dissout le débat table-vs-union** (la table devient une projection seedée). Héberge aussi le moteur de règles (slots, PV).

### <a id="d7"></a>D7 — Table `skills` maintenant (langues/outils plus tard)
- **Décision** : créer une table `skills` dès la Phase 1 ; différer `languages`/`tools`.
- **Pourquoi** : cohérence avec `ability_scores` (déjà en table), intégrité FK, et ça **force** la casse canonique → répare le bug `sleightOfHand`/`sleight_of_hand`. Langues/outils = ensembles plus ouverts, non bloquants.

### <a id="d8"></a>D8 — Résolution des choix : dériver live, pas matérialiser
- **Décision** : un choix résolu n'est pas matérialisé en `character_features` ; la fiche dérive les features/effets actifs en joignant `character_choices → features` + gating niveau. On ne matérialise que l'état runtime (`currentUses`).
- **Pourquoi** : cohérent avec l'intention « dériver un max » (l'espèce le fait déjà) ; moins de données figées à re-synchroniser.

### <a id="d9"></a>D9 — Retrofit 5.5-first
- **Décision** : les fondations transverses (`shared/rules/`, casse, union `Effect`, transactions, DRY API) touchent le 2014 sous tests d'équivalence. Les virages de comportement (grants de classe → effects, backgrounds → features) sont construits **pour le 5.5 d'abord** ; le 2014 est retrofité plus tard.
- **Pourquoi** : migration **additive** = zéro régression ; on prouve le modèle sur le 5.5 avant de migrer l'existant.

### <a id="d10"></a>D10 — Résolution = fonction pure partagée
- **Décision** : séparer **catalogue** (statique, cachable au edge par ruleset) et **projection perso** (dynamique). `resolve(character, catalog)` est une **fonction pure dans `shared/rules/`**, lancée par le serveur (autorité) *et* le client (UX).
- **Pourquoi** : une logique, deux appelants, zéro duplication. Le cache découle du fait que le catalogue est pur.

### <a id="d11"></a>D11 — Labels via i18n, structure en const
- **Décision** : les consts `shared/rules/` portent la structure (clés machine + relationnel) ; les labels vivent dans l'i18n (`@nuxtjs/i18n`, `fr.json`). Erreurs via `nuxt-zod-i18n` (déjà installé).
- **Pourquoi** : const = structure, i18n = présentation ; cohérent avec l'investissement i18n existant ; prêt pour l'EN.

### <a id="d12"></a>D12 — Tests par contrat, pas snapshots aveugles
- **Décision** : assertions sur des **valeurs D&D vérifiées à la main** (fixtures : Ambroise + 1 martial + 1 caster), d'abord sur les sous-composables purs puis sur les fonctions extraites en `shared/rules/`.
- **Pourquoi** : un snapshot brut fige les bugs pré-existants et casse au moindre changement de forme ; le contrat révèle les bugs et devient le moteur du refactor.

### <a id="d13"></a>D13 — Migration additive
- **Décision** : construire le modèle propre pour le neuf ; les persos 2014 gardent leurs snapshots (redondants, inoffensifs) ; migration big-bang du 2014 plus tard, une fois l'équivalence prouvée.
- **Pourquoi** : zéro régression, transition douce.

### <a id="d14"></a>D14 — API : atomicité + autorité de dérivation
- **Décision** : `db.batch()` (atomique D1) sur les écritures multiples ; le serveur **dérive et valide** au lieu de faire confiance aux valeurs calculées par le client.
- **Pourquoi** : un insert échoué ne doit pas laisser un personnage à moitié créé ; anti-triche + robustesse. Détails : `rules-engine.md` §API.

### <a id="d15"></a>D15 — Matérialisation = grants passifs seulement ; une option se reconnaît à son `tag`
- **Contexte** : la classe est encore **matérialisée** (features copiées dans `character_features` à la création/au level-up) — la [D8](#d8) veut à terme la *dériver live* comme l'espèce, mais c'est le point 6 de la roadmap. Or le lot 4c introduit des features-**options** (les 3 faveurs de pacte, puis métamagie/manœuvres/styles) en `class_feature`/`subclass_feature` : les sweeps de matérialisation existants (`WHERE class_id … AND feature_type = 'class_feature' AND level ≤ …`) les attribueraient **toutes** d'office.
- **Décision** : les sweeps ne matérialisent que les **grants passifs** ; une feature qui est une **option d'un groupe de choix** se reconnaît à son **`tag` non nul** (la sémantique posée en [4b](#d6)/`shared/rules/featureTags.ts` : « un tag marque une feature qui est une option »). Prédicat nommé `isPassiveGrant()` (`server/utils/features.ts`) = `isNull(features.tag)`, appliqué aux quatre sweeps (create + level-up, classe + sous-classe). Une option n'est obtenue que si elle est **choisie** (`progression` + `character_choices`) puis dérivée live.
- **Pourquoi** : ce n'est pas une rustine mais l'application directe du concept que `tag` encode — et ça **généralise** à tous les groupes futurs sans code supplémentaire. Les alternatives (détacher l'option de sa classe via `class_id = NULL`, ou un `feature_type` dédié par groupe) exploitent un effet de bord et cassent l'appartenance / regonflent l'union de types. **No-op prouvable** aujourd'hui (aucune `class_feature`/`subclass_feature` n'est taguée ; les invocations sont hors sweeps par leur `feature_type`). **Jalon provisoire** : disparaît quand la classe cessera d'être matérialisée (point 6).

### <a id="d16"></a>D16 — Sourcing du contenu 5.5 : aidedd + validation par lots (option A)
- **Contexte** : le contenu 5.5 (espèces, historiques, classes, dons, maîtrise d'armes) doit être seedé avec une **exactitude élevée** (une valeur fausse = fiche fausse) ; `WebFetch` fonctionne sur aidedd (cf. `dnd-5.5.md` §4) mais passe par un petit modèle d'extraction qui **bruite**.
- **Décision** : **source = aidedd** — c'est la traduction FR **officielle** du PHB 2014 **et** 2024, donc la page FR fait autorité pour les libellés. **Méthode = option A** : pour chaque volet, fetch des pages de **détail** → présentation d'une **table validée par l'auteur** → seed. L'EN (`/feat/<slug>`, `/en/<class>-2024/`) sert au mapping libellé FR → clé machine EN ([D11](#d11)) et de contrôle anti-bruit.
- **Pourquoi** : garde la vitesse du fetch tout en plaçant l'**autorité d'exactitude sur l'auteur**, volet par volet, et attrape le bruit d'extraction **avant** le seed. Cohérent avec le contenu 2014, déjà issu d'aidedd. Deux règles dures (page de détail uniquement ; recouper chaque entrée) : `dnd-5.5.md` §4.
