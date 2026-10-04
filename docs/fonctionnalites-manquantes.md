# Registre des fonctionnalités manquantes

> **Index et archive depuis le 2026-09-27.** Chaque entrée ouverte est une issue du projet GitHub
> [Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2) (label `manquant`), qui porte son détail, son effort et son
> statut : ce fichier ne les tient plus à jour. Il garde la correspondance code → issue, les
> entrées résolues ou écartées, et les notes de conception transverses. Contenu complet avant
> migration : [version `b584f44`](https://github.com/kevmorpain/le-bureau-du-jdr/blob/b584f44e940e15adb77f8dd526750c3ab390f7ca/docs/fonctionnalites-manquantes.md).
>
> **Registres voisins** : [`audit-completude.md`](./audit-completude.md) (bugs, label `bug`),
> [`consolidation-2014.md`](./consolidation-2014.md) (dette, label `dette`),
> [`dnd-5.5.md`](./dnd-5.5.md) (règles 2024, label `5.5`).

---

## Sommaire

| Famille | Entrées | En un mot |
|---|---|---|
| [E — Effets déclarés, jamais appliqués](#e--effets-déclarés-jamais-appliqués) | E1–E13 | La donnée est seedée, le type existe, **personne ne la lit** |
| [C — Capacités de classe sans mécanique](#c--capacités-de-classe-sans-mécanique) | C1–C13 | ~340 features n'ont qu'une `description` |
| [R — Mécaniques de règles générales](#r--mécaniques-de-règles-générales) | R1–R10 | Avantage, critique, concentration, encombrement… |
| [O — Objets & inventaire](#o--objets--inventaire) | O1–O7 | Harmonisation non gardée, pas de poids ni de prix |
| [S — Sorts & incantation](#s--sorts--incantation) | S1–S6 | Rituel, limite de préparation, zone d'effet |
| [P — Parcours création / level-up](#p--parcours-création--level-up) | P1–P9 | Choix jamais proposés |
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

| Code | Suivi | Sujet |
|---|---|---|
| **E1** | [#131](https://github.com/kevmorpain/le-bureau-du-jdr/issues/131) | Bonus de compétence conditionnel (`skill_bonus`, Nain/Gnome) jamais appliqué |
| **E2** | ✅ résolu ([#132](https://github.com/kevmorpain/le-bureau-du-jdr/issues/132), lot 5) | Relance du 1 naturel (`reroll`, Chanceux du Halfelin) : appliquée à tout jet d'attaque, de caractéristique et de sauvegarde, sur un seul dé avec avantage ou désavantage (AideDD, Caractéristiques) |
| **E3** | ✅ résolu ([#133](https://github.com/kevmorpain/le-bureau-du-jdr/issues/133), lot 2) | Choix de maîtrise d'outil d'espèce jamais proposé : point de choix `tool` du Nain |
| **E4** | ✅ résolu ([#134](https://github.com/kevmorpain/le-bureau-du-jdr/issues/134), lot 2) | Choix de langues d'espèce et de dons jamais proposé : points de choix `language` (Humain, Demi-elfe, Haut-elfe, Fadette), langues du don Linguiste |
| **E5** | ✅ résolu ([#107](https://github.com/kevmorpain/le-bureau-du-jdr/issues/107), lot 2) | Choix de compétences d'espèce jamais proposé : point de choix `skill` (Polyvalence du Demi-elfe) |
| **E6** | ✅ résolu ([#135](https://github.com/kevmorpain/le-bureau-du-jdr/issues/135), lot 2) | Choix de sort d'espèce jamais proposé : point de choix `cantrip` du Haut-elfe |
| **E7** | ✅ résolu ([#136](https://github.com/kevmorpain/le-bureau-du-jdr/issues/136), lot 4) | Neutralisation de la pénalité d'armure lourde du Nain (`equipment_penalty`) : lue par `armorSpeedPenalty` |
| **E8** | [#137](https://github.com/kevmorpain/le-bureau-du-jdr/issues/137) | Vision étendue des manifestations (`sight_modifier`) jamais affichée |
| **E9** | [#138](https://github.com/kevmorpain/le-bureau-du-jdr/issues/138) | Modificateurs d'arme de pacte (`pact_weapon_modifier`) jamais appliqués |
| **E10** | [#139](https://github.com/kevmorpain/le-bureau-du-jdr/issues/139) | `extra_damage` jamais appliqué, et écrit sous une autre forme par l'éditeur d'objet |
| **E11** | ✅ résolu ([#140](https://github.com/kevmorpain/le-bureau-du-jdr/issues/140), lots 4 et 5) | Types d'effet absents de l'union : bonus de CA et de JS (`armor_class_bonus`, `saving_throw_bonus`), bonus d'attaque et de dégâts d'arme hors `magicBonus` (`weapon_attack_bonus`, `weapon_damage_bonus`, par portée), vitesses de nage / d'escalade / de creusement, bonus de vitesse (`speed_bonus`) ; l'éditeur d'objets propose aussi `advantage` avec sa condition en texte libre, affichée dans les défenses. **Lot 5** : l'avantage est *appliqué* au jet — sans `condition`, toujours ; avec, quand le joueur désigne la situation ; `unless` et `scope` en font un modèle interprétable là où la fiche connaît la condition (états actifs, arme de mêlée à la Force) ; bonus de dégâts de sorts (`spell_damage_bonus`) ([D22](./decisions.md#d22)). **Non porté** : un bonus d'attaque ou de dégâts à mains nues — l'application n'a aucune attaque à mains nues |
| **E12** | ✅ résolu ([#227](https://github.com/kevmorpain/le-bureau-du-jdr/issues/227), suite du lot 2) | Fadette : caractéristique d'incantation de la Magie des fées figée au Charisme — point de choix `spellcasting_ability` (migration 0122), lu sur la fiche pour les sorts d'espèce |
| **E13** | [#235](https://github.com/kevmorpain/le-bureau-du-jdr/issues/235) | Ténacité naine (Nain des collines) : effet `hp_per_level` absent, PV max trop bas |

**✅ résolu pendant la rédaction** — `fighting_style_modifier` : la **tranche 3** du chantier F2
(PR #63, mergée le 2026-09-14) applique désormais les bonus statiques sur la fiche — Défense +1 CA,
Archerie +2 à distance, Duel +2 à une main, Combat à deux armes (mod en main secondaire) — via le
module pur `shared/rules/fightingStyleEffects.ts`. `great_weapon` et `protection` restent rendus en
texte, par conception (relance de dés / réaction, non réductibles à un bonus statique).

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

| Code | Suivi | Sujet |
|---|---|---|
| **C1** | ✅ résolu ([#141](https://github.com/kevmorpain/le-bureau-du-jdr/issues/141), lot 4) | Défense sans armure (Barbare, Moine) et Résistance draconique de l'Ensorceleur : effet `unarmored_defense`, meilleure source retenue ([D21](./decisions.md#d21)) |
| **C2** | ✅ résolu ([#142](https://github.com/kevmorpain/le-bureau-du-jdr/issues/142), lot 11) | Attaque supplémentaire : effet `extra_attack` (Guerrier 2/3/4, Barbare, Moine, Paladin, Rôdeur, Collège de la vaillance), maximum entre classes (pas de cumul), affiché en Mode Combat |
| **C3** | ✅ résolu ([#143](https://github.com/kevmorpain/le-bureau-du-jdr/issues/143), lot 11) | Attaque sournoise : effet `weapon_damage_dice` (niveau ÷ 2, arrondi au supérieur, d6), proposé sur les armes à finesse ou à distance, jeté à part ; même effet pour le Châtiment divin amélioré |
| **C4** | ✅ résolu ([#144](https://github.com/kevmorpain/le-bureau-du-jdr/issues/144), lot 11) | Rage : compteur par niveau de barbare (illimité au 20), état « actif » (`character_features.active`), résistances et bonus de dégâts en vigueur tant qu'elle dure, suspendus par une armure lourde ; tout repos y met fin |
| **C5** | ✅ résolu ([#145](https://github.com/kevmorpain/le-bureau-du-jdr/issues/145), lot 11) | Points de ki : réserve = niveau de moine, DD de ki, usages (Défense patiente, Déluge de coups, Déplacement aérien, Parade, Frappe étourdissante) |
| **C6** | ✅ résolu ([#146](https://github.com/kevmorpain/le-bureau-du-jdr/issues/146), lot 11) | Points de sorcellerie : réserve = niveau d'ensorceleur, coûts de la Métamagie, conversion emplacement ⇄ points, emplacements créés (`character_spell_slots.created`, disparaissent au repos long), regain de 4 points au niveau 20 |
| **C7** | ✅ résolu ([#147](https://github.com/kevmorpain/le-bureau-du-jdr/issues/147), lot 11) | Inspiration bardique (utilisations, dé d6→d12, repos court dès le 5), Conduit divin (réserve partagée Clerc/Paladin), Forme sauvage (utilisations, FP et durée, Cercle de la lune), Châtiment divin (dés par niveau d'emplacement), Imposition des mains (réserve), Fougue / Second souffle / Inflexible |
| **C8** | ✅ résolu ([#148](https://github.com/kevmorpain/le-bureau-du-jdr/issues/148), lot 4) | Déplacement rapide (+3 m sans armure lourde) et Déplacement sans armure du Moine (+3 m au 2, +4,5 au 6, +6 au 10, +7,5 au 14, +9 au 18) : effet `speed_bonus`. Le don Mobile (+3 m) était lui aussi sans effet |
| **C9** | ✅ résolu ([#149](https://github.com/kevmorpain/le-bureau-du-jdr/issues/149), lot 5) | Touche-à-tout (`half_proficiency`, arrondi inférieur) et Athlète accompli du Champion (arrondi supérieur) ; Savoir-faire du Roublard (`proficient_check_minimum`, le « Talent fiable » du ticket) ; Critique brutal du Barbare (`critical_extra_dice`) dont la description disait « lors d'une rage », ce qu'AideDD ne dit pas ; Esquive instinctive du Roublard (`halve_damage_reaction`, case de la saisie de dégâts). **Non porté** : l'Esquive instinctive offerte par la Défense supérieure du Rôdeur (choix de capacité) |
| **C10** | [#231](https://github.com/kevmorpain/le-bureau-du-jdr/issues/231) | Capacités à repos déclaré mais sans compteur (~45 features) |
| **C11** | [#232](https://github.com/kevmorpain/le-bureau-du-jdr/issues/232) | Options de Conduit divin et usages de ki de sous-classe : payés hors réserve |
| **C12** | [#233](https://github.com/kevmorpain/le-bureau-du-jdr/issues/233) | Forme sauvage : PV de la bête et retour à la forme normale |
| **C13** | [#234](https://github.com/kevmorpain/le-bureau-du-jdr/issues/234) | Rage : fin automatique (inconscience, tour sans attaque) et sorts interdits |

> **Note de conception** : le North Star du repo (`consolidation-2014.md`) interdit le code bespoke
> par classe. Ces entrées demandent donc d'abord de **nommer les effets manquants** dans l'union
> (`unarmored_defense`, `extra_attack_count`, `scaling_damage_dice`, `resource_pool`…), puis de les
> seeder. C'est ce qui rend C4–C7 structurants : il manque le **concept de pool de ressource**
> (points de ki / sorcellerie / châtiment), qui n'a pas d'équivalent dans le schéma actuel
> (`character_features.currentUses` est un compteur d'usages, pas un pool dépensable par paquets).

---

## R — Mécaniques de règles générales

| Code | Suivi | Sujet |
|---|---|---|
| **R1** | ✅ résolu ([#108](https://github.com/kevmorpain/le-bureau-du-jdr/issues/108), lot 5) | Avantage / désavantage appliqués au jet : états, épuisement, armure non maîtrisée (Force et Dextérité seulement), armure à Discrétion désavantageuse, arme lourde en Petite taille, effets d'avantage (Rage, Instinct sauvage, Brave…), et choix du joueur pour le prochain jet ([D22](./decisions.md#d22)) |
| **R2** | ✅ résolu ([#150](https://github.com/kevmorpain/le-bureau-du-jdr/issues/150), lot 5) | Coup critique : dés doublés (Attaque sournoise, Châtiment divin compris), plage élargie du Champion (19, puis 18), dés de Critique brutal. Critique automatique (cible paralysée) : bascule manuelle dans le panneau des jets |
| **R3** | ✅ résolu (2026-10-02) — [#151](https://github.com/kevmorpain/le-bureau-du-jdr/issues/151) | Épuisement : niveau 6 (mort, affiché) et réduction de 1 au repos long, si le personnage a mangé et bu (case de la confirmation) |
| **R4** | ✅ résolu (2026-10-02) — [#152](https://github.com/kevmorpain/le-bureau-du-jdr/issues/152) | Concentration : le JS de CON existait ; rupture à 0 PV, sur un état d'incapacité et au lancement d'un autre sort à concentration, annoncée par un message |
| **R5** | [#153](https://github.com/kevmorpain/le-bureau-du-jdr/issues/153) | Encombrement et capacité de charge |
| **R6** | ✅ résolu (2026-10-02) — [#154](https://github.com/kevmorpain/le-bureau-du-jdr/issues/154) | Jets de mort portés par la fiche (`death_save_*`, migration 0118) ; 20 et 1 naturels, stabilisation, dégâts à 0 PV (critique : deux échecs) et mort instantanée dans `shared/rules/damage.ts` |
| **R7** | [#155](https://github.com/kevmorpain/le-bureau-du-jdr/issues/155) | Économie d'action décorative en Mode Combat |
| **R8** | ✅ résolu (2026-10-02), sauf une limite — [#156](https://github.com/kevmorpain/le-bureau-du-jdr/issues/156) | Repos long : PV temporaires vidés, jets de mort remis à zéro, épuisement réduit, charges d'objets à dés tirées au repos. **Non porté** : un seul repos long par période de 24 h (l'app n'a pas d'horloge de jeu) |
| **R9** | ✅ résolu : maîtrises (B12 [#104](https://github.com/kevmorpain/le-bureau-du-jdr/issues/104)), prérequis non bloquants (B14 [#109](https://github.com/kevmorpain/le-bureau-du-jdr/issues/109)), compétences (#101) | Prérequis et maîtrises de multiclassage |
| **R10** | ✅ résolu ([#157](https://github.com/kevmorpain/le-bureau-du-jdr/issues/157), lot 4) | Force requise des armures lourdes : -3 m et avertissement au survol de la vitesse quand la Force est inférieure à la colonne Force |

---

## O — Objets & inventaire

| Code | Suivi | Sujet |
|---|---|---|
| **O1** | [#158](https://github.com/kevmorpain/le-bureau-du-jdr/issues/158) | Harmonisation : limite de 3 objets liés non bloquante |
| **O2** | [#159](https://github.com/kevmorpain/le-bureau-du-jdr/issues/159) | Poids et prix des objets |
| **O3** | ✅ résolu ([#160](https://github.com/kevmorpain/le-bureau-du-jdr/issues/160), lot 4) | Pénalité de vitesse des armures lourdes : même règle que R10 (AideDD : seule une Force insuffisante réduit la vitesse) |
| **O4** | [#161](https://github.com/kevmorpain/le-bureau-du-jdr/issues/161) | Munitions non décomptées |
| **O5** | [#162](https://github.com/kevmorpain/le-bureau-du-jdr/issues/162) | Armes lancées et longue portée |
| **O6** | [#163](https://github.com/kevmorpain/le-bureau-du-jdr/issues/163) | Objets magiques à effets actifs (une charge → un effet) |
| **O7** | ✅ résolu (2026-09-26) ; restes : O7a [#164](https://github.com/kevmorpain/le-bureau-du-jdr/issues/164), O7b [#165](https://github.com/kevmorpain/le-bureau-du-jdr/issues/165) | Caractéristiques : effets d'objets et plafond |

---

## S — Sorts & incantation

| Code | Suivi | Sujet |
|---|---|---|
| **S1** | ✅ résolu ([#166](https://github.com/kevmorpain/le-bureau-du-jdr/issues/166), lot 3) | Limite de sorts préparés (compteur non bloquant) et sorts de domaine / de serment toujours préparés, dérivés de la sous-classe (`always_prepared_spell`, migration 0114) |
| **S2** | [#167](https://github.com/kevmorpain/le-bureau-du-jdr/issues/167) | Incantation rituelle |
| **S3** | [#168](https://github.com/kevmorpain/le-bureau-du-jdr/issues/168) | Zone d'effet des sorts |
| **S4** | [#169](https://github.com/kevmorpain/le-bureau-du-jdr/issues/169) | Type d'attaque du sort explicite (corps à corps / distance) |
| **S5** | [#170](https://github.com/kevmorpain/le-bureau-du-jdr/issues/170) | Composantes matérielles coûteuses |
| **S6** | [#171](https://github.com/kevmorpain/le-bureau-du-jdr/issues/171) | Sorts actifs : durée et effets en cours |

---

## P — Parcours création / level-up

Ce qui suit sont des **choix que le joueur ne peut pas faire du tout** (à distinguer des bugs de
cumul de `audit-completude.md`, où le choix existe mais se comporte mal).

| Code | Suivi | Sujet |
|---|---|---|
| **P1** | ✅ résolu (F2 expertise) | Expertise à la création |
| **P2** | [#172](https://github.com/kevmorpain/le-bureau-du-jdr/issues/172) | Manœuvres du Maître de guerre |
| **P3** | ✅ résolu ([#173](https://github.com/kevmorpain/le-bureau-du-jdr/issues/173), lot 3) | Sorts de domaine (Clerc), de serment (Paladin) et de cercle (Druide : point de choix `terrain`, migration 0115), Secrets magiques du Barde (sorts de n'importe quelle liste) |
| **P4** | [#174](https://github.com/kevmorpain/le-bureau-du-jdr/issues/174) | Ennemi juré et Explorateur-né (Rôdeur) |
| **P5** | [#175](https://github.com/kevmorpain/le-bureau-du-jdr/issues/175) | 2ᵉ style de combat du Champion (niveau 10) |
| **P6** | ✅ résolu ([#204](https://github.com/kevmorpain/le-bureau-du-jdr/issues/204), lot 2) | Outils au choix de classe jamais proposés (Barde, Moine, Barde rejoint en multiclasse) |
| **P7** | ✅ résolu ([#205](https://github.com/kevmorpain/le-bureau-du-jdr/issues/205), lot 2) | Maîtrise reçue en double (outil ou compétence) ni signalée ni remplaçable — à la création |
| **P8** | ✅ résolu ([#225](https://github.com/kevmorpain/le-bureau-du-jdr/issues/225), lot 2) | Choix d'historique (langues, outils) enregistrés comme ajouts manuels |
| **P9** | ✅ résolu ([#226](https://github.com/kevmorpain/le-bureau-du-jdr/issues/226), suite du lot 2) | Maîtrise reçue en double au level-up (multiclassage) ni signalée ni remplaçable |

> **Généralisation** (recompté pour #227) : sur les 19 `ChoiceKind` canoniques, **15** sont seedés en
> `progression` (`subclass`, `lineage`, `pact_boon`, `fighting_style`, `expertise`, `invocations`,
> `asi_or_feat`, `metamagic`, `skill`, `spell`, `language`, `tool`, `cantrip`, `terrain`,
> `spellcasting_ability`). Restent sans aucune
> donnée : `maneuvers`, `ancestry`, `weapon_mastery` (5.5), `ability_scores` (5.5). Un point de choix
> appartient à une classe (porteur de départ ou de multiclassage), une espèce, une lignée, un historique
> ou une règle générale (maîtrise en double) : cf. [`rules-engine.md`](./rules-engine.md).

---

## D — Contenu (données) manquant

| Code | Suivi | Sujet |
|---|---|---|
| **D1** | [#176](https://github.com/kevmorpain/le-bureau-du-jdr/issues/176) | Sorts : 118 seedés sur ~360 |
| **D2** | [#177](https://github.com/kevmorpain/le-bureau-du-jdr/issues/177) | Objets magiques quasi absents du catalogue |
| **D3** | [#178](https://github.com/kevmorpain/le-bureau-du-jdr/issues/178) | Drow absent de la base |
| **D4** | [#179](https://github.com/kevmorpain/le-bureau-du-jdr/issues/179) | Sous-classes incomplètes |

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

| Code | Suivi | Sujet |
|---|---|---|
| **U1** | 🚫 écarté (décision du 2026-09-14) — ne pas re-proposer sans décision de design | Mise en page mobile |
| **U2** | [#180](https://github.com/kevmorpain/le-bureau-du-jdr/issues/180) | Lecture d'un sort : accordéon et effets structurés |
| **U3** | [#181](https://github.com/kevmorpain/le-bureau-du-jdr/issues/181) | Effets d'objet rendus en JSON brut |
| **U4** | ✅ résolu ([#182](https://github.com/kevmorpain/le-bureau-du-jdr/issues/182), lot 5) | Historique des 100 derniers jets par fiche (navigateur), avec relance et copie |
| **U5** | ✅ résolu ([#183](https://github.com/kevmorpain/le-bureau-du-jdr/issues/183), lot 5) | Initiative conservée et affichée (fiche, Mode Combat), compteur de round. Pas d'ordre de tour : la fiche ne connaît pas les autres combattants |
| **U6** | [#184](https://github.com/kevmorpain/le-bureau-du-jdr/issues/184) | Pas de suivi de durée (conditions, sorts) |
| **U7** | ✅ résolu (2026-10-02) — [#185](https://github.com/kevmorpain/le-bureau-du-jdr/issues/185) | Confirmation avant un repos long et avant la suppression d'un objet (`ConfirmActionModal`) ; l'annulation d'un repos reste sans objet (pas d'historique, U4) |
| **U8** | [#186](https://github.com/kevmorpain/le-bureau-du-jdr/issues/186) | Pas de recherche texte (sorts, inventaire) |
| **U9** | ✅ résolu (2026-10-01) | Clé localStorage `armorClass` morte — supprimée de `useCharacterClasses` ([#187](https://github.com/kevmorpain/le-bureau-du-jdr/issues/187)) |
| **U10** | ✅ résolu (2026-09-15), voir la note plus bas | Montée en puissance des dégâts affichés |

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
représenter. Re-seed prod `?only=spells` fait (vérifié par l'API publique le 2026-09-27).

**Cas des sorts d'attaque** : leurs dégâts se jettent en **deux gestes** (« Lancer » = jet pour
toucher, puis « Dégâts »), donc le second doit savoir à quel niveau le sort a été lancé — sinon la
modale annonce 6d6 au niveau 3 et le bouton jette 4d6. Le niveau choisi au lancement est donc
**hérité** par le jet de dégâts, et affiché sur le bouton (« Dégâts (niv. 3) ») : un clic, pas de
question — on ne redemande pas ce qu'on vient de répondre. Un **chevron** à côté (seulement pour les
sorts qui montent en puissance) ouvre `RollDamageModal` pour jeter à un autre niveau : utile quand
le lancement n'est pas passé par l'app, ou après un rechargement (la mémoire est de session).
Composant distinct de `CastSpellModal` pour deux raisons : **aucun emplacement n'est dépensé** (il
l'a été au lancement) et les niveaux sont proposés **même épuisés** — après avoir lancé son dernier
emplacement de niveau 3, c'est précisément à ce niveau qu'il faut pouvoir jeter.

**Voisins déjà listés ailleurs, rappelés pour le contexte UI** : R1 (les boutons de jet sont
*à côté* des avertissements de désavantage qu'ils ignorent — l'incohérence est visible à l'œil nu),
R2 (résolu au lot 5 : le critique double les dégâts), R6 (résolu : les jets de mort suivent l'appareil),
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

| Code | Suivi | Sujet |
|---|---|---|
| **N1** | ✅ résolu ([#188](https://github.com/kevmorpain/le-bureau-du-jdr/issues/188), lot 7) | Préférence « lancer les dés dans l'application » : colonne `preferences` sur la fiche et le compte (migration 0126), héritage `fiche ?? compte ?? défaut` ([D23](./decisions.md#d23)) |
| **N2** | ✅ résolu ([#189](https://github.com/kevmorpain/le-bureau-du-jdr/issues/189), lot 7) | Saisie du résultat quand les jets sont désactivés : d20 du jet contre la mort, résultat d'une table aléatoire, total d'initiative ; concentration et recharge d'objet se tranchaient déjà à la main |
| **N3** | ✅ résolu (2026-10-02) — [#190](https://github.com/kevmorpain/le-bureau-du-jdr/issues/190) | Concentration libre : libellé `concentrating_on` à côté de la clé étrangère (migration 0119) |
| **N4** | ✅ résolu ([#191](https://github.com/kevmorpain/le-bureau-du-jdr/issues/191), lot 7) | Ajustements manuels de CA, vitesse, initiative et DD : les effets temporaires couvraient déjà CA, initiative et DD ; `speed_bonus` y est ajouté pour la vitesse ([D23](./decisions.md#d23)). Pas de surcharge absolue |
| **N5** | [#192](https://github.com/kevmorpain/le-bureau-du-jdr/issues/192) | Encart d'effet mécanique sur les capacités |
| **N6** | ✅ tranché → [D18](./decisions.md#d18), voir plus bas | Où vit une préférence ? |

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

| Code | Suivi | Sujet |
|---|---|---|
| **X1** | [#193](https://github.com/kevmorpain/le-bureau-du-jdr/issues/193) | Points d'expérience |
| **X2** | [#194](https://github.com/kevmorpain/le-bureau-du-jdr/issues/194) | Partage / lecture seule d'une fiche |
| **X3** | [#195](https://github.com/kevmorpain/le-bureau-du-jdr/issues/195) | Export / impression de la fiche |
| **X4** | [#196](https://github.com/kevmorpain/le-bureau-du-jdr/issues/196) | Groupe / campagne |
| **X5** | [#197](https://github.com/kevmorpain/le-bureau-du-jdr/issues/197) | Initiative de rencontre multi-participants |
| **X6** | [#198](https://github.com/kevmorpain/le-bureau-du-jdr/issues/198) | Version anglaise |
| **X7** | [#199](https://github.com/kevmorpain/le-bureau-du-jdr/issues/199) (partiel : l'historique des jets est livré avec U4, lot 5) | Journal de session au-delà des jets et des notes libres |

---

## Ce qu'il faut savoir avant de piocher

1. **E1–E10 sont les moins chers.** La donnée est seedée et typée ; il manque un lecteur. Aucun
   schéma à toucher, aucune migration. C'est aussi la famille la plus visible pour le joueur
   (« mon trait est écrit sur la fiche mais il ne fait rien »).
2. ~~**R1 (avantage/désavantage) est le plus gros écart perçu.**~~ ✅ **Résolu au lot 5** : le jet applique les
   sources que la fiche affichait ([D22](./decisions.md#d22)).
3. ~~**C1 (Défense sans armure) rend une valeur affichée fausse**~~ ✅ **Résolu au lot 4** : la CA sans armure
   et la vitesse sont calculées par des effets nommés ([D21](./decisions.md#d21)).
4. ~~**C5–C7 (pools de ressources) réclament un concept neuf** dans le schéma.~~ ✅ **Résolu au lot 11** : pas de
   concept neuf — `currentUses` (dépensé) + `maxUsesFormula` portent déjà une réserve ; le manque était les formules
   seedées, le niveau de la classe propriétaire et l'affichage par paquets. Voir [D20](./decisions.md#d20) et
   [`rules-engine.md`](./rules-engine.md#ressources-de-classe).
   **Restes** : suivis en C10 ([#231](https://github.com/kevmorpain/le-bureau-du-jdr/issues/231), features à `rechargeType` sans compteur), C11 ([#232](https://github.com/kevmorpain/le-bureau-du-jdr/issues/232), options de
   Conduit divin et ki de sous-classe), C12 ([#233](https://github.com/kevmorpain/le-bureau-du-jdr/issues/233), PV de la bête en Forme sauvage), C13 ([#234](https://github.com/kevmorpain/le-bureau-du-jdr/issues/234), fin de la Rage)
   et E13 ([#235](https://github.com/kevmorpain/le-bureau-du-jdr/issues/235), Ténacité naine). La Lame assoiffée (attaque d'arme de pacte) relève de E9 ([#138](https://github.com/kevmorpain/le-bureau-du-jdr/issues/138)).
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
9. ~~**O1 (harmonisation non gardée) est un one-liner**~~ — ✅ fait avec O7 (2026-09-26) : le filtre
   sur `attuned` est dans `inventoryEffects`. Reste la limite de 3 objets liés, toujours non bloquante.
