# Registre des fonctionnalités manquantes

> **Nature du doc** : inventaire *vivant* de ce qui est **décrit mais pas mécanisé**, ou pas
> implémenté du tout. Ce n'est **ni une roadmap ni un backlog priorisé** — c'est la carte des trous,
> pour qu'un choix de chantier se fasse en connaissance de cause. Rien ici n'est engagé.
>
> **Registres voisins, à ne pas confondre** :
> - [`audit-completude.md`](./audit-completude.md) — **bugs** des parcours 2014 (le comportement
>   existe mais il est faux). Ici : le comportement **n'existe pas**.
> - [`consolidation-2014.md`](./consolidation-2014.md) — plan de **refactor** du socle (F1–F11,
>   chantier style de combat). Les entrées ci-dessous qui y ont déjà un chantier sont marquées
>   « 🔗 suivi ailleurs » et listées pour mémoire, sans être re-détaillées.
> - [`dnd-5.5.md`](./dnd-5.5.md) — support des **règles 2024**. Tout ce qui suit concerne le
>   socle **2014**, sauf mention contraire.
>
> **Légende de l'effort** : 🟢 local (un computed / un composant) · 🟠 transverse (moteur +
> fiche + tests) · 🔴 structurant (schéma, migration, nouveau modèle).
>
> État : 2026-09-15. Dernier commit couvert : `53c43d3` (tranche 4 du style de combat incluse).
>
> **Résolu depuis** : **U10** (montée en puissance affichée) et **U2 (c)** — voir la note sous le
> tableau U.
>
> **Journal des corrections** — trois entrées rectifiées après relecture du code, mention gardée
> inline plutôt que réécrite en silence : **R3** (épuisement, largement implémenté), **U2**
> (le tiroir de détail d'un sort existe bien), **U8** (les sorts ont déjà 4 filtres).
> **U1** (mobile) est **écarté par décision de l'auteur**, pas résolu. Une entrée a été rattrapée
> par le code pendant la rédaction (`fighting_style_modifier`, PR #63) et **E11 revu en conséquence** :
> un effet alimente désormais la CA, mais en dur — le manque d'un effet *générique* demeure.

---

## Sommaire

| Famille | Entrées | En un mot |
|---|---|---|
| [E — Effets déclarés, jamais appliqués](#e--effets-déclarés-jamais-appliqués) | E1–E10 | La donnée est seedée, le type existe, **personne ne la lit** |
| [C — Capacités de classe sans mécanique](#c--capacités-de-classe-sans-mécanique) | C1–C9 | ~340 features n'ont qu'une `description` |
| [R — Mécaniques de règles générales](#r--mécaniques-de-règles-générales) | R1–R10 | Avantage, critique, concentration, encombrement… |
| [O — Objets & inventaire](#o--objets--inventaire) | O1–O6 | Harmonisation non gardée, pas de poids ni de prix |
| [S — Sorts & incantation](#s--sorts--incantation) | S1–S6 | Rituel, limite de préparation, zone d'effet |
| [P — Parcours création / level-up](#p--parcours-création--level-up) | P1–P5 | Choix jamais proposés |
| [D — Contenu (données) manquant](#d--contenu-données-manquant) | D1–D4 | 118 sorts sur ~360, dons, objets magiques |
| [U — Interface de la fiche](#u--interface-de-la-fiche) | U1–U10 | Lecture des sorts, ~~montée en puissance~~, historique de jets |
| [N — Contrôle manuel & préférences](#n--contrôle-manuel--préférences) | N1–N6 | L'app décide tout, le joueur ne peut rien reprendre |
| [X — Surface produit](#x--surface-produit) | X1–X7 | XP, partage, export, EN, groupe |

---

## E — Effets déclarés, jamais appliqués

Ces types existent dans l'union `Effect` (`server/db/schema/effects.ts`) **et** sont posés par les
seeds sur de vraies features — mais **aucun consommateur** ne les lit côté fiche. Le joueur voit le
trait dans « Capacités », et rien ne bouge sur ses stats. C'est la famille la plus rentable : la
donnée est déjà là, il ne manque que la projection.

| # | Effet | Porté par (seeds) | Ce qui devrait se passer | Effort |
|---|---|---|---|---|
| **E1** | `skill_bonus` | Nain (Connaissance de la pierre), Gnome des roches (Bricoleur) | Doubler le bonus de maîtrise sur Histoire dans un contexte donné (`multiplier: 2`, `condition`) — c'est de l'expertise conditionnelle | 🟠 |
| **E2** | `reroll` | Halfelin (Chanceux), + une 2ᵉ occurrence dans `character_species.ts` | Relancer un d20 naturel de 1. Aucun jet du `useDiceRoller` ne consulte cet effet | 🟠 |
| **E3** | `tool_proficiency_choice` | Nain (maîtrise d'outil d'artisan au choix), Nain des montagnes | Proposer le choix à la création, puis l'afficher en Maîtrises. Le choix n'est **jamais** offert | 🟠 |
| **E4** | `language_proficiency_choice` | Humain, Haut-elfe, Demi-elfe, don Linguiste | Idem, pour les langues. Le compteur est perdu | 🟠 |
| **E5** | `skill_proficiency_choice` | une espèce dans `character_species.ts` (l. 1015) | Idem, pour les compétences. ⚠️ Le `{count, from}` a été ajouté à l'union (Phase 1 §3) mais reste sans lecteur | 🟠 |
| **E6** | `spell_choice` | Haut-elfe (1 tour de magie de magicien) | Choisir + accorder le cantrip. Aujourd'hui : rien, le joueur doit l'ajouter à la main | 🟠 |
| **E7** | `equipment_penalty` | Nain, Nain des collines/montagnes | Neutraliser la réduction de vitesse due à une armure lourde (`override: true`). Sans effet — mais la **pénalité elle-même** n'est pas appliquée non plus (cf. O3), donc l'ensemble est cohérent… par accident | 🟢 (après O3) |
| **E8** | `sight_modifier` | 4 manifestations occultes (Regard de ténèbres, Yeux des runes, Voile de fumée, Vision véritable) | Étendre la vision / marquer un sens spécial sur la fiche. Rendu **nulle part**, même pas en texte | 🟢 |
| **E9** | `pact_weapon_modifier` | 2 invocations (Fléau de la Lame = attaque supplémentaire, Buveur de vie = +CHA aux dégâts) | Modifier les stats de l'arme de pacte (`isPactWeapon` est déjà posé à l'insert par `characterCreate`). Rien ne relie les deux | 🟠 |
| **E10** | `extra_damage` | une espèce + **proposé à l'utilisateur** dans `MagicEffectEditor` | ⚠️ **Double problème** : (a) jamais appliqué ; (b) l'éditeur d'objet magique écrit une **forme différente** de l'union (`{die_count_notation, damage_type}` vs `{trigger, attackType, extraDie}`) → donnée non typée, silencieusement morte | 🟠 |

**✅ résolu pendant la rédaction** — `fighting_style_modifier` : la **tranche 3** du chantier F2
(PR #63, mergée le 2026-09-14) applique désormais les bonus statiques sur la fiche — Défense +1 CA,
Archerie +2 à distance, Duel +2 à une main, Combat à deux armes (mod en main secondaire) — via le
module pur `shared/rules/fightingStyleEffects.ts`. `great_weapon` et `protection` restent rendus en
texte, par conception (relance de dés / réaction, non réductibles à un bonus statique).

### E11 — Types d'effet **absents** de l'union (objets magiques classiques non modélisables)

Il n'existe aucun effet pour :
- **Bonus de CA générique** (Anneau de protection, Cape de protection, Bracelets de défense,
  Bâton de défense). *(Nuance depuis la PR #63 : `computedAC` consomme bien **un** effet — le
  `fighting_style_modifier` de kind `defense`, +1 CA — mais c'est un cas **codé en dur**, et
  seulement avec une armure de corps portée. Il n'existe toujours aucun effet **générique**
  « +N CA ».)* Un objet qui donne +1 CA reste donc non représentable, sauf à détourner le
  `magicBonus` de l'armure.
- **Bonus aux jets de sauvegarde** (même famille d'objets : +1 aux JS).
- **Bonus aux jets d'attaque / de dégâts non liés à une arme portée**.
- **Vitesse de nage / d'escalade / de creusement** (`walking_speed` et `flying_speed` existent seuls).
- **Avantage structuré** : `advantage` existe mais sa `condition` est une **chaîne libre** non
  interprétée → aucun effet ne peut *réellement* déclencher un avantage, seulement le décrire.

Effort : 🟠 par effet (union + `MagicEffectEditor` + consommateur), 🔴 si on veut un modèle de
condition interprétable plutôt que du texte.

---

## C — Capacités de classe sans mécanique

**~340 features** sont seedées avec `effects: []` : leur `description` est fidèle, mais elles ne
changent **rien** aux valeurs de la fiche.

| Fichier seed | Features sans effet | Fichier seed | Features sans effet |
|---|---|---|---|
| `clerc.ts` | 52 | `paladin.ts` | 30 |
| `magicien.ts` | 36 | `moine.ts` | 26 |
| `roublard.ts` | 26 | `guerrier.ts` | 22 |
| `warlock.ts` | 22 | `barbare.ts` | 20 |
| `rodeur.ts` | 19 | `barde.ts` / `druide.ts` | 17 chacun |
| `ensorceleur.ts` | 14 | `character_species.ts` | 14 |

C'est **normal** pour la majorité (une capacité narrative ou situationnelle n'a pas à être
calculée). Les entrées ci-dessous sont celles où l'absence **se voit sur une valeur affichée** —
donc là où la fiche est objectivement fausse, pas juste incomplète.

| # | Capacité | Classe(s) | Valeur fausse aujourd'hui | Effort |
|---|---|---|---|---|
| **C1** | **Défense sans armure** | Barbare (10+DEX+CON), Moine (10+DEX+SAG) | **CA** : `computedAC` renvoie `10 + DEX` sans armure, pour tout le monde. Un Barbare CON 16 est à −3 de sa vraie CA. *(Voisin : Résistance draconique de l'Ensorceleur = 13+DEX.)* | 🟠 |
| **C2** | **Attaque supplémentaire** | Guerrier (×2/3/4), Barbare, Paladin, Rôdeur, Moine | Le **nombre d'attaques** n'est nulle part : ni dans `equippedWeaponStats`, ni en Mode Combat. Le joueur compte de tête | 🟢 |
| **C3** | **Attaque sournoise** | Roublard (1d6 → 10d6) | Dés de dégâts **pas affichés**, pas ajoutés au jet. Cœur mécanique de la classe | 🟠 |
| **C4** | **Rage** | Barbare | Pas de `maxUsesFormula` (**compteur d'utilisations absent** alors que `rechargeType: 'long_rest'` est posé), pas de bonus de dégâts, pas de résistance contondant/perforant/tranchant | 🟠 |
| **C5** | **Points de ki** | Moine | Ressource **inexistante** (ni colonne, ni feature à compteur). Bloque Frappe étourdissante, Patience défensive, Rafale de coups | 🔴 |
| **C6** | **Points de sorcellerie / Métamagie** | Ensorceleur | La **métamagie est choisie et persistée** (progression `kind:'metamagic'` ✅) mais les **points** n'existent pas → aucune métamagie n'est activable, ni la conversion points ⇄ emplacements | 🔴 |
| **C7** | **Inspiration bardique / Conduit divin / Forme sauvage / Châtiment divin** | Barde, Clerc, Druide, Paladin | Ressources à compteur, dé qui évolue, formes disponibles : rien n'est modélisé | 🔴 |
| **C8** | **Déplacement rapide / Déplacement sans armure** | Barbare (+3 m), Moine (+3→+9 m) | **Vitesse** affichée en QuickStats = espèce seule. Ces capacités sont des `walking_speed` conditionnels qui ne sont pas posés | 🟢 |
| **C9** | **Touche-à-tout / Talent fiable / Critique brutal / Esquive instinctive** | Barde, Roublard, Barbare | Modificateurs de jet (demi-maîtrise, plancher à 10, dés de crit en plus) — aucun n'est appliqué | 🟠 |

> **Note de conception** : le North Star du repo (`consolidation-2014.md`) interdit le code bespoke
> par classe. Ces entrées demandent donc d'abord de **nommer les effets manquants** dans l'union
> (`unarmored_defense`, `extra_attack_count`, `scaling_damage_dice`, `resource_pool`…), puis de les
> seeder. C'est ce qui rend C4–C7 structurants : il manque le **concept de pool de ressource**
> (points de ki / sorcellerie / châtiment), qui n'a pas d'équivalent dans le schéma actuel
> (`character_features.currentUses` est un compteur d'usages, pas un pool dépensable par paquets).

---

## R — Mécaniques de règles générales

| # | Mécanique | État | Détail | Effort |
|---|---|---|---|---|
| **R1** | **Avantage / désavantage** | ❌ | `useDiceRoller.roll()` jette **toujours un seul d20**. La fiche *détecte* et *affiche* correctement les sources de désavantage (conditions, armure non maîtrisée, arme lourde + Petite taille, discrétion) — mais le bouton de jet les ignore. Le plus gros écart perçu entre l'affichage et le jet | 🟢 |
| **R2** | **Coup critique** | ❌ (cosmétique) | `isCrit` ne sert qu'à **colorer le toast**. Pas de doublement des dés de dégâts, pas de plage de crit élargie (Champion 19–20 / 18–20), pas de crit auto contre une cible paralysée | 🟢 |
| **R3** | **Épuisement** | ✅ **largement fait** | *(Corrigé après vérification — cette ligne disait initialement « rien n'est appliqué », c'était faux.)* `useCharacterConditions` applique bien les 5 premiers paliers : niv. 1 désavantage aux jets de carac. (`skillDisadvantageReasons`), niv. 2 vitesse ÷2 et niv. 5 vitesse 0 (`effectiveSpeed`), niv. 3 désavantage aux JS (`saveStatuses`), niv. 4 PV max ÷2 (`effectiveMaxHp`, consommé par `HitPointsSection`). **Restent** : le niv. 6 (mort) et la **réduction de 1 au repos long**. Les paliers « désavantage » sont *signalés* mais pas appliqués au jet — c'est R1, pas un trou propre | 🟢 (le résidu) |
| **R4** | **Concentration** | ⚠️ partielle | `concentratingSpellId` est persisté ✅. Manquent : le **JS de Constitution** quand on subit des dégâts (DD = max(10, dégâts/2)), la rupture **automatique** en lançant un 2ᵉ sort à concentration, et la rupture à 0 PV | 🟠 |
| **R5** | **Encombrement / capacité de charge** | ❌ | `items` n'a **aucune colonne `weight`**. Ni charge portée, ni capacité (FOR×7,5 kg), ni seuils encombré / lourdement encombré | 🔴 |
| **R6** | **Jets de mort** | ⚠️ | État en **localStorage** (perdu entre appareils, non synchronisé — contrairement aux PV et à la concentration). Le jet n'applique pas le **20 naturel = 1 PV** ni le **1 naturel = 2 échecs**. Pas de stabilisation, pas de mort instantanée par dégâts massifs | 🟢 → 🟠 |
| **R7** | **Économie d'action** | ⚠️ décorative | Les toggles Action / Bonus / Réaction du Mode Combat sont **purement manuels** : rien ne consomme automatiquement une action quand on lance un sort ou attaque, et l'`actionType` des features (déjà seedé) ne gate rien | 🟢 |
| **R8** | **Repos** | ⚠️ trous | Le repos long ne remet **pas** les PV temporaires à 0, ne réinitialise pas les jets de mort, ne réduit pas l'épuisement de 1 (R3). La **recharge partielle** des objets (`items.rechargeDice`, ex. « 1d6+4 charges à l'aube ») est lue par `characterRest` puis **explicitement exclue** — seule la recharge complète marche. Pas de règle « 1 repos long / 24 h » | 🟠 |
| **R9** | **Prérequis de multiclassage** | ❌ | Aucune vérification des scores minimaux (FOR/DEX/CHA 13…) au level-up multiclasse, et les **maîtrises réduites** du multiclassage (on ne reçoit pas les maîtrises de départ complètes) ne sont pas appliquées | 🟠 |
| **R10** | **Prérequis d'armure lourde (FOR)** | ❌ | `ArmorProperties.strength_requirement` existe dans le schéma **et** dans le Zod — **zéro lecteur**. Porter une cotte de mailles avec FOR 12 ne déclenche aucun avertissement de vitesse −3 m | 🟢 |

---

## O — Objets & inventaire

| # | Sujet | État | Détail | Effort |
|---|---|---|---|---|
| **O1** | **Harmonisation (attunement)** | ⚠️ **non gardée** | `character_inventory.attuned` est stocké et togglable, `items.requiresAttunement` existe — mais `inventoryEffects` ne filtre **que sur `equipped`**. Un objet qui **exige** l'harmonisation donne ses effets **sans être harmonisé**. Et la limite de 3 n'est qu'un badge d'avertissement non bloquant | 🟢 |
| **O2** | **Poids & prix** | ❌ | Pas de colonne `weight` (→ R5) ni `cost`. Conséquence : aucun **achat** possible, la bourse (pp/po/pe/pa/pc) est purement déclarative — on ne peut pas dépenser en achetant un objet | 🔴 |
| **O3** | **Pénalité de vitesse des armures lourdes** | ❌ | La règle n'est appliquée nulle part (d'où E7 qui l'annule dans le vide) | 🟢 |
| **O4** | **Munitions** | ❌ | La propriété `ammunition` est stockée et affichée, mais aucun décompte de flèches/carreaux à l'attaque | 🟢 |
| **O5** | **Armes lancées & portées** | ⚠️ | `thrown` sert à afficher la portée, mais pas à proposer un jet distinct ni à gérer le désavantage **hors portée normale** (longue portée) | 🟢 |
| **O6** | **Objets magiques à effets actifs** | ❌ | Un objet à charges peut décompter ses charges, mais **rien ne lie une charge à un effet** (lancer un sort depuis un bâton, infliger des dégâts). Combiné à E11, l'essentiel du catalogue d'objets magiques du DMG n'est pas modélisable | 🔴 |

---

## S — Sorts & incantation

| # | Sujet | État | Détail | Effort |
|---|---|---|---|---|
| **S1** | **Limite de sorts préparés** | ❌ | Rien n'affiche ni ne contraint le nombre de sorts préparables (`niveau de classe + mod`). Un Clerc peut tout préparer. Les **sorts de domaine toujours préparés** n'existent pas non plus | 🟠 |
| **S2** | **Incantation rituelle** | ⚠️ badge seul | `spells.ritual` est stocké et affiché ; aucun bouton « lancer en rituel » (sans consommer d'emplacement, +10 min) | 🟢 |
| **S3** | **Zone d'effet** | ❌ | Aucune colonne `area_of_effect` sur `spells` (le seul existant est codé en dur dans l'action `breathe_weapon` du souffle drakéide). Cône/sphère/ligne/cylindre ne sont pas des données | 🟠 |
| **S4** | **Type d'attaque du sort** | ⚠️ inféré | « Jet d'attaque » est déduit de l'**absence** de `dc` (cf. B5 de `audit-completude.md`) — pas de champ explicite, et pas de distinction attaque de sort **au corps à corps** vs **à distance** (donc pas de désavantage à 1,5 m) | 🟢 |
| **S5** | **Composantes matérielles coûteuses** | ⚠️ | `material` est du texte libre : pas de coût, pas de « consommé à l'usage », pas de focaliseur d'incantation | 🟢 |
| **S6** | **Durée & effets en cours** | ❌ | `duration` est du texte. Pas de suivi des sorts actifs sur le personnage (Armure du mage, Bénédiction, Hâte…) ni de leur expiration — donc aucun de leurs bonus n'est appliqué à la fiche | 🔴 |

---

## P — Parcours création / level-up

Ce qui suit sont des **choix que le joueur ne peut pas faire du tout** (à distinguer des bugs de
cumul de `audit-completude.md`, où le choix existe mais se comporte mal).

| # | Choix | Flux concerné | Détail | Effort |
|---|---|---|---|---|
| **P1** | **Expertise à la création** | Création | 🔗 *documenté dans `consolidation-2014.md` §Inventaire A*. Un Roublard/Barde créé directement au niveau ≥ 1 **ne choisit jamais** son expertise (elle fonctionne au level-up). Rappelé ici parce que c'est un trou fonctionnel, pas de la dette | 🟠 |
| **P2** | **Manœuvres du Maître de guerre** | Les deux | `ChoiceKind` `'maneuvers'` et `FeatureTag` `'maneuver'` existent **mais aucune manœuvre n'est seedée**, aucune progression posée. Le Guerrier Maître de guerre est inutilisable | 🟠 |
| **P3** | **Sorts de domaine / de cercle / Secrets magiques** | Les deux | Aucune progression `kind:'spell'` pour le Clerc (domaine), le Druide (cercle terrestre), le Barde (Secrets magiques). Seul l'Occultiste a ses points de choix `spell` (arcanums) | 🟠 |
| **P4** | **Ennemi juré / Explorateur-né** | Les deux | Choix du Rôdeur niveau 1 : absents (pas de progression, pas d'`optionSource`) | 🟠 |
| **P5** | **2ᵉ style de combat du Champion (niv. 10)** | Les deux | 🔗 *résidu remonté par F2 tranche 2*. Progression possédée par une **sous-classe** (`ownerSubclassId`), cas unique non câblé | 🟠 |

> **Généralisation** : sur les 17 `ChoiceKind` canoniques, seuls **6** sont réellement seedés en
> `progression` (`subclass`, `pact_boon`, `fighting_style`, `invocations`, `metamagic`, `spell`).
> Restent sans aucune donnée : `expertise`, `maneuvers`, `skill`, `language`, `tool`, `cantrip`,
> `ancestry`, `lineage` (partiel), `weapon_mastery` (5.5), `ability_scores` (5.5), `asi_or_feat`
> (traité par un chemin dédié). C'est la même racine que E3–E6 vue depuis le moteur de choix.

---

## D — Contenu (données) manquant

| # | Domaine | État | Détail |
|---|---|---|---|
| **D1** | **Sorts** | **118 seedés** | Le PHB 2014 en compte ~360. Un magicien de haut niveau n'a pas la moitié de sa liste |
| **D2** | **Objets magiques** | quasi nuls | Le seed `items.ts` couvre l'équipement ordinaire ; presque aucun objet magique du DMG (et E11/O6 empêcheraient de les modéliser correctement) |
| **D3** | **Espèces** | trou connu | Drow absent de la DB (🔗 `character-builder.md`) |
| **D4** | **Sous-classes** | 1–3 par classe | Chaque classe a ses sous-classes seedées mais pas la liste complète du PHB |

---

## U — Interface de la fiche

Trouvailles de la relecture des 38 composants de `app/components/character_sheet/`. Contrairement
aux familles précédentes, rien ici ne dépend du moteur de règles : ce sont des manques de la couche
présentation/interaction.

> **Ce qui va bien, pour cadrer** : les jets sont largement couverts (carac., compétences, JS,
> armes, sorts, dés de vie, jets de mort, charges d'objets), les dégâts appliquent le type et la
> résistance, les descriptions de capacités sont rendues en `whitespace-pre-line`, l'accessibilité
> de base tient (39 vrais `<button>`, les deux seuls `<div @click>` sont des gardes d'événement),
> et le hors-ligne est traité sérieusement (file de mutations, snapshot local, modale de conflit).
> Les entrées ci-dessous sont les creux dans ce tableau, pas un procès général.

| # | Manque | Détail | Effort |
|---|---|---|---|
| **U1** | ~~**Aucune mise en page mobile**~~ | 🚫 **ÉCARTÉ — décision (2026-09-14)**. Le constat technique tient (`.dashboard-grid` figé à `240px 1fr 240px`, un seul point de rupture à 1200 px, aucune classe responsive dans les pages ; l'app est pourtant une PWA). **Écarté volontairement** : la fiche est trop dense pour être réagencée sans un vrai travail d'UX, que l'auteur ne souhaite pas porter. À ne pas re-proposer sans qu'une décision de design précède. | — |
| **U2** | **Lire un sort demande d'ouvrir un tiroir, et son texte n'est pas structuré** | *(Corrigé — la version précédente disait « illisible depuis la fiche », c'était faux : cliquer la ligne appelle `openSpellDetail()` qui ouvre un `USlideover` rendant `SpellCard`, description comprise.)* Restent trois manques, tous demandés explicitement : **(a)** aucun **accordéon** sur la ligne — il faut le tiroir modal pour la moindre relecture ; **(b)** les effets sont **noyés dans le texte** : `SpellCard` rend bien `HealSection`/`DamageSection` au-dessus, mais rien pour le DD, le type d'attaque, la zone, les composantes coûteuses ni la concentration, qui restent à chercher dans la prose ; ~~**(c)** aucun **encart de montée en puissance**~~ → ✅ **fait** (cf. la note sous le tableau) | 🟢 |
| **U3** | **Effets d'objet rendus en JSON brut** | `InventorySection.vue:199` affiche `{{ eff.type }} : {{ JSON.stringify(eff.value) }}` dans le détail d'un objet — le joueur lit `extra_damage : {"die_count_notation":"1d6"…}`. Un `magicEffectLabel()` existe **dans le même fichier** (utilisé pour les badges) mais n'est pas appelé ici ; et lui-même retombe sur `effect.type` (clé machine nue) pour tout ce qu'il ne connaît pas — donc les 10 effets de la famille E s'afficheraient en brut | 🟢 |
| **U4** | **Aucun historique de jets** | Les toasts vivent 4,5 s, plafonnés à 5 (`useDiceRoller`). Pas de journal, pas de « relancer », pas de copier. Un jet qu'on n'a pas lu à temps est définitivement perdu — et il n'y a rien à montrer au MJ | 🟢 |
| **U5** | **L'initiative n'est conservée nulle part** | `toggleCombat` lance `roll('Initiative', …)` → un toast qui s'efface. La valeur n'est ni stockée ni réaffichée, et le Mode Combat n'a ni ordre de tour, ni compteur de round | 🟢 |
| **U6** | **Pas de suivi de durée** | Ni les conditions (`StatusSection`) ni les sorts actifs n'ont de compteur de tours/minutes. « Bénédiction pendant 1 minute » se suit de tête. Jumeau UI de S6 | 🟠 |
| **U7** | **Pas de confirmation sur les actions destructrices de la fiche** | Le **repos long** (réinitialise emplacements, PV, dés de vie) et la **suppression d'objet** partent au premier clic, sans confirmation ni annulation. Seule la suppression de *personnage* en a une (`characters/index.vue`). Combiné à U4 (aucun historique), un clic de travers est irrécupérable | 🟢 |
| **U8** | **Pas de recherche texte** | *(Corrigé — je sous-estimais les sorts : `MagicSection` filtre déjà par **préparés**, **type d'action**, **composantes V/S/M** et **niveau**.)* Ce qui manque vraiment : la **recherche par nom**, absente des sorts comme de l'inventaire. Et l'inventaire, lui, n'a que 4 onglets par `itemType` — ni filtre, ni tri | 🟢 |
| **U10** | ~~**Les dégâts affichés ne montent JAMAIS en puissance**~~ | ✅ **RÉSOLU (2026-09-15)** — voir la note sous le tableau. Le constat d'origine : `DamageSection`/`HealSection` figeaient `slotLevel` au niveau de base, donc seule la **première ligne** de `damage_at_slot_level` était lue, pendant que `rollSpellEffect` appliquait, lui, le niveau choisi | 🟢 |
| **U9** | **État mort en localStorage** | `useCharacterClasses` crée `useStorage(storageKey('armorClass'), 10)` — mais **tous** les consommateurs lisent en réalité `computedAC` (remappé par `useCharacterSheet`). Une clé localStorage est écrite par personnage pour rien. Hygiène, pas fonctionnel | 🟢 |

**✅ résolu — U10 + U2 (c) : montée en puissance (2026-09-15)**

La résolution « quelle valeur à quel niveau » était réimplémentée **quatre fois** (le jet dans
`MagicSection`, `CharacterSpellRow`, `DamageSection`/`HealSection`, `SpellCardBuilder`), avec des
comportements divergents — la cause racine de l'écart affiché ≠ jeté. Elle est désormais **unique**,
dans le module pur [`shared/rules/spellScaling.ts`](../shared/rules/spellScaling.ts), consommé par
les quatre. Côté lecture : `UpcastSection` rend l'encart « Aux niveaux supérieurs » dans `SpellCard`
(un palier par niveau où la valeur **change** : Arme spirituelle affiche 4/6/8, pas 3/5/7/9), et
`CastSpellModal` annonce, **sur chaque emplacement proposé**, ce que ce niveau donnera — c'est là que
le joueur choisit, donc là que l'affiché doit correspondre au jeté.

Effets de bord traités au passage, même famille : le soin d'un sort à progression **par niveau de
personnage** était indexé par le niveau du sort (jamais rencontré en seed, faux dès la première
donnée) ; la fourchette min~max du grimoire rendait `NaN` sur une notation à bonus fixe (`10d6+40`) ;
et « Simulacre de vie » retrouve son bloc `heal` (`1d4+4`), que l'ancien parseur ne savait pas
représenter. ⚠️ **Nécessite un re-seed en prod** (`POST /api/admin/seed?only=spells`, idempotent).

**Cas des sorts d'attaque** : leurs dégâts se jettent en **deux gestes** (« Lancer » = jet pour
toucher, puis « Dégâts »), donc le second doit savoir à quel niveau le sort a été lancé — sinon la
modale annonce 6d6 au niveau 3 et le bouton jette 4d6. Le bouton **Dégâts ouvre son propre choix de
niveau** (`RollDamageModal`), présélectionné sur le dernier lancement : le niveau redevient une
décision explicite au lieu d'un état caché. Deux différences avec `CastSpellModal`, qui justifient
un composant distinct : **aucun emplacement n'est dépensé** (il l'a été au lancement) et les niveaux
sont proposés **même épuisés** — après avoir lancé son dernier emplacement de niveau 3, c'est
précisément à ce niveau qu'il faut pouvoir jeter. Quand le sort ne monte pas en puissance (tour de
magie, table à un seul palier), il n'y a rien à choisir : le bouton jette directement.

**Voisins déjà listés ailleurs, rappelés pour le contexte UI** : R1 (les boutons de jet sont
*à côté* des avertissements de désavantage qu'ils ignorent — l'incohérence est visible à l'œil nu),
R2 (le critique ne colore qu'un toast), R6 (les jets de mort ne suivent pas l'appareil),
R7 (l'économie d'action du Mode Combat est purement manuelle).

---

## N — Contrôle manuel & préférences

Famille née de deux demandes de l'auteur (désactiver les jets de dés ; activer la concentration
sans lancer de sort). Elles ont la **même racine** : l'app suppose partout qu'elle pilote, et
n'offre aucune porte de sortie quand le joueur veut faire autrement ou quand le modèle ne sait pas
exprimer sa situation.

**Constat de fond : il n'existe aucune couche de préférences.** Ni table, ni colonne, ni composable.
`useStorage` sert à de l'état de jeu (conditions, jets de mort, sections repliées), jamais à un
réglage. Toute entrée ci-dessous suppose de trancher d'abord **où vit une préférence** — cf. N6.

| # | Manque | Détail | Effort |
|---|---|---|---|
| **N1** | **Désactiver les jets de dés** *(demandé)* | Un joueur qui lance ses vrais dés n'a pas besoin des boutons ni des toasts — il lui faut le **modificateur**, qui est déjà affiché à côté (« Attaque +7 »). Un réglage « pas de jets » masquerait boutons et `DiceRollerSection` sans rien casser. C'est l'entrée la moins chère de tout ce document | 🟢 |
| **N2** | **Saisir soi-même le résultat d'un jet** | Corollaire indispensable de N1 : sans lui, « je lance mes dés » devient « la fiche ne sait plus rien ». Les jets qui **écrivent un état** doivent accepter une saisie — dés de vie (le soin s'applique aux PV), jets de mort (succès/échecs), charges d'objet. Le pattern existe déjà : `HitPointsSection` fait saisir les dégâts à la main, type et résistance compris | 🟠 |
| **N3** | **Concentration libre** *(demandé)* | `ConcentrationSection` est en `v-if="isConcentrating"` : invisible tant qu'on ne concentre pas → **aucun moyen de la déclencher** hors du lancement d'un sort. ⚠️ **Piège de schéma** : `character_sheets.concentrating_spell_id` est une **FK vers `spells`** et `setConcentration(spellId)` n'accepte qu'un id — se concentrer sur un effet de monstre, un sort non seedé (D1 : 118 sorts sur ~360) ou du homebrew est **inexprimable**. Il faut un libellé libre nullable à côté de la FK, pas seulement un bouton | 🟠 |
| **N4** | **Surcharges manuelles des valeurs dérivées** | **La soupape qui manque à E11.** Le modèle d'effets ne sait pas exprimer « +1 CA » (Anneau de protection) ni un bonus aux JS, et ne le saura pas avant un chantier 🟠. En attendant, **rien** ne permet de corriger à la main : `computedAC` est entièrement dérivé. Or le pattern existe déjà deux fois — `character_proficiency_overrides` (grant/revoke manuel sur une maîtrise dérivée) et l'« Édition directe » des PV. Le généraliser à **CA, vitesse, initiative, DD de sort** débloque aujourd'hui tout ce que le modèle ne sait pas dire, pour un coût dérisoire | 🟠 |
| **N5** | **Encart d'effet mécanique sur les capacités** | Même problème que U2b, un cran plus loin : les descriptions de features sont des **pavés** (cf. Rage : 7 lignes dont 3 mécaniques). Rien ne met en avant « ce que ça change ». À traiter avec U2b pour ne concevoir le bloc qu'une fois | 🟠 |
| **N6** | **Où vit une préférence ?** | ✅ **TRANCHÉ (2026-09-14)** : sur **la fiche**, avec des **défauts au niveau du compte**. Voir [D18](./decisions.md#d18) pour la forme retenue et le piège du tri-état | 🟠 |

### N6 — ce que la décision implique

Préférence **par fiche**, **défauts par compte** (décision de l'auteur). Le détail et le
*pourquoi* sont en [D18](./decisions.md#d18) ; le strict nécessaire pour lire les entrées N :

- **`NULL` sur la fiche = « hérite du compte »**, pas « désactivé ». Chaque préférence est donc
  **tri-état** (`oui` / `non` / `hérité`) — une colonne **nullable sans DEFAULT**. La typer
  `boolean NOT NULL DEFAULT false` détruirait l'état « hérité » de façon irréversible.
- **Aucun backfill** : les fiches existantes restent à `NULL` et héritent immédiatement.
- La résolution `fiche ?? compte ?? défaut codé` est une **fonction pure partagée**
  (serveur + client), comme le reste du moteur ([D10](./decisions.md#d10)).

> **Bonne nouvelle pour U2b / N5** (et vérifiée par U10, désormais fait) : aucun de ces encarts n'est un problème de *design*. Les
> données structurées existent déjà (`spell.damages`, `spell.heal`, `spell.dc`,
> `spell.concentration`, `spell.multiAttack`, `damage_at_slot_level`) — l'encart est le **rendu
> d'un JSON déjà en base**, pas un système visuel à inventer. Sa complétude est en revanche
> **plafonnée par S3** (pas de zone d'effet) et **S4** (type d'attaque seulement déduit).

---

## X — Surface produit

| # | Fonctionnalité | Détail |
|---|---|---|
| **X1** | **Points d'expérience** | Aucune colonne, aucune UI. La montée de niveau est entièrement manuelle (🔗 déjà noté dans `character-sheet.md`) |
| **X2** | **Partage / lecture seule** | Une fiche n'appartient qu'à son `ownerId` ; pas de lien de partage, pas d'accès MJ |
| **X3** | **Export / impression** | Pas d'export PDF ni de vue imprimable de la fiche officielle |
| **X4** | **Groupe / campagne** | Pas de notion de table, de groupe, ni de personnages liés |
| **X5** | **Initiative de rencontre** | Le Mode Combat jette l'initiative du **seul** personnage ; pas de suivi de tour multi-participants |
| **X6** | **Anglais** | Un seul locale (`i18n/locales/fr.json`). L'architecture i18n est en place (D11), le contenu non |
| **X7** | **Journal / historique** | Les jets disparaissent après 4,5 s (toasts). Pas d'historique de jets, pas de journal de session au-delà des notes libres |

---

## Ce qu'il faut savoir avant de piocher

1. **E1–E10 sont les moins chers.** La donnée est seedée et typée ; il manque un lecteur. Aucun
   schéma à toucher, aucune migration. C'est aussi la famille la plus visible pour le joueur
   (« mon trait est écrit sur la fiche mais il ne fait rien »).
2. **R1 (avantage/désavantage) est le plus gros écart perçu.** La fiche *sait déjà* quand il y a
   désavantage et l'affiche — mais le jet n'en tient pas compte. Incohérence interne visible.
3. **C1 (Défense sans armure) rend une valeur affichée fausse**, pas juste incomplète : la CA d'un
   Barbare ou d'un Moine sans armure est fausse aujourd'hui. À traiter comme un bug si on veut
   être strict.
4. **C5–C7 (pools de ressources) réclament un concept neuf** dans le schéma. `currentUses` compte
   des usages unitaires ; ki, points de sorcellerie et châtiment se dépensent **par paquets
   variables**. Concevoir le pool une fois, pas trois.
5. **Respecter le North Star** (`consolidation-2014.md`) : aucune règle spécifique à une classe
   dans le code. Toute entrée C ci-dessus se traduit d'abord par « quel effet manque à l'union »,
   puis par du seed — jamais par un `if (className === 'Barbare')`.
6. ~~**U10 est le seul écart où l'affiché contredit le jeté.**~~ ✅ **Résolu le 2026-09-15** : la
   résolution des progressions est passée en module pur partagé (`shared/rules/spellScaling.ts`),
   affichage et jet la lisent au même endroit. Reste une leçon : avant d'écrire un calcul de règle
   dans un composant, chercher qui le fait déjà — celui-ci existait en quatre exemplaires.
7. **N1 + N4 sont le meilleur rapport valeur/effort du document.** Désactiver les jets coûte un
   `v-if`, et les surcharges manuelles débloquent *aujourd'hui* tout ce que le modèle d'effets ne
   sait pas exprimer (E11) — sans attendre le chantier qui le lui apprendra. Ni l'un ni l'autre ne
   demande de décision de règles ni de travail de design. **N6 étant tranché ([D18](./decisions.md#d18)),
   N1 n'a plus de préalable** : le premier réglage pose le substrat, les suivants sont une clé de plus.
8. **Le mobile (U1) est écarté par décision** — pas oublié. Ne pas le re-proposer.
9. **O1 (harmonisation non gardée) est un one-liner** : un filtre sur `attuned` dans
   `inventoryEffects`. À faire dès qu'un objet magique exigeant l'harmonisation est seedé, sinon
   la règle est silencieusement contournée.
