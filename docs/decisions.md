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

### <a id="d17"></a>D17 — Espèce = base + lignée, sous-entité symétrique de la sous-classe (unifié 2014/2024)
- **Contexte** : le 2014 modélise les variantes d'espèce comme des **espèces séparées** (Haut-elfe, Nain des montagnes…), et le regroupement « base → variante » n'existe QUE dans le front hardcodé (`app/data/character-builder.ts`, champ `subraces[]`, base virtuelle `dbName:null`). La 2024 rebaptise « race » en **origine** et présente « espèce de base + **lignée** choisie » avec des bénéfices **étagés** par niveau (Drow : sorts niv.1/3/5). Les deux structures sont le même concept.
- **Décision** : first-classer ce concept dans les **données**, calqué sur `classes → subclasses`. Nouvelle table **`species_lineages`** (FK `species_id`, parent-gated, sans `ruleset` comme `subclasses`) ; **`features.lineage_id`** + `feature_type='lineage_feature'` (features de la lignée, gated par `level_required`) ; choix via **`progression` + `character_choices.selected_lineage_id`**. La base (`character_species`) porte les traits communs (`species_features`) ; les bonus de carac. 2014 d'une variante = `ability_increase` sur ses features ; les bénéfices étagés = `spell_grant`/`unlockLevel` (déjà utilisés par le Tieffelin 2014). **Unifié pour les deux éditions** : le 2014 est **retrofité** (pas laissé en espèces séparées), coût de migration des fiches vivantes **assumé** (choix utilisateur « le plus propre et modulaire »).
- **Pourquoi** : un seul mécanisme couvre sous-race 2014 et lignée 2024, réutilise la machinerie de choix éprouvée (`progression`, lot 4c) et **vide** le blob front (roadmap : builder dérive du catalogue). Alternatives écartées : (a) « pareil que 2014 » = espèces séparées + regroupement hardcodé → alimente la dette qu'on supprime ; (b) colonne `parent_id` (B1) → unifie mais garde les variantes comme espèces séparées, moins fidèle à la 2024. La restructuration du 2014 se fait **additive + sous tests d'équivalence** ([D9](#d9)/[D12](#d12)/[D13](#d13)) : lots séparés (schéma → résolution → pilote Elfe + équivalence → migration des fiches → builder → rollout). Détails : `dnd-5.5.md` §3.

### <a id="d18"></a>D18 — Préférences : portées par la fiche, avec des défauts de compte hérités
- **Contexte** : l'app n'a **aucune couche de préférences** (ni table, ni colonne, ni composable ; `useStorage` ne porte que de l'état de jeu). Le besoin apparaît dès qu'on veut laisser le joueur reprendre la main — désactiver les jets de dés, saisir un résultat lui-même, surcharger une valeur dérivée (cf. [`fonctionnalites-manquantes.md`](./fonctionnalites-manquantes.md#n--contrôle-manuel--préférences), famille N). ⚠️ Décision **hors chantier 5.5** : elle ne touche ni les règles ni le ruleset, mais elle contraint le schéma, d'où sa place ici.
- **Décision** : la préférence vit **sur `character_sheets`** ; `users` porte des **défauts** qui s'appliquent aux fiches n'ayant pas tranché. Résolution par **héritage live** — `fiche ?? compte ?? défaut codé` — et **non** par copie à la création. Conséquences directes :
  - colonne **nullable, SANS `DEFAULT`** : `NULL` signifie « hérite », qui n'est **pas** « désactivé ». Chaque réglage est donc **tri-état** (`oui` / `non` / `hérité`) côté schéma *et* côté UI (un `UCheckbox` binaire ne suffit pas) ;
  - stockage en **colonne JSON typée** `$type<Preferences>()` des deux côtés, avec un ensemble canonique unique dans `shared/` dont le type et le Zod **dérivent** ([D6](#d6)) — un nouveau réglage n'est alors pas une migration ;
  - résolution = **fonction pure partagée** serveur + client ([D10](#d10)), exposée **déjà résolue** par le GET fiche pour que le client ne ré-implémente pas la fusion. Le GET sélectionne déjà l'owner réduit à `{id, name}` : l'élargir à `{id, name, preferences}` est une ligne.
- **Pourquoi** :
  - **l'héritage plutôt que la copie** applique [D8](#d8) (« dériver, pas matérialiser ») : changer un défaut de compte se propage à toutes les fiches qui n'ont rien tranché, ce qui *est* le sens de « défaut ». Une copie à la création figerait un instantané et surprendrait — régler un défaut après coup ne changerait rien ;
  - **zéro backfill** : les fiches existantes restent à `NULL`, donc héritent, donc sont correctes sans migration de données ([D13](#d13)) ;
  - **la fiche comme porteuse** colle à l'usage : un personnage joué en théâtre de l'esprit et un autre sur grille n'ont pas les mêmes réglages, alors que le compte capture la préférence durable du joueur.
- **Écarté** : *tout sur `users`* (ne permet pas de varier par personnage) ; *tout en `localStorage`* (ne suit pas le joueur d'un appareil à l'autre, alors que l'app est une PWA installable) ; *une colonne typée par réglage* (une migration par préférence, pour un ensemble voué à grandir).

### <a id="d19"></a>D19 — PV max dérivés : la fiche ne stocke que la part « dés »
- **Contexte** : `character_sheets.max_hp` était une **somme stockée** dont chaque terme incluait le modificateur de CON *du moment*. Un +2 CON à un palier d'ASI (mod +2 → +3 au niveau 8) n'ajoutait aucun PV, alors qu'AideDD (« Au-delà du niveau 1 ») le veut : quand le modificateur de CON augmente de 1, le maximum augmente de 1 **par niveau atteint**. Seul Robuste était rétroactif, recalculé à l'affichage. Et le serveur, qui remet les PV au repos, ne connaissait pas le maximum effectif (Robuste, moitié à l'épuisement 4) : il restaurait la somme stockée (B16, #203).
- **Décision** : `max_hp` devient **`hp_base`** (migration 0117) : la part des dés lancés ou des valeurs fixes, **hors CON et hors bonus par niveau**. Le maximum se calcule à la lecture, par une fonction pure partagée (`shared/rules/hitPoints.ts`) : `hp_base + (mod CON + bonus `hp_per_level`) × niveau total`, divisé par deux (arrondi inférieur) à partir de l'épuisement 4, plancher à 1. Pour que le **serveur** connaisse la CON, le calcul des caractéristiques sort des composables du navigateur : `shared/rules/abilityScores.ts` (`computeAbilityScores`) et `shared/rules/characterEffects.ts` (effets d'espèce, de capacités, d'ASI ; objets équipés et liés ; effets temporaires), alimentés côté serveur par `server/utils/characterSheetLoader.ts` — le chargement du GET, désormais partagé avec le repos, le level-up et la création.
- **Conséquences** :
  - le **minimum de 1 PV par niveau** (« minimum 1 », AideDD) se joue **au gain** : `hitPointGain(dé, mod CON naturel)` relève la part stockée de ce qui manque ; le mod naturel exclut objets et effets temporaires, qui ne rendent pas un gain permanent ;
  - le level-up n'envoie plus que le **dé** (`hpDie`), le serveur le borne par le dé de la classe (borne haute qui manquait, #124) ; la création envoie `hpBase`, borné à `[niveau, niveau × dé]` ;
  - `hp_per_level` compte pour l'espèce et les objets, plus seulement les dons (l'éditeur d'objet le proposait, rien ne le lisait) ;
  - un objet équipé qui change la CON (Amulette de santé) ou un effet temporaire actif déplace le maximum, comme la règle l'exige ; l'« Édition directe » saisit le total affiché et stocke ce qui reste.
- **Migration des fiches existantes** : `hp_base = max_hp − mod CON actuel × niveau total`, sans reconstituer l'historique (les fiches qui avaient gagné de la CON en route avaient été corrigées à la main). Le score de CON actuel reprend en SQL les sources de `computeAbilityScores` ; `test/nuxt/hpBaseMigration.test.ts` vérifie, sur chaque source, que le maximum dérivé après migration égale celui d'avant.
- **Pourquoi** : applique [D8](#d8) (dériver, pas matérialiser) et [D10](#d10) (une règle pure partagée serveur + client) ; couvre d'un coup ASI, dons, objets, builder et level-up, là où une correction « au level-up seulement » aurait laissé les objets et l'édition des scores. **Écarté** : (b) ajouter Δmod × niveaux au level-up — ne couvre ni objets ni édition manuelle des scores.
- **Limites assumées** : la règle « un seul repos long par période de 24 h » (AideDD) n'est pas portée — l'app n'a pas d'horloge de jeu ; « Ténacité naine » du Nain des collines (+1 PV par niveau) n'émet toujours aucun effet `hp_per_level` (contenu, hors lot).

### <a id="d20"></a>D20 — Ressources de classe : le compteur existant, enrichi, plutôt qu'un « pool »
- **Contexte** : ki, points de sorcellerie, rages, Inspiration bardique… n'avaient aucune mécanique ([#142](https://github.com/kevmorpain/le-bureau-du-jdr/issues/142)–[#147](https://github.com/kevmorpain/le-bureau-du-jdr/issues/147)). Le registre y voyait « un concept de pool de ressource à concevoir une fois », car `currentUses` « compte des usages unitaires ».
- **Décision** : pas de table ni de concept neuf. `maxUsesFormula` + `rechargeType` + `currentUses` (dépensé) suffisent : le ki *est* un compteur dépensé par paquets. On y ajoute (1) les formules seedées, (2) des formules évaluées au **niveau de la classe propriétaire** (le contexte lisait toujours la classe principale), (3) `meta` (clé de réserve, `pool`, `whileActive`, `spends`, `cost`…), (4) un état `character_features.active`, (5) des effets typés à `Formula` dérivés par des fonctions pures partagées (`shared/rules/classResources.ts`).
- **Pourquoi** : une table d'état supplémentaire aurait dupliqué le compteur, sa remise à zéro au repos et son endpoint. Aucune règle par classe dans le code : tout est de la donnée seedée ([North Star](./consolidation-2014.md)), migrée par la 0120 sans reseed.
- **Conséquences** : le repos lit une seule règle côté serveur et client (`restRecovery`) ; un effet `resource_regain` exprime Source d'inspiration et la restauration du niveau 20 de l'ensorceleur ; les emplacements créés par la sorcellerie sont une colonne `created` (0121) remise à zéro au repos long ; la Rage suspendue en armure lourde l'est par donnée (`suspendedByHeavyArmor`).
- **Limites assumées** : Attaque supplémentaire ne se cumule pas (maximum), mais l'attaque de l'arme de pacte (Lame assoiffée) n'est pas comptée ; les sous-classes qui dépensent ki ou points restent en texte ; la Forme sauvage n'enregistre pas les PV de la bête ; la Rage ne s'arrête pas d'elle-même (inconscience, tour sans attaque) — seul un repos ou le bouton y met fin.

### <a id="d21"></a>D21 — CA sans armure et vitesse : deux effets nommés, `walking_speed` reste la vitesse de base
- **Contexte** : la CA d'un Barbare ou d'un Moine sans armure, le Déplacement rapide / sans armure et la Force requise des armures lourdes n'étaient pas calculés ([#141](https://github.com/kevmorpain/le-bureau-du-jdr/issues/141), [#148](https://github.com/kevmorpain/le-bureau-du-jdr/issues/148), [#157](https://github.com/kevmorpain/le-bureau-du-jdr/issues/157), [#160](https://github.com/kevmorpain/le-bureau-du-jdr/issues/160), [#136](https://github.com/kevmorpain/le-bureau-du-jdr/issues/136)). `walking_speed` avait deux sens : valeur **absolue** pour les traits d'espèce et de lignée (9, 10,5…), **bonus** pour le don Mobile et l'éditeur d'objets — et aucun lecteur côté fiche, si bien que Mobile ne donnait rien.
- **Décision** : `unarmored_defense` (base + caractéristiques, bouclier permis ou non) et `speed_bonus` (`Formula` + condition d'armure) sont des effets seedés ; le calcul est dans des fonctions pures (`shared/rules/armorClass.ts`, `shared/rules/speed.ts`). `walking_speed` ne désigne plus que la vitesse de base. La pénalité de 3 m de l'armure lourde suit la colonne Force d'AideDD (`strength_requirement`), pas le type d'armure ; l'effet `equipment_penalty` du Nain la neutralise. La migration 0123 requalifie les `walking_speed` d'un don ou d'un objet en `speed_bonus`, sans reseed.
- **Pourquoi** : additionner tous les `walking_speed` aurait doublé la vitesse des espèces ; une règle par classe (`if Barbare`) contredit le [North Star](./consolidation-2014.md). **Écarté** : lire `walking_speed` comme un bonus partout, et renommer la vitesse de base (la lignée et le catalogue la lisent comme absolue).
- **Limites assumées** : la CA sans armure retient la meilleure source (AideDD : on n'en cumule pas), même quand `10 + DEX` est meilleure ; le bouclier ne suspend pas la Résistance draconique (le texte dit « sans armure », là où le Barbare et le Moine citent le bouclier à part — lecture, pas citation) ; les bonus de vitesse ne s'appliquent pas au vol, à la nage, à l'escalade ni au creusement ; le récapitulatif du builder affiche encore la vitesse d'espèce seule.

### <a id="d22"></a>D22 — Moteur de jets : la fiche calcule la politique d'un jet, le lanceur l'applique
- **Contexte** : `roll()` jetait un d20 nu. La fiche *affichait* pourtant les désavantages (états, épuisement, armure, arme lourde), l'effet `reroll` du Halfelin et l'effet `advantage` étaient seedés, le critique ne colorait qu'un toast, et Touche-à-tout, Savoir-faire, Critique brutal ou le critique du Champion ne faisaient rien ([#108](https://github.com/kevmorpain/le-bureau-du-jdr/issues/108), [#132](https://github.com/kevmorpain/le-bureau-du-jdr/issues/132), [#140](https://github.com/kevmorpain/le-bureau-du-jdr/issues/140), [#149](https://github.com/kevmorpain/le-bureau-du-jdr/issues/149), [#150](https://github.com/kevmorpain/le-bureau-du-jdr/issues/150), [#182](https://github.com/kevmorpain/le-bureau-du-jdr/issues/182), [#183](https://github.com/kevmorpain/le-bureau-du-jdr/issues/183)).
- **Décision** : les règles sont pures et partagées (`shared/rules/rolls.ts`) : résolution du mode (annulation avantage / désavantage), tirage du d20 (relance, plancher, plage de critique), doublement des dés. Chaque jet de d20 de la fiche porte un type (`D20Kind`) ; `useCharacterRolls` en tire une `D20Policy` depuis les états, l'armure et les effets, et la page la fournit à `useDiceRoller` (`provide` / `inject`). Les sites d'appel ne portent que le type du jet, jamais une règle. Cinq effets nommés (`half_proficiency`, `proficient_check_minimum`, `critical_range`, `critical_extra_dice`, `halve_damage_reaction`) et `advantage` étendu (`attack`, `initiative`) sont seedés ; la migration 0124 les pose sur les bases déjà peuplées, sans reseed. L'historique et l'initiative sont de l'état de rencontre : `useStorage` par fiche, comme les conditions.
- **Pourquoi** : la logique dans chacun des ~15 sites d'appel aurait dupliqué la règle et laissé les boutons contredire les avertissements affichés à côté. L'application ne connaît ni la cible ni la source d'un jet : tout ce qui en dépend (critique automatique contre une cible paralysée, sauvegarde contre l'effroi) est un choix explicite du joueur, visible sur le bouton « Jets ».
- **Écarté** : un historique en base (migration, file hors-ligne et endpoint pour le journal d'un seul joueur) ; la détection automatique de la situation (l'application ne l'a pas) ; une relance au choix du joueur (Chanceux ne peut jamais être pire qu'un 1 relancé : on l'applique).
- **Limites assumées** : le critique en cours est celui de la *dernière* attaque (Extra Attack ou sort à plusieurs rayons : la bascule manuelle corrige) ; Attaque téméraire et Sens du danger (conditionnés par ce que voit le personnage) restent en texte ; l'échec automatique (Étourdi, Paralysé…) est signalé au jet, pas appliqué à son résultat ; Chanceux ne vaut pas aux jets contre la mort ; Effrayé désavantage les jets même si la source de peur est hors de vue, que le joueur corrige par « Normal » ; pas d'ordre de tour (la fiche ne connaît pas les autres combattants) ni de journal de session au-delà des jets ([#199](https://github.com/kevmorpain/le-bureau-du-jdr/issues/199)).
