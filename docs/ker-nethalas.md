# Module Ker Nethalas

> **Statut** : tranches 0 à 10, X17, U13 et KN52 à KN55 fusionnées (PR #253 à #296, dernière le 2026-10-18).
> **Décisions** : [`ker-nethalas-decisions.md`](./ker-nethalas-decisions.md) (KN1 à KN55). Journal des tranches avant
> nettoyage : [version `4cc089c`](https://github.com/kevmorpain/le-bureau-du-jdr/blob/4cc089c102ae2316f8eee79069036894519a41b9/docs/ker-nethalas.md#journal).

Ce document trace le plan du module, sa licence et ses interprétations des règles. Le statut GitHub (Status, Effort,
Famille) vit dans l'issue et le projet ; ce document porte le *quoi* et le *pourquoi*, comme `decisions.md`.

---

## Objectif

Un outil de **fiche et de suivi de run** pour le JDR solo *Ker Nethalas — Gravebound Edition v1.2*.

Le problème à résoudre : en jouant, on oublie d'appliquer des bonus et des malus en cours, et on perd du
temps à chercher dans les tables. Le principe : saisir la fiche de base, **activer ce qui est en cours**
(conditions, épuisement, événements, etc.), et lire des **scores effectifs avec le détail du calcul**
(« Dodge 45 → 25 : Restrained −20 »).

## Périmètre

- **Livré** : fiche et fiche effective, suivi de run, repos, aide au jet ; création du survivant, Maîtrises, objectifs
  et amulettes ; exploration, rencontres, bestiaire et combat ; inventaire, butin et objets magiques ; progression ;
  début de partie (voir le plan). La mécanique « aléatoire » du livre est rédigée en français hors du dépôt (KN27).
- **Hors périmètre** : les illustrations du livre, qui ne sont jamais reprises.

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

### Accord de l'éditeur (2026-10-07)

Le PM a contacté Blackoath. Ils sont d'accord pour l'**usage personnel** qu'il en fait ; il n'existe pas de traduction
française officielle, donc il peut **formuler comme il le souhaite**, à condition de ne pas reprendre les illustrations
telles quelles. Aucun texte écrit n'est conservé dans le dépôt. La portée de l'accord pour un **dépôt public** n'a pas été
précisée : le PM a choisi de laisser le contenu rédigé à partir du livre **hors du dépôt** (KN27). Le bloc de licence du
livre, de son côté, laisse réutiliser librement les mécaniques et les règles, et réserve la formulation, la
présentation et les illustrations.

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
4. Pas d'illustrations.
5. **Aucune extraction de texte du livre dans le dépôt** : le travail se fait dans `~/ker-nethalas-sources/`
   (hors dépôt). Le contenu rédigé en français (Maîtrises, bestiaire, tables, descriptions) vit lui aussi hors du
   dépôt et se charge en base (KN27).
6. Chaque entrée de données porte sa **page de référence** dans Gravebound ; dans le code, elle ne figure pas (voir
   « Commentaires » dans `CLAUDE.md`).

### Action en attente

Aucune. L'accord de Blackoath est obtenu (voir plus haut) ; reste à leur demander, si le PM le souhaite, si un dépôt
public est couvert.

---

## Inventaire des sources de modificateurs

Relevé initial (cadrage) dans Gravebound v1.2, pages imprimées, formulations paraphrasées. Les chapitres lus ensuite
(combat, Maîtrises, Atouts, objectifs, objets) ont leurs modificateurs dans les décisions KN.

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

**Attention à l'extraction** : le texte extrait du PDF perd les lettrines et mélange parfois les plages des tableaux.
Pour les tableaux encodés, les pages ont été rendues en image et relues.

---

## Plan

Avant chaque tranche : annoncer l'approche, au moins une alternative écartée, ce que le dépôt fait déjà et ce que la
solution laisse de côté (`CLAUDE.md`, « Avant d'implémenter »).

| Tranche | Contenu | Statut |
|---|---|---|
| **0 — Socle** | entrée dans la navigation (`app/layouts/default.vue`), route `/ker-nethalas`, tables `kn_*`, fiche en saisie libre (nom, niveau, XP, Health/Toughness/Aether/Sanity, compétences, résistances) | fusionnée (PR #253) |
| **1 — Fiche effective** | moteur pur ; conditions, épuisement, Rot, folies, Growing Darkness, influence d'Overseer, modificateurs libres ; scores effectifs avec détail du calcul ; tests de contrat | fusionnée (PR #253) |
| **2a — Suivi de run** | Domaines, compteur de salles, source de lumière, Dé de Tension, dés de Lair et de Sortie, actions « Nouvelle salle », « Nouveau couloir » et « Retour dans une zone explorée », tirage dans la table de l'Obscurité Grandissante, chemin du Domaine enregistré (une entrée par salle ou couloir, avec ses dés) | fusionnée (PR #254) |
| **2b — Repos** | Reprendre son souffle, Établir le camp (activités, test de Camp, bénéfices, Rations), provisions | fusionnée (PR #255) |
| **3 — Aide au jet et référence** | jet D100 avec cible calculée, doubles, Avantage/Désavantage, effets des critiques et maladresses, application des effets chiffrés ; référence des conditions rédigée ici | fusionnée (PR #256) |
| **4a — Contenu privé** | table `kn_content`, chargement depuis des fichiers hors du dépôt, lecture sous session (KN27) ; issue X11 (#258) | fusionnée (PR #266) |
| **4b — Création du survivant** | assistant en étapes (identité, jauges tirées aux dés, enveloppes de compétences, résistances, objectifs, équipement de départ), validation serveur ; issue X12 (#259) | fusionnée (PR #266) |
| **4c — Maîtrises (pilote)** | format public, contenu privé de deux Maîtrises (Faucheur abyssal, Arcaniste), étape de création, section de la fiche, points d'Aptitude (KN30) ; issue X13 (#260) | fusionnée (PR #266); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **4c bis — Objectifs personnels** | format public, contenu privé des 39 objectifs, étape de création (liste), section de la fiche (progrès à la main, récupération de la récompense, KN31) ; rattaché à X12 (#259) | fusionnée (PR #266); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **4d — Maîtrises (suite)** | les 18 autres Maîtrises, en quatre lots ; issue X13 (#260) | fusionnée (PR #266); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **4e — Amulettes** | amulettes possédées, une portée, paliers communs, tirage au D20 (KN32) ; issue X13 (#260) | fusionnée (PR #266) |
| **4f-1/2 — Coûts, aptitudes Maintenues, effets chiffrés** | bouton « Utiliser », interrupteur « Maintenir », effets du moteur (KN33) ; issue X13 (#260) | fusionnée (PR #266) |
| **4f-3 — Effets sur soi** | points temporaires, soin de Blessures, fin de combat, fréquences d'usage, effets sur soi avec dés (KN34) | fusionnée (PR #266) |
| **4f-4 — Activités de camp des traits** | activités ajoutées au camp par certains traits, bonus au test de camp, composants rituels (KN35) | fusionnée (PR #266) |
| **5a — Exploration : tables, forme, description, rencontre, porte, fouille** | format des tables de tirage, forme au D100, descriptions de couloirs et de salles, contrôle de combat, porte, fouille avec application des effets (KN36) ; issue X14 (#261) | fusionnée (PR #268); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **5b — Événements** | table des événements (D100), contenu privé, ses tests et ses résultats (KN36, KN37) | fusionnée (PR #268); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **5c — Verrous, pièges, fouille approfondie** | vérification des portes et des contenants (Perception, piège, type de piège, verrou), fouille approfondie, tests de Tension supplémentaires (KN36) | fusionnée (PR #268); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **5d — Tests en ligne, conséquences, actions d'obstacle** | « Tester » fait le test dans le bloc de l'entrée, résultats d'événement, de fouille et de piège appliqués à la fiche, désamorcer / contourner / déclencher / crocheter / forcer (KN37) | fusionnée (PR #268); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **6a — Rencontres et bestiaire** | tirage de la rencontre (D6 puis D20) et de l'Overseer du Domaine (D10), fiche de créature adaptée au niveau, table d'actions, catalogues de règles (types de dégâts, localisations, types et traits de créature) (KN38) ; issue X15 (#262) | fusionnée (PR #269) |
| **6b — Suivi de combat** | initiative et surprise, attaque opposée, localisation, dégâts et armure, actions des monstres, mouvements défensifs (KN39) | fusionnée (PR #269) |
| **6c — Overseers, sbires, effets des actions** | les 53 fiches du bestiaire (43 créatures, 10 Overseers), les 5 sbires de Maîtrise (alliés dans le combat) et les effets que le texte des actions décrit : dégâts dus, directs, moitié, durées sur le survivant et sur les créatures, soins, Santé temporaire, invocations (KN38, KN39) | fusionnée (PR #269) |
| **7 — Inventaire, équipement, butin** | issue X16 (#263), une seule PR : (a) inventaire, emplacements, capacité (KN40), catalogue d'objets, armes et armures dans le combat, Intégrité ; (b) butin, gemmes, fragments, potions, marchand ; (c) objets magiques, reliques, attunement | fusionnée (PR #270); contenu à relire par le PM ([X35](https://github.com/kevmorpain/le-bureau-du-jdr/issues/313)) |
| **8 — Progression** | sources d'XP (X19 #271), passage de niveau (X20 #272), amélioration de compétence au camp (X21 #273), Atouts (X22 #274), récompenses d'objectifs (X23 #275) avec le progrès automatique (X17 #265) ; une seule PR, un commit par issue (KN45) | fusionnée (PR #286) ; jeu `personalGoals` typé chargé en production |
| **9 — Règles de combat restantes** | Overseer vaincu (X25 #277), test de Résolution contre les créatures Effrayantes et Terrifiantes (X24 #276), Bandages hors combat (X28 #280), lampe en combat (X32 #284), combat à deux armes (X26 #278), arme ou bouclier sacrifié (X27 #279), Destin refusé (X29 #281) ; une seule PR, un commit par issue (KN46) | fusionnée (PR #287) |
| **X17 — Progrès automatique des objectifs** | champ `counts` sur l'objectif, événements du combat, de l'exploration et du butin qui font avancer le progrès, sans confirmation (KN47) | fusionnée (PR #288) |
| **10 — Début de partie** | Débuts difficiles (X30 #282), Domaine d'introduction : carte fixe, contenu des salles, table de rencontres propre, sortie sans retour (X31 #283), marchand conservé dans le Domaine (X33 #285) ; une seule PR (KN48) | fusionnée (PR #289) |
| **U13a — Fiche en trois colonnes** | survivant, donjon et pièce, barre d'état collante (KN28, KN49) ; issue U13 (#264) | fusionnée (PR #291) |
| **U13b — Pièces persistantes** | actions sur une pièce passée : fouille, piège, fuite et reprise du combat ; issue X34 (#290) ; KN50 | fusionnée (PR #291) |
| **U13c — Revue de la fiche** | cartes repliables, compacité, couleurs, repos, dés d'entrée, repères (KN51) | fusionnée (PR #292) |
| **Folie automatique** | « Les ténèbres approchent » et « Mémoire défaillante » appliqués aux pertes de Santé mentale et aux gains d'XP, Armure d'effet, Outils de voleur (KN52) | fusionnée (PR #293) |
| **Aptitudes d'attaque** | aptitudes cochées dans l'attaque : bonus, dés typés, critique, défense interdite, seconde attaque, toutes les cibles, marque (KN53) | fusionnée (PR #294) |
| **Mouvements défensifs, maladresses et passifs** | mouvements défensifs et maladresses du survivant et des créatures, réaction à l'Esquive, retrait d'Armure, passifs, gravure, dés typés (KN54) | fusionnée (PR #295) |
| **Restes d'aptitudes** | arme à terre, maximum par niveau, projection de l'esprit (KN55) | fusionnée (PR #296) |

## Questions ouvertes

- **Dépôt public et accord de Blackoath** : l'accord couvre l'usage personnel ; pour un dépôt public, voir « Accord de
  l'éditeur » (le contenu reste hors du dépôt, KN27).
- **Interprétations à confirmer** (voir la section suivante) : à trancher par le PM, [X36](https://github.com/kevmorpain/le-bureau-du-jdr/issues/314).
- **Serveur de dev** : une fois, le navigateur a reçu une version périmée du fichier de traduction. Cause non établie :
  un essai a montré qu'une écriture par le chemin réseau Windows est vue, alors qu'un `sed -i` depuis WSL ne l'a pas
  été en 5 s. Redémarrer le serveur après avoir modifié un fichier de traduction.
- **Composants communs** (fiche, pistes) : à factoriser si un troisième système arrive.
- **Hors-ligne** : à reprendre si l'outil doit servir sans réseau (voir KN10).

## Interprétations à confirmer

Le moteur a dû trancher là où le livre se tait ou reste ambigu (suivi : [X36](https://github.com/kevmorpain/le-bureau-du-jdr/issues/314)). Chaque choix est visible dans le détail du calcul et
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
- **Dé de Tension global ou par Domaine** : le livre le remet à D8 « à la première entrée dans un nouveau Domaine »
  (p. 120) sans dire s'il reprend son état en revenant dans un ancien Domaine. Retenu : un seul dé pour le survivant.
- **Règle optionnelle des 15 salles** (p. 98) : la salle suivante est le Lair. Rappelée, jamais appliquée d'office.
- **Couloirs** : le livre parle de « salles » pour la lumière et pour la règle des 15 ; l'outil compte salles et
  couloirs ensemble, un couloir neuf consommant de la lumière comme une salle.
- **Lair et Sortie dans la même salle** : le dé de Sortie ne se lance qu'à partir de la salle *suivante* ; la salle
  où le Lair est trouvé ne fait pas aussi le dé de Sortie.
- **Événements dans le Lair** : le livre interdit le test de rencontre de combat dans le Lair et demande la table des
  Événements quand il n'y a pas de rencontre ; l'outil rappelle donc la table des Événements dans le Lair.
- **Lumière à 0** : l'état « sans lumière » est déduit du compteur. Si une autre source éclaire le survivant (sort,
  équipement lumineux), remonter le compteur à la main : l'outil ne connaît pas ces sources.
- **Reprendre son souffle au D4** : le dé reste au D4. Le livre dit « un cran de moins » mais ne déclenche la procédure
  que sur un jet de 1-2 au D4 (p. 74) ; descendre sous le D4 n'est pas défini.
- **Reprendre son souffle et la Santé** : la Santé et la Robustesse se rendent toutes deux, sans attendre que la
  Robustesse soit pleine (la règle générale des Blessures soigne d'abord la Robustesse). Le texte du souffle les cite
  séparément.
- **Réduction de moitié** : elle porte sur les bénéfices du camp (Robustesse rendue, Santé, Santé mentale, Épuisement
  retiré, D4 de la Pourriture) ; la moitié de la Robustesse est celle de la Robustesse *manquante*. Les effets de Dormir
  ne sont pas des bénéfices du camp et ne sont pas réduits.
- **Ordre de l'Épuisement** : les coûts des activités s'ajoutent avant les retraits (−10, −5 en dormant), puis le
  résultat est ramené à 0 au minimum.
- **Test de Camp** : le modificateur s'ajoute au D20 et le total doit atteindre 12 ; le livre parle de réduire « le jet »,
  sans règle de réussite ou d'échec automatique sur un 1 ou un 20.
- **Test raté** : le livre place la rencontre avant la réduction des bénéfices ; l'outil applique d'emblée les bénéfices
  réduits et rappelle de tirer la rencontre.
- **Pourriture au repos** : le rappel du test d'Endurance s'affiche dès le stade 1 ; un survivant infecté au stade 0 n'est
  pas représenté.
- **Ration cuisinée** : une Ration fabriquée pendant le camp peut être celle que le camp consomme.
- **Équipement de départ** : le « D20 » de la liste (l'extraction du livre a perdu son libellé) est lu comme **D20
  pièces** ⚠️ hypothèse, la monnaie du livre étant les « Coins ». Une première partie ne prend aucun équipement : l'assistant
  la propose par défaut, le kit est une option.
- **Jauges de départ** : elles démarrent pleines (valeur courante = maximum), le livre donnant seulement la valeur de départ.
- **Enveloppes de compétences** : « +60 à une compétence d'arme, +40 à une seconde » est lu comme deux compétences d'arme
  **différentes** ; les +30, +20 et +10 vont à n'importe quelle compétence, armes comprises.
- **Points d'Aptitude** : +1 par niveau et 2 au niveau 1, dépensés sur n'importe quelle aptitude des Maîtrises du
  survivant, du palier 1 au palier 5 ; le trait d'une Maîtrise se débloque avec sa première aptitude. Deux Maîtrises
  entraînées au plus (la troisième, par amulette, n'est pas encore gérée).
- **Palier 1 de l'Arcaniste** : « jusqu'à /2 adversaires » (le symbole du niveau est perdu par l'extraction) est lu comme
  la moitié du niveau, arrondie au supérieur (règle d'arrondi du livre).
- **Coût « Spécial »** (palier 2 de l'Arcaniste) : stocké sans coût chiffré (`null`), affiché tel quel.
- **100 sur le D100** : lu « 00 », donc un double (p. 71 : « le même chiffre aux dizaines et aux unités »). Échec
  critique avec un score inférieur à 100, réussite critique sinon.
- **Avantage et Désavantage ensemble** : le dé est lu normalement ; le livre ne dit pas comment les combiner. La
  lecture se choisit à la main dans la carte de jet.
- **Difficulté et plafond des résistances** : la difficulté s'ajoute au score effectif *après* le plafond de 80 des
  résistances (p. 69 la décrit comme un modificateur appliqué avant le jet, sans parler du plafond).
- **Raison, échec critique** : « Increase the Lair/Domain Exit Die by 1 stage » est lu comme un dé plus grand (D10 → D12,
  il faudra plus de salles) ; le dé touché est celui de Lair tant que le Lair n'est pas trouvé, puis celui de Sortie.
  Sans effet au D20 ni une fois la Sortie trouvée.
- **Dégâts d'un critique** : retirés à la Robustesse puis à la Santé, comme les Blessures, sans armure.
- **Compétences ajoutées à la main** : doubles et criticité détectés, mais aucun effet de critique (le livre n'en
  donne pas).

- **« Après le niveau N »** (fiches de créature) : lu comme *à partir du niveau N+1*. Le livre dit qu'un adversaire de
  niveau 11 reçoit les deux paliers, 5 et 10, ce qui va dans ce sens ; le cas du niveau exact reste implicite.
- **Dé de dégâts d'un palier** (« +D6 damage ») : un dé de plus dans la réserve de dégâts de la créature, qui garde le plus
  haut (p. 81) ; un bonus fixe (« +1 damage ») s'ajoute au dé choisi. Les paliers s'ajoutent entre eux.

- **Point faible et Coup critique** : « un Coup critique sur un point faible ne triple pas les dégâts » est lu comme un
  doublement seulement quand les deux se cumulent. ⚠️ hypothèse
- **Perforant sur un Coup critique** : le +2, « non doublé », s'ajoute après le doublement et avant l'Armure.
  ⚠️ hypothèse
- **Action magique** : sans localisation (p. 80), donc sans Armure du survivant. Le test est la Résistance magique ; quand le
  texte de l'action en nomme un autre (Endurance, Esquive), on le choisit à la main. ⚠️ hypothèse
- **Réactions** : le malus de −20 par défense déjà faite dans le round vaut aussi pour le test d'une action magique, et se
  remet à 0 au round suivant.
- **Meute** : seules les créatures en vie de même fiche comptent.
- **Surprise ratée** : la Perception de l'Initiative qui suit prend −20 (p. 76) ; on le saisit à la main dans le bonus du test.
- **Actions des fiches** : un dégât « sur une touche » s'applique à la touche ; sur un test, à l'échec du test, sauf quand le
  texte dit que les dégâts sont dus et que le test ne vise que l'effet annexe (`always`).
- **Test de Corps** : le livre dit « Athletics/Body checks » (p. 88) et oppose l'Athlétisme du PJ au Corps de la créature ; un
  test de Corps demandé à un survivant est donc son Athlétisme.
- **Durées en rounds** : un effet de N rounds compte le round en cours ; ses dégâts de début de tour tombent à chaque
  changement de round, sans tenir compte de l'ordre de l'Initiative. Reposer un effet qui « se cumule » en remplace la durée.
  « Jusqu'à la fin de son prochain tour » se lit comme deux rounds, « jusqu'au début de son prochain tour » comme jusqu'à
  ce que la créature tire son action. Une aura n'est testée qu'à sa pose : un survivant qui la rate subit ses dégâts de début
  de tour pendant sa durée, sans nouveau test.
- **Bonus offensifs d'un effet qui finit au début du prochain tour** : ils n'ont pas le temps de servir (l'effet tombe avant
  l'attaque) ; ces bonus restent du texte.
- **Créatures invoquées sans fiche complète** : le livre ne donne ni type, ni localisation, ni Esprit, Endurance, Corps, Résistance
  magique pour les serviteurs d'un Overseer ni pour les doubles d'un autre ; ces champs valent 0 ou sont absents, sans effet puisque
  les premiers disparaissent après leur attaque et les seconds tombent au premier coup (Santé 1). La Compétence de combat des
  doubles est lue comme celle de l'Overseer qui les invoque, avec son palier de niveau 10 (+10) : hypothèse, le livre ne la donne pas.
- **Inventaire** : les objets rangés à la Ceinture ne comptent pas dans les emplacements de sac (le livre ne le dit pas) ; les objets
  légers se rangent par dix tous types confondus, provisions et amulettes non portées comprises ; les pièces et les gemmes se comptent
  ensemble par centaine ; le Sac à dos et les Pochettes portés n'occupent pas un des 10 emplacements du corps (le livre les
  compte à part dans sa liste). ⚠️ hypothèses
- **Équipement** : l'Intégrité d'une pièce se joue après un combat quand elle a encaissé un coup ou paré, pas à chaque coup ; la
  parade au bouclier est possible avec toute arme tenue ; une arme Polyvalente a son bonus dès que la main secondaire est libre.
  ⚠️ hypothèses
- **Sbires de Maîtrise** : le livre veut que les adversaires visent les PJ avant les sbires, et laisse la répartition au début du
  combat ; l'outil laisse le joueur choisir la cible de chaque action. Les bonus d'une Maîtrise sur ses sbires (dégâts, Santé)
  se saisissent à la main. Un sbire ne subit pas les règles de Santé mentale (p. 92-93), qu'il n'a pas.
- **Objets magiques** : la table D20 des types de dégâts est brouillée dans l'extraction du livre ; les plages ont été appariées aux
  noms dans l'ordre vertical (1 Acide, 2-3 Arcanique, 4-5 Contondants, 6 Froid, 7-8 Force, 9 Feu, 10 Sacrés, 11 Infernaux, 12 Foudre,
  13-14 Nécrotiques, 15-16 Perforants, 17 Poison, 18 Psychiques, 19-20 Tranchants), puis **confirmées par le PM** sur le livre.
  La réduction de dégâts se retranche après l'Armure, avant la Résistance (le livre ne les ordonne pas).
  Un objet « tant qu'on le porte » agit porté ou tenu. La table du butin des contenants (D20, p. 220) est brouillée de la même
  façon : ses 18 lignes sont appariées aux plages dans l'ordre (1-2 nourriture avariée … 11 Journal vierge, 12 Pierre de Borestia,
  13 Cœur d'Amal-Tul, 14 Masse de l'Oblitération, 15 Anneau de Paix mentale, 16-20 les cinq Fioles) ; **à contrôler dans le PDF**.
  ⚠️ hypothèses
- **Progression** : le livre dit « accumuler un total de 1 000 XP » sans dire si l'XP repart de zéro à chaque niveau ; l'outil retire
  1 000 XP et garde l'excédent. Le choix « une compétence » ne vise pas les compétences ajoutées à la main. ⚠️ hypothèses
- **Potions et fragments** : « pendant D10 salles » compte la salle où l'on boit jusqu'à son entrée suivante, puis les D10 salles
  suivantes ; seules les salles (pas les couloirs ni les retours) font passer la durée. Le vieillissement « moitié » et « double »
  s'arrondit au supérieur, les durées aussi, d'une salle ou d'un round au moins : règle de l'encart « Rounding Numbers » (p. 70, fourni par
  le PM : tout nombre à arrondir, ⅃/2 compris, s'arrondit au supérieur ; le camp, qui dit « rounding down », est l'exception explicite).
  La revente à 50 % suit la même règle. Une potion se vieillit une fois, à l'identification (test de Médecine, ou gorgée), pas à chaque emploi. ⚠️ hypothèses
