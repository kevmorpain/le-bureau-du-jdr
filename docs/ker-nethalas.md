# Module Ker Nethalas

> **Statut** : tranches 0 (socle) et 1 (fiche effective) écrites sur la branche `feat/ker-nethalas`, pas encore fusionnées. **Issue** : [#242 — X10](https://github.com/kevmorpain/le-bureau-du-jdr/issues/242).
> **Dernière mise à jour** : 2026-10-06.

Ce document trace le plan du module, les décisions et ce qui a été fait. Le statut GitHub (Status, Effort,
Famille) vit dans l'issue et le projet ; ce document porte le *quoi* et le *pourquoi*, comme `decisions.md`.

---

## Objectif

Un outil de **fiche et de suivi de run** pour le JDR solo *Ker Nethalas — Gravebound Edition v1.2*.

Le problème à résoudre : en jouant, on oublie d'appliquer des bonus et des malus en cours, et on perd du
temps à chercher dans les tables. Le principe : saisir la fiche de base, **activer ce qui est en cours**
(conditions, épuisement, événements, etc.), et lire des **scores effectifs avec le détail du calcul**
(« Dodge 45 → 25 : Restrained −20 »).

## Périmètre

- **V1** : tranches 0 et 1.
- **Ensuite** : tranches 2 et 3.
- **Hors périmètre** : Masteries modélisées (texte libre + modificateurs déclarés par le joueur), équipement par
  localisation et résolution du combat, bestiaire, textes d'ambiance (descriptions de salles et de couloirs),
  illustrations.

---

## Sources et licence

### Les textes

| Document | Rôle | Ce que sa page de crédits indique |
|---|---|---|
| *Gravebound Edition* v1.2 (EN, 2026) | **Référence** | Mécaniques et règles réutilisables librement dans ses propres contenus ; formulation exacte, présentation et illustrations **réservées** ; « ne pas copier ni traduire directement le texte » ; permission requise pour les illustrations |
| VF v1.8 (FR, fan-made, édition antérieure) | **Traductions** des libellés | Licence **CC BY 4.0** (partage et adaptation à toute fin, avec crédit), copyright Blackoath 2024. La page de titre dit « Version 1.6 » alors que le fichier s'appelle v1.8 : écart non élucidé |

### Constats (2026-10-04)

- La clause de Gravebound parle d'incorporer les mécaniques dans « votre propre contenu de JDR ». Un outil
  compagnon est une **zone grise**, pas un cas explicitement couvert. La clause cite la **traduction** comme
  interdite : traduire ne suffit donc pas à s'en dégager.
- Le dépôt de l'app communautaire citée sur le Discord de Blackoath (`ilu2112/Midnight-Throne`) n'affiche ni
  licence ni permission de l'éditeur (vérifié le 2026-10-04). Une tolérance observée n'est pas une autorisation.
- Le dépôt Le Bureau du JDR est **public** (`gh repo view`, 2026-10-04) : tout ce qui y est versionné est redistribué.

### Écarts constatés entre la VF et Gravebound

La VF ne peut pas servir de source pour les **données de personnage ni pour les effets des conditions**, seulement
pour le **vocabulaire** :

| Sujet | VF | Gravebound |
|---|---|---|
| Endurance et Résolution | des **compétences** (Résolution à 10) | des **Résistances**, hors compétences |
| Résistance magique | une Résistance de départ à 20 | **Spellward**, parmi trois Résistances (40 sur une, 20 sur les deux autres) |
| Enveloppes de départ des compétences | +20 sur trois, +10 sur quatre | +20 sur deux, +10 sur trois |
| Combat à mains nues | score de départ de 20 | aucun score de départ imprimé |
| Résistance à l'épuisement | existe | non mentionnée dans la section des attributs (p. 18) |
| Aveuglé | −40 à tous les tests | Désavantage aux tests de compétence, sauf Raison |
| Enflammé | D8 dégâts de Feu par round | 1 dégât de Feu par round |
| Effrayé | −20 aux tests d'attaque | malus variable qui baisse de 10 par tour |
| À terre | attaques contre lui à +30 | attaques contre lui avec Avantage |
| Endormi | toute attaque qui touche est un coup critique | toute attaque touche automatiquement |
| Étourdi | perd son tour | ne peut pas agir pendant X rounds ni se défendre activement |

Les enveloppes communes (+60, +40, +30 sur trois) sont identiques. Les tables « inchangées » sont à comparer une à
une avant toute reprise de texte.

### Règles de sourcing retenues (provisoires)

1. Les **mécaniques** sont encodées en données structurées (valeurs, conditions, durées), avec des libellés
   français courts **rédigés ici**.
2. Le texte de la VF (CC BY 4.0) peut être repris pour les tables inchangées, avec crédit explicite à Blackoath et
   à son traducteur, **après vérification contre Gravebound**. ⚠️ hypothèse : la licence CC BY couvre bien le texte
   de l'édition antérieure ; à confirmer avec l'éditeur.
3. Les **ajouts propres à Gravebound** sont reformulés, jamais traduits littéralement.
4. Pas de textes d'ambiance, pas d'illustrations.
5. **Aucune extraction de texte du livre dans le dépôt** : le travail se fait dans `~/ker-nethalas-sources/`
   (hors dépôt).
6. Chaque entrée de données porte sa **page de référence** dans Gravebound.

### Action en attente

Demander à Blackoath une **autorisation écrite** (`info@blackoathgames.com` ou Discord). Ce n'est pas un avis
juridique : c'est le moyen le moins coûteux de lever la zone grise. **Statut : à faire.**

---

## Décisions

### KN1 — Module isolé, pas de généralisation du modèle D&D
- **Contexte** : le `ruleset` distingue deux éditions de D&D (`shared/rules/ruleset.ts:4`) ; [D1](./decisions.md#d1)
  note que les deux systèmes ne sont pas compatibles poste à poste.
- **Décision** : routes `/ker-nethalas/…`, tables `kn_*`, règles dans `shared/ker-nethalas/`. Le compte, le
  layout, l'i18n et le déploiement sont réutilisés.
- **Alternatives écartées** : (a) remplacer `ruleset` par un `system` et abstraire la fiche : gros refactor en plein
  chantier 5.5, sur un modèle que D&D façonne de bout en bout ; (b) un dépôt séparé : perd le compte et l'infrastructure.
- **Pourquoi** : on ne factorise ce qui est commun qu'au deuxième ou troisième système, quand on verra ce qui l'est vraiment.

### KN2 — Édition de référence : Gravebound v1.2
La VF sert de source de traduction. Les tables sont comparées une à une avant reprise du texte.

### KN3 — Moteur pur partagé, tests par valeurs vérifiées à la main
- **Décision** : `resolve(fiche, sources actives)` est une fonction pure dans `shared/ker-nethalas/`, appelée par le
  client et le serveur ([D10](./decisions.md#d10)). Les tests portent sur des valeurs relues dans le livre
  ([D12](./decisions.md#d12)).
- **Ce qui est repris de D&D** : l'idée d'une union typée d'effets avec un drapeau `active`
  (`shared/utils/temporary_effects.ts`, `shared/utils/condition-effects.ts`).
- **Ce qui ne l'est pas** : leurs types, qui dépendent des caractéristiques, des types de dégâts et de la CA de D&D.

### KN4 — Stockage en base, rattaché au compte
Tables préfixées `kn_*` dans D1. L'état d'un run suit le personnage d'un appareil à l'autre, comme
`exhaustionLevel` côté D&D ([`persistence.md`](./persistence.md)). Si `db:generate` échoue en non-interactif,
migration écrite à la main (procédure dans `CLAUDE.md`).

### KN5 — Masteries en texte libre
Les Masteries et leurs Abilities ne sont pas modélisées. Le joueur les note en texte libre et peut déclarer des
modificateurs. Cela évite la plus grosse saisie de données et le risque de licence qui va avec.

### KN6 — Sourcing du contenu
Voir « Sources et licence » ci-dessus.

### KN7 — Arrondi
Le livre impose d'arrondir **vers le haut** (p. 70). Le moteur applique cette règle partout.

### KN8 — Fiche en saisie libre, valeurs de départ pré-remplies
- **Décision** : une table `kn_characters`. Les quatre jauges, l'épuisement et le modificateur de dégâts sont des
  colonnes ; compétences et résistances sont des colonnes JSON typées dont le schéma Zod dérive des clés canoniques
  de `shared/ker-nethalas/` ([D6](./decisions.md#d6), [D18](./decisions.md#d18)). Chaque compétence porte sa case
  « marquée pour amélioration » (p. 62). Jusqu'à 5 compétences supplémentaires, libres.
- **Valeurs de départ** : compétences aux scores imprimés sur la fiche (p. 19), résistances à 20 (p. 20), jauges à 0.
  Le joueur saisit le reste.
- **Bornes** : les résistances plafonnent à 80, quel que soit l'équipement (p. 20) ; les compétences non, car les
  objets et bonus circonstanciels dépassent 80 (p. 19).
- **Alternative écartée** : une table fille par compétence. Treize clés fixes, aucune requête transverse, et une
  seule écriture par sauvegarde avec le JSON.

### KN9 — Autorisation : default-deny sur tout `/api/ker-nethalas/**`
- **Décision** : le middleware `server/middleware/ker-nethalas-authz.ts` exige une session sur toute route du module,
  collection comprise, puis la propriété du survivant dès qu'un id est dans le chemin. Les helpers de chemin sont purs
  et testés (`server/utils/knPaths.ts`). Les handlers refusent en plus tout id qui n'est pas un entier pur.
- **Vérifié** (à la main) sous `nuxt dev` (Node) et `wrangler dev` (workerd) : sans session 401, autre compte 403,
  id non numérique 400. Les ids encodés (`%31`) sont **décodés avant le middleware** : ils sont donc contrôlés comme
  `1`, sans contournement.

### KN10 — Pas de hors-ligne en V1
`useOfflineMutation` indexe sa file par id de personnage D&D (collision possible avec un id Ker Nethalas), et le cache
PWA ne couvre que `/api/character_sheets`. Le module sauvegarde donc par PUT avec debounce d'une seconde
(`useKnAutosave`, qui s'appuie sur `useAutoSave` : un seul envoi en vol, plafond d'attente de 5 s).

### KN11 — Libellés français
Les termes de la VF sont repris quand le concept est identique (Esquive, Furtivité, Larcin, Fouille, Robustesse, Éther,
Santé mentale…). Trois libellés sont de ma rédaction :
- **Résistance magique** pour Spellward. ⚠️ hypothèse : même concept que la Résistance magique de la VF, à confirmer ;
- **Atouts** pour Perks (absents de la VF) ;
- **Modificateur de dégâts** pour la case du même nom de la fiche, stockée comme entier signé. ⚠️ hypothèse : elle
  correspond aux bonus fixes appliqués au dé choisi (p. 81) ; le livre ne nomme pas cette case dans les passages lus.

### KN12 — État en cours dans une colonne JSON `status`
- **Décision** : conditions, stade de la Rot, folies, « Domaine courant » (influence d'Overseer et événements Growing
  Darkness) et modificateurs libres vivent dans `kn_characters.status` (migration `0131`), un JSON typé dont le schéma
  Zod dérive des catalogues de `shared/ker-nethalas/catalog/` ([D6](./decisions.md#d6), [D18](./decisions.md#d18)).
  L'Épuisement reste une colonne : il est saisi dans les jauges.
- **Alternative écartée** : stocker les Growing Darkness par Domaine dès maintenant. Les Domaines n'existent qu'en
  tranche 2 ; un « Domaine courant » unique suffit pour la tranche 1 et se migrera vers une liste de Domaines.

### KN13 — Le moteur renvoie du détail, pas seulement un score
`resolveKnSheet` (`shared/ker-nethalas/resolve.ts`) renvoie pour chaque compétence et résistance : base, score effectif,
liste des modificateurs avec leur source, sources d'Avantage et de Désavantage, et mode de lancer (`normal`,
`advantage`, `disadvantage`, `both`). Pour chaque maximum de jauge, la suite des étapes de calcul. Les effets que le
calcul ne peut pas chiffrer (bonus des adversaires, dégâts par round…) sortent en **rappels**. Les libellés ne sont pas
dans le moteur : il renvoie des clés i18n (D11).

### KN14 — Catalogues de données, libellés rédigés ici
Conditions (p. 88-89), Rot (p. 87), Folie (p. 91), Growing Darkness (p. 120-122, 35 entrées dont les plages couvrent
exactement 1 à 100, vérifié par test) et influence d'Overseer (p. 100). Les noms de conditions ont été lus sur les pages
rendues (les lettrines manquent dans le texte extrait). Les effets sont relus dans Gravebound, jamais dans la VF
(voir « Écarts constatés »).

### KN15 — Les effets visant « tous les tests » atteignent aussi les résistances
Sauf quand le livre dit « compétences » : Gelé (−10 aux compétences) n'atteint pas les résistances, Nauséeux (−XX à tous
les tests) et le Désavantage d'Épuisement les atteignent. Les compétences supplémentaires ne subissent que les effets
visant toutes les compétences.

### KN16 — Vocabulaire aligné sur la VF
Les libellés reprennent les termes de la VF quand elle en a : **Pourriture** (« La Pourriture », stades), **Folie**,
**Conditions** (sommaire et titre du chapitre de la VF), **Dé de Tension**, **Influence de l'Overseer**. Deux écarts
assumés : **Obscurité Grandissante** (choix du PM, la VF dit « Obscurité Croissante ») et **Conditions** plutôt
qu'« États », que la fiche D&D de l'app emploie (« Aucun état actif ») : la VF ne contient pas « États », donc
« Conditions » est retenu (confirmé par le PM le 2026-10-06).

### KN17 — Plusieurs influences d'Overseer, événements cumulables
Chaque événement Obscurité Grandissante 81-100 fait tirer une influence : `domain.overseerInfluences` est donc une
**liste**, doublons permis (le livre précise qu'un trait comme « Pénétrant » se cumule). Un même événement peut
aussi être ajouté plusieurs fois et ses effets s'additionnent. L'éditeur signale les événements 81-100 qui n'ont pas
encore leur influence. Les compétences perdues de la Folie deviennent des objets `{ skill? }`, comme les événements
à compétence : le choix peut venir après l'ajout. Migration `0132` : convertit les survivants existants.

### KN18 — Zones de texte pour ce qui n'a pas de mécanique
Armes, équipement et résistances/vulnérabilités aux types de dégâts sont trois champs de texte libre
(`weapons`, `damage_affinities`, `equipment`, migration `0133`). Aucun calcul n'en est tiré ; ils rejoignent la
modélisation de l'équipement prévue plus tard.

---

## Inventaire des sources de modificateurs

Relevé dans Gravebound v1.2 (pages imprimées). Formulations paraphrasées ; les valeurs exactes seront relues dans
le PDF au moment de les encoder.

| Source | Effet | Page |
|---|---|---|
| Difficulté | de +30 à −30 sur le score avant le jet ; Normal (+0) par défaut | 69 |
| Avantage / Désavantage | modifie la lecture du D100 | 70 |
| Critiques et fumbles par compétence | bonus ou malus à la prochaine action, Avantage ou Désavantage, dégâts ou épuisement | 71-73 |
| Dés d'usage | piste D20 → D4 ; un jet de 1-2 fait descendre d'un cran, et au D4 la procédure se déclenche | 74 |
| Épuisement | 11-15 : soins divisés par deux ; 16-20 : Désavantage à tous les jets ; 21+ : mort | 90 |
| Conditions | 16 : Bleeding, Blinded, Burning, Charmed, Concealed, Cursed, Dazed, Freezing, Frightened, Paralyzed, Poisoned, Prone, Restrained, Sickened, Sleeping, Stunned ; l'hypothermie est l'aggravation du Freezing | 88-89 |
| La Rot | 8 stades cumulatifs (immunités, Toughness max, vision, rations, soins, Désavantages) | 87 |
| Folie | 10 résultats, la plupart cumulatifs (Toughness max, pertes de Sanity, Scavenge, Resolve, XP, compétence) | 91 |
| Sanity | jet de Resolve ; Frightening −2, Horrifying −4 ; pas de jet par adversaire mais un seul par rencontre | 91-92 |
| Source de lumière | 20 salles par torche ou lampe ; sans lumière : Blinded + Resolve | 96 |
| Overseer du Domaine | tirage D10 unique par Domaine : un modificateur appliqué à toutes les créatures du Domaine | 97, 100 |
| Growing Darkness | table D100 déclenchée par le Tension Die ; **les événements restent actifs pour le Domaine** : bonus de Combat par catégorie d'adversaire, −5 Spellward, difficulté des jets hors combat, lumière −2 par salle, +1 dégât subi, Camp Check −1, etc. | 120-122 |
| Tension Die / Lair / Domain Exit | dés d'usage D8, D10 et D8 → D4 | 97-98, 120 |
| Repos (Breather, Camp) | effets sur Toughness, Health, Sanity, Épuisement, lumière ; chaque activité de Camp a un coût en Épuisement et un modificateur au Camp Check | 123-125 |

**Chapitres pas encore lus** : combat détaillé (Defensive Moves, fumbles de combat, localisations, armure),
Masteries, Perks, objectifs personnels, objets et marchands. ⚠️ hypothèse : d'autres modificateurs s'y trouvent.

**Attention à l'extraction** : le texte extrait du PDF perd les lettrines et mélange parfois les plages des tableaux.
Pour les tableaux encodés, les pages ont été rendues en image et relues.

---

## Plan

Avant chaque tranche : annoncer l'approche, au moins une alternative écartée, ce que le dépôt fait déjà et ce que la
solution laisse de côté (`CLAUDE.md`, « Avant d'implémenter »).

| Tranche | Contenu | Statut |
|---|---|---|
| **0 — Socle** | entrée dans la navigation (`app/layouts/default.vue`), route `/ker-nethalas`, tables `kn_*`, fiche en saisie libre (nom, niveau, XP, Health/Toughness/Aether/Sanity, compétences, résistances) | écrite, vérifiée, non fusionnée |
| **1 — Fiche effective** | moteur pur ; conditions, épuisement, Rot, folies, Growing Darkness, influence d'Overseer, modificateurs libres ; scores effectifs avec détail du calcul ; tests de contrat | écrite, vérifiée, non fusionnée |
| **2 — Suivi de run** | compteur de salles, source de lumière, Tension Die, dés de Lair et de Domain Exit, Domaine et Overseer, effets du repos | à faire |
| **3 — Aide au jet et référence** | jet D100 avec cible calculée, doubles, Avantage/Désavantage ; référence des conditions rédigée ici | à faire |

`CLAUDE.md` (section Architecture) et `docs/persistence.md` ont été mis à jour avec la tranche 0.

## Questions ouvertes

- **Permission de Blackoath** (voir plus haut).
- **Interprétations à confirmer** (voir la section suivante).
- **Serveur de dev** : une fois, le navigateur a reçu une version périmée du fichier de traduction. Cause non établie :
  un essai a montré qu'une écriture par le chemin réseau Windows est vue, alors qu'un `sed -i` depuis WSL ne l'a pas
  été en 5 s. Redémarrer le serveur après avoir modifié un fichier de traduction.
- **Composants communs** (fiche, pistes) : à factoriser si un troisième système arrive.
- **Valeurs de création** : Health D6+10, Toughness 3D6+20, Aether D6+8, Sanity D6+10, Exhaustion 0 (p. 18), et les
  enveloppes de départ des compétences (p. 19). Un assistant de création pourrait les tirer et les valider ; hors
  tranche 0.
- **Amélioration des compétences** (p. 62) : les cases sont déjà stockées ; l'aide au jet d'amélioration au camp
  relèverait de la tranche 2.
- **Aether** : entièrement rechargé à chaque nouvelle salle (p. 18) ; à intégrer au compteur de salles (tranche 2).
- **Hors-ligne** : à reprendre si l'outil doit servir sans réseau (voir KN10).

## Interprétations à confirmer

Le moteur a dû trancher là où le livre se tait ou reste ambigu. Chaque choix est visible dans le détail du calcul et
peut se corriger avec un modificateur libre. Aucune n'est une règle établie.

- **Avantage et Désavantage ensemble** : le livre décrit la lecture du dé (p. 70) sans dire comment les combiner. Le
  moteur renvoie `both` et l'interface le signale, sans trancher.
- **« Non-combat Skill »** (Growing Darkness 73-74) : non défini. Retenu : tout sauf les quatre compétences d'arme et
  l'Esquive. Les compétences d'arme sont celles de l'index (p. 253), Combat à mains nues compris.
- **Effrayé (XX)** : la pénalité vise les attaques *contre la source de la peur* ; le moteur l'applique à toutes les
  compétences d'arme.
- **Hypothermie** : traitée comme une condition séparée (−50 à tous les tests). Si Gelé et Hypothermie sont tous deux
  actifs, les malus s'additionnent ; le livre fait de l'hypothermie l'aggravation du Gel, donc remplacer l'un par l'autre.
- **Maximum d'une jauge** : la moitié (Rot, stade 2) s'applique avant les retraits fixes, arrondie vers le haut
  (p. 70). Le livre ne précise pas l'ordre.
- **Rot** : les stades sont cumulatifs, et le stade 7 annule aussi le seuil de mort de l'Épuisement.
- **Plancher et plafond** : un score ou un maximum ne descend pas sous 0 ; une Résistance effective ne dépasse pas 80
  (p. 20), une compétence peut dépasser 80 (p. 19).
- **Folie 8 et Growing Darkness 57-58** (« réduire une compétence de 10 ») : modélisés comme un modificateur de −10,
  alors que le livre peut viser une baisse définitive du score de base. Dans ce cas, baisser le score de base à la place.
- **Growing Darkness « en cours » ou « immédiat »** : classement établi à la lecture du tableau ; un événement
  immédiat reste listé parmi les événements actifs du Domaine.
- **Événements répétés** : un même événement tiré deux fois cumule ses effets (ex. 73-74 deux fois = −20). Le livre ne
  dit pas explicitement que les effets se cumulent.
- **Une influence par événement 81-100** : lecture de « lancez sur la table Influence de l'Overseer » à chaque
  tirage ; le livre ne précise pas le cas d'un deuxième 81-100 dans le même Domaine.

---

## Journal

### 2026-10-06 — Rebase sur `main`
- La branche avait 7 commits de retard (lots 7 à 9, nettoyages, PR #251 et #252). Les migrations de `main` prenaient
  les numéros `0126` à `0129` : celles du module sont renumérotées `0126`-`0129` → `0130`-`0133`, et les numéros cités
  plus bas sont ceux d'après renumération. Les 7 commits sont regroupés en deux (code, doc), les PR étant
  fusionnées en squash.
- `main` a gagné un `useAutoSave` générique (PR #251) : `useKnAutosave` s'y appuie désormais au lieu de garder sa
  propre boucle de sauvegarde.

### 2026-10-06 — Retours sur la tranche 1
- Constat : après le choix d'une condition, le sélecteur affichait la clé brute (l'élément quittait la liste), et les
  libellés de la Folie s'affichaient bruts quand le serveur de dev servait une version périmée du fichier de
  traduction (cause non établie, voir les points ouverts). Corrigés : `KnAddPicker` remet le sélecteur à zéro après chaque ajout ; serveur redémarré.
- Retours du PM appliqués : compétences et résistances dans une seule carte ; La Pourriture avec points cliquables et
  liste cumulée des stades (comme l'Épuisement D&D) ; Folie en liste avec sélecteur ; plusieurs influences d'Overseer ;
  « Obscurité Grandissante » ; trois zones de texte. Décisions KN16 à KN18, migrations `0132` (données) et `0133`.
- Tests : 159 fichiers, 1535 tests verts ; lint de mes fichiers vert. La migration `0132` est testée sur des survivants
  à l'ancienne forme (influence unique, compétences perdues en chaînes).
- Le PM a validé le rendu visuel de ce lot. **Non vérifié par moi** dans le navigateur : le reset du sélecteur, les
  points de la Pourriture et la carte fusionnée (ma session de test a été bloquée par un cookie de session posé
  côté serveur, que le JavaScript ne peut pas écraser ; contournement : un mini-serveur éphémère qui pose le cookie).
- Test d'environnement : le module tourne dans un worktree (`.claude/worktrees/ker-nethalas`) car le checkout
  principal est revenu sur `main`.

### 2026-10-05 — Tranche 1 (fiche effective)
- Pages rendues en image pour relire les noms de conditions (16, dont Sleeping), le tableau Growing Darkness (plages
  confirmées) et l'Avantage/Désavantage (p. 70). Constat : les effets des conditions diffèrent beaucoup de la VF.
- Écrit : `shared/ker-nethalas/` (`effects.ts`, `status.ts`, `resolve.ts`, `catalog/*`), migration `0131`, composants
  `Kn*` (score effectif avec popover de détail, maximum effectif, rappels, éditeurs de conditions, Rot, folie, Domaine
  et modificateurs libres), libellés dans `fr.json`. Décisions KN12 à KN15.
- Tests ajoutés : moteur (35 cas aux valeurs calculées à la main d'après le livre), contrats des catalogues (plages
  Growing Darkness, libellés présents et sans orphelin), schéma de l'état, relecture JSON en base, migration `0131`
  sur des survivants existants. Suite complète : 159 fichiers, 1528 tests verts ; build et lint de mes fichiers verts.
- Vérifié à la main dans le navigateur : les chiffres de l'interface égalent les calculs à la main (Armes tranchantes
  40, Esquive 15 avec Avantage et Désavantage, Résistances à 10, Robustesse maximale 9, Éther maximal 9), détail du
  calcul, rappels, ajout et retrait de conditions, cumuls de folie, événements avec paramètre, modificateurs libres.
- **Non couvert par un test automatisé** : les composants Vue (vérifiés à la main).
- Corrigé en cours de route : un test du moteur supposait à tort qu'au stade 7 de la Rot aucun Désavantage ne subsiste
  (les effets du stade 6 restent actifs).

### 2026-10-04 — Tranche 0 (socle)
- Lecture du chapitre II de Gravebound (attributs, compétences, résistances, progression) : le modèle de personnage
  diffère de la VF (voir « Écarts constatés »). Décisions KN8 à KN11.
- Écrit : `shared/ker-nethalas/`, table `kn_characters` (migration `0130`), `server/utils/knCharacters.ts`,
  middleware d'autorisation, cinq routes `/api/ker-nethalas/characters`, pages `/ker-nethalas` et
  `/ker-nethalas/[id]`, auto-save, entrée de navigation, libellés dans `i18n/locales/fr.json`.
- Tests ajoutés : gardes de chemin et de navigation, schémas et valeurs par défaut, CRUD contre libsql avec clés
  étrangères actives (dont la suppression en cascade avec le compte). Suite complète : 156 fichiers, 1477 tests verts ;
  build de production et lint de mes fichiers verts.
- Vérifié à la main : API sous Node et workerd (droits, validation, ids encodés), interface dans le navigateur
  (création, édition, auto-save persisté, rechargement, suppression, noms accessibles des champs).
- **Non couvert par un test automatisé** : le middleware et les handlers eux-mêmes (le dépôt n'a pas de harnais HTTP) ;
  seuls leurs helpers purs et la logique `db` injectée le sont.
- Environnement : `node_modules` était périmé (`happy-dom` déclaré mais absent) ; `npm ci` l'a resynchronisé.
  `server/utils/drizzle.ts` porte déjà 3 erreurs de lint `@stylistic/operator-linebreak` sur `HEAD` (lignes 21, 23, 26),
  que ce changement n'a pas touchées.

### 2026-10-04 — Cadrage
- Lecture de Gravebound v1.2 (introduction, règles de base, conditions, épuisement, Sanity, exploration,
  Tension Die, repos) et de la fiche vierge ; lecture du début de la VF.
- Constat de licence et règles de sourcing (voir plus haut). Dépôt `ilu2112/Midnight-Throne` consulté : aucune
  licence affichée.
- Décisions KN1 à KN7.
- Issue #242 (X10) créée, avec le label `manquant`, et ajoutée au projet : Famille « X — Produit »,
  Effort « 🔴 Structurant », Décision requise « Oui ». `Lot` et `Ruleset` laissés vides (propres à D&D), `Priorité`
  non remplie (arbitrage du PM).
