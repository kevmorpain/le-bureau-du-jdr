# Fonctionnalités manquantes — index E, C, R, O, S, P, D, U, N, X

> Index des fonctionnalités absentes (label `manquant` du projet
> [Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2)) : l'issue porte le détail,
> l'effort et le statut ; la décision, quand il y en a une, est dans [`decisions.md`](./decisions.md).
> Ce qui existe mais se comporte mal relève de [`audit-completude.md`](./audit-completude.md).
> Détail des entrées résolues avant nettoyage :
> [version `4cc089c`](https://github.com/kevmorpain/le-bureau-du-jdr/blob/4cc089c102ae2316f8eee79069036894519a41b9/docs/fonctionnalites-manquantes.md).

**À savoir avant de piocher**

- Une capacité de classe sans mécanique se règle par un effet nommé dans l'union `Effect` puis
  du seed, jamais par un `if` sur la classe ([North Star](./rules-engine.md#north-star)).
- **U1 (mise en page mobile) est écarté** par décision du 2026-09-14 : ne pas le re-proposer sans
  décision de design.

## Ouvertes

| Code | Suivi | Sujet |
|---|---|---|
| **C12** | [#233](https://github.com/kevmorpain/le-bureau-du-jdr/issues/233) | Forme sauvage : PV de la bête et retour à la forme normale |
| **R7** | [#155](https://github.com/kevmorpain/le-bureau-du-jdr/issues/155) | Économie d'action décorative en Mode Combat |
| **O2** (reste) | [#159](https://github.com/kevmorpain/le-bureau-du-jdr/issues/159) | Achat et vente avec la bourse (mode marchand) |
| **O6** | [#163](https://github.com/kevmorpain/le-bureau-du-jdr/issues/163) | Objets magiques à effets actifs (une charge → un effet) |
| **S7** | [#245](https://github.com/kevmorpain/le-bureau-du-jdr/issues/245) | Effets chiffrés des sorts actifs non préremplis |
| **D1** (reste) | [#222](https://github.com/kevmorpain/le-bureau-du-jdr/issues/222) | Descriptions des sorts d'origine à aligner sur le texte exact d'AideDD |
| **D6** | [#315](https://github.com/kevmorpain/le-bureau-du-jdr/issues/315) | Sorts des autres suppléments 2014 (Fizban, Strixhaven…) |
| **D2** | [#177](https://github.com/kevmorpain/le-bureau-du-jdr/issues/177) | Objets magiques quasi absents du catalogue |
| **D4** | [#179](https://github.com/kevmorpain/le-bureau-du-jdr/issues/179) | Sous-classes hors socle (Tasha, Xanathar, Fizban) |
| **X1** | [#193](https://github.com/kevmorpain/le-bureau-du-jdr/issues/193) | Points d'expérience |
| **X2** | [#194](https://github.com/kevmorpain/le-bureau-du-jdr/issues/194) | Partage / lecture seule d'une fiche |
| **X3** | [#195](https://github.com/kevmorpain/le-bureau-du-jdr/issues/195) | Export / impression de la fiche |
| **X4** | [#196](https://github.com/kevmorpain/le-bureau-du-jdr/issues/196) | Groupe / campagne |
| **X5** | [#197](https://github.com/kevmorpain/le-bureau-du-jdr/issues/197) | Initiative de rencontre multi-participants |
| **X6** | [#198](https://github.com/kevmorpain/le-bureau-du-jdr/issues/198) | Version anglaise |
| **X7** | [#199](https://github.com/kevmorpain/le-bureau-du-jdr/issues/199) | Journal de session au-delà des jets et des notes libres |

## Résolues

| Code | Suivi | Sujet |
|---|---|---|
| **E1** | [#131](https://github.com/kevmorpain/le-bureau-du-jdr/issues/131) | Bonus de compétence conditionnel (`skill_bonus`, Nain/Gnome) — [D30](./decisions.md#d30) |
| **E2** | [#132](https://github.com/kevmorpain/le-bureau-du-jdr/issues/132) | Relance du 1 naturel (Chanceux) |
| **E3** | [#133](https://github.com/kevmorpain/le-bureau-du-jdr/issues/133) | Choix d'outil d'espèce |
| **E4** | [#134](https://github.com/kevmorpain/le-bureau-du-jdr/issues/134) | Choix de langues d'espèce et de dons |
| **E5** | [#107](https://github.com/kevmorpain/le-bureau-du-jdr/issues/107) | Choix de compétences d'espèce |
| **E6** | [#135](https://github.com/kevmorpain/le-bureau-du-jdr/issues/135) | Choix de sort mineur d'espèce |
| **E7** | [#136](https://github.com/kevmorpain/le-bureau-du-jdr/issues/136) | Armure lourde sans pénalité pour le Nain |
| **E8** | [#137](https://github.com/kevmorpain/le-bureau-du-jdr/issues/137) | Vision étendue et sens (`shared/rules/senses.ts`) — [D30](./decisions.md#d30) |
| **E9** | [#138](https://github.com/kevmorpain/le-bureau-du-jdr/issues/138) | Modificateurs d'arme de pacte |
| **E10** | [#139](https://github.com/kevmorpain/le-bureau-du-jdr/issues/139) | `extra_damage` remplacé par `critical_extra_dice` / `weapon_damage_dice` |
| **E11** | [#140](https://github.com/kevmorpain/le-bureau-du-jdr/issues/140) | Bonus de CA, JS, attaque, dégâts, vitesses et avantage appliqués — [D22](./decisions.md#d22) |
| **E12** | [#227](https://github.com/kevmorpain/le-bureau-du-jdr/issues/227) | Caractéristique d'incantation de la Fadette au choix |
| **E13** | [#235](https://github.com/kevmorpain/le-bureau-du-jdr/issues/235) | Ténacité naine — [D30](./decisions.md#d30) |
| **C1** | [#141](https://github.com/kevmorpain/le-bureau-du-jdr/issues/141) | Défense sans armure — [D21](./decisions.md#d21) |
| **C2** | [#142](https://github.com/kevmorpain/le-bureau-du-jdr/issues/142) | Attaque supplémentaire |
| **C3** | [#143](https://github.com/kevmorpain/le-bureau-du-jdr/issues/143) | Attaque sournoise |
| **C4** | [#144](https://github.com/kevmorpain/le-bureau-du-jdr/issues/144) | Rage |
| **C5** | [#145](https://github.com/kevmorpain/le-bureau-du-jdr/issues/145) | Points de ki — [D20](./decisions.md#d20) |
| **C6** | [#146](https://github.com/kevmorpain/le-bureau-du-jdr/issues/146) | Points de sorcellerie |
| **C7** | [#147](https://github.com/kevmorpain/le-bureau-du-jdr/issues/147) | Inspiration bardique, Conduit divin, Forme sauvage, Châtiment, Imposition des mains… |
| **C8** | [#148](https://github.com/kevmorpain/le-bureau-du-jdr/issues/148) | Déplacement rapide, déplacement sans armure, don Mobile |
| **C9** | [#149](https://github.com/kevmorpain/le-bureau-du-jdr/issues/149) | Touche-à-tout, Savoir-faire, Critique brutal, Esquive instinctive |
| **C10** | [#231](https://github.com/kevmorpain/le-bureau-du-jdr/issues/231) | Compteurs des capacités à repos — [D32](./decisions.md#d32) |
| **C11** | [#232](https://github.com/kevmorpain/le-bureau-du-jdr/issues/232) | Coûts sur réserve, disciplines des quatre éléments — [D32](./decisions.md#d32) |
| **C13** | [#234](https://github.com/kevmorpain/le-bureau-du-jdr/issues/234) | Fin de la Rage — [D33](./decisions.md#d33) |
| **R1** | [#108](https://github.com/kevmorpain/le-bureau-du-jdr/issues/108) | Avantage / désavantage appliqués au jet — [D22](./decisions.md#d22) |
| **R2** | [#150](https://github.com/kevmorpain/le-bureau-du-jdr/issues/150) | Coup critique |
| **R3** | [#151](https://github.com/kevmorpain/le-bureau-du-jdr/issues/151) | Épuisement |
| **R4** | [#152](https://github.com/kevmorpain/le-bureau-du-jdr/issues/152) | Concentration |
| **R5** | [#153](https://github.com/kevmorpain/le-bureau-du-jdr/issues/153) | Encombrement — [D29](./decisions.md#d29) |
| **R6** | [#154](https://github.com/kevmorpain/le-bureau-du-jdr/issues/154) | Jets de mort portés par la fiche |
| **R8** | [#156](https://github.com/kevmorpain/le-bureau-du-jdr/issues/156) | Repos long complet (sauf la limite de 24 h : pas d'horloge de jeu) |
| **R9** | [#104](https://github.com/kevmorpain/le-bureau-du-jdr/issues/104), [#109](https://github.com/kevmorpain/le-bureau-du-jdr/issues/109) | Prérequis et maîtrises de multiclassage |
| **R10** | [#157](https://github.com/kevmorpain/le-bureau-du-jdr/issues/157) | Force requise des armures lourdes |
| **O1** | [#158](https://github.com/kevmorpain/le-bureau-du-jdr/issues/158) | Limite d'harmonisation bloquante — [D25](./decisions.md#d25) |
| **O2** | [#159](https://github.com/kevmorpain/le-bureau-du-jdr/issues/159) | Poids et prix des objets — [D29](./decisions.md#d29) |
| **O3** | [#160](https://github.com/kevmorpain/le-bureau-du-jdr/issues/160) | Pénalité de vitesse des armures lourdes |
| **O4** | [#161](https://github.com/kevmorpain/le-bureau-du-jdr/issues/161) | Munitions — [D28](./decisions.md#d28) |
| **O5** | [#162](https://github.com/kevmorpain/le-bureau-du-jdr/issues/162) | Armes lancées et longue portée |
| **O7** | [#164](https://github.com/kevmorpain/le-bureau-du-jdr/issues/164), [#165](https://github.com/kevmorpain/le-bureau-du-jdr/issues/165), [#299](https://github.com/kevmorpain/le-bureau-du-jdr/issues/299) | Caractéristiques : effets d'objets, plafond, faveurs — [D34](./decisions.md#d34) |
| **S1** | [#166](https://github.com/kevmorpain/le-bureau-du-jdr/issues/166) | Limite de sorts préparés, sorts toujours préparés |
| **S2** | [#167](https://github.com/kevmorpain/le-bureau-du-jdr/issues/167) | Incantation rituelle — [D24](./decisions.md#d24) |
| **S3** | [#168](https://github.com/kevmorpain/le-bureau-du-jdr/issues/168) | Zone d'effet |
| **S4** | [#169](https://github.com/kevmorpain/le-bureau-du-jdr/issues/169) | Type d'attaque explicite |
| **S5** | [#170](https://github.com/kevmorpain/le-bureau-du-jdr/issues/170) | Composante chiffrée ou consommée |
| **S6** | [#171](https://github.com/kevmorpain/le-bureau-du-jdr/issues/171) | Sorts actifs et durée structurée (effets chiffrés : S7) |
| **P1** | F2 | Expertise à la création |
| **P2** | [#172](https://github.com/kevmorpain/le-bureau-du-jdr/issues/172) | Manœuvres du Maître de guerre — [D26](./decisions.md#d26) |
| **P3** | [#173](https://github.com/kevmorpain/le-bureau-du-jdr/issues/173) | Sorts de domaine, de serment, de cercle ; Secrets magiques |
| **P4** | [#174](https://github.com/kevmorpain/le-bureau-du-jdr/issues/174) | Ennemi juré et Explorateur-né |
| **P5** | [#175](https://github.com/kevmorpain/le-bureau-du-jdr/issues/175) | 2ᵉ style de combat du Champion |
| **P6** | [#204](https://github.com/kevmorpain/le-bureau-du-jdr/issues/204) | Outils au choix de classe |
| **P7** | [#205](https://github.com/kevmorpain/le-bureau-du-jdr/issues/205) | Maîtrise reçue en double à la création |
| **P8** | [#225](https://github.com/kevmorpain/le-bureau-du-jdr/issues/225), [#207](https://github.com/kevmorpain/le-bureau-du-jdr/issues/207) | Choix d'historique enregistrés comme ajouts manuels ; équipement de départ ([D28](./decisions.md#d28)) |
| **P9** | [#226](https://github.com/kevmorpain/le-bureau-du-jdr/issues/226) | Maîtrise reçue en double au level-up |
| **D1** | [#176](https://github.com/kevmorpain/le-bureau-du-jdr/issues/176) | Sorts : liste AideDD 2014 complète, niveaux 0 à 9 (479 seedés) — [D35](./decisions.md#d35) |
| **D3** | [#178](https://github.com/kevmorpain/le-bureau-du-jdr/issues/178) | Drow (périmé : la lignée existait) |
| **U2** | [#180](https://github.com/kevmorpain/le-bureau-du-jdr/issues/180) | Lecture d'un sort sur la ligne — [D24](./decisions.md#d24) |
| **U3** | [#181](https://github.com/kevmorpain/le-bureau-du-jdr/issues/181) | Effets d'objet libellés |
| **U4** | [#182](https://github.com/kevmorpain/le-bureau-du-jdr/issues/182) | Historique des jets |
| **U5** | [#183](https://github.com/kevmorpain/le-bureau-du-jdr/issues/183) | Initiative et compteur de round |
| **U6** | [#184](https://github.com/kevmorpain/le-bureau-du-jdr/issues/184) | Durée en rounds des états et effets temporaires |
| **U7** | [#185](https://github.com/kevmorpain/le-bureau-du-jdr/issues/185) | Confirmations (repos long, suppression d'objet) |
| **U8** | [#186](https://github.com/kevmorpain/le-bureau-du-jdr/issues/186) | Recherche par nom |
| **U9** | [#187](https://github.com/kevmorpain/le-bureau-du-jdr/issues/187) | Clé localStorage `armorClass` morte |
| **U10** | — | Montée en puissance : une seule résolution (`shared/rules/spellScaling.ts`), cf. [`character-sheet.md`](./character-sheet.md#patterns-clés) |
| **U12** | [#238](https://github.com/kevmorpain/le-bureau-du-jdr/issues/238) | Le compteur de tour fait avancer les durées |
| **N1** | [#188](https://github.com/kevmorpain/le-bureau-du-jdr/issues/188) | Préférence « lancer les dés dans l'application » — [D23](./decisions.md#d23) |
| **N2** | [#189](https://github.com/kevmorpain/le-bureau-du-jdr/issues/189) | Saisie du résultat quand les jets sont désactivés |
| **N3** | [#190](https://github.com/kevmorpain/le-bureau-du-jdr/issues/190) | Concentration libre |
| **N4** | [#191](https://github.com/kevmorpain/le-bureau-du-jdr/issues/191) | Ajustements manuels de CA, vitesse, initiative, DD — [D23](./decisions.md#d23) |
| **N5** | [#192](https://github.com/kevmorpain/le-bureau-du-jdr/issues/192) | Encart « Sur la fiche » des capacités |
| **N6** | — | Où vit une préférence : [D18](./decisions.md#d18) |
