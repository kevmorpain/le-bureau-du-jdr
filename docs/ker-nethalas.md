# Module Ker Nethalas

> **Statut** : tranches 0 à 3 fusionnées (PR #253 à #257, 2026-10-06 et 2026-10-07) ; issue #242 (X10) fermée. Suite : contenu du livre rédigé hors du dépôt (X11 à X16, U13). Tranche 4 en cours sur `feat/ker-nethalas-tranche-4` : 4a (chargement du contenu privé, X11), 4b (création du survivant, X12) 4c (Maîtrises, pilote de deux, X13) et les objectifs personnels (KN31) écrites, non fusionnées ; une seule PR à la fin de la tranche 4. **Issues** : [#258 — X11](https://github.com/kevmorpain/le-bureau-du-jdr/issues/258), [#259 — X12](https://github.com/kevmorpain/le-bureau-du-jdr/issues/259), [#260 — X13](https://github.com/kevmorpain/le-bureau-du-jdr/issues/260).
> **Dernière mise à jour** : 2026-10-10.

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

- **Livré** : tranches 0 à 3 (fiche, fiche effective, suivi de run, repos et provisions, aide au jet).
- **Ensuite** : toute la mécanique « aléatoire » du livre, rédigée en français hors du dépôt (KN27) : création du
  survivant et Maîtrises, boucle d'exploration (pièces, couloirs, événements, fouille, pièges, Overseer), rencontres et
  bestiaire, inventaire, équipement et butin (voir le plan).
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

### KN19 — Tranche 2 coupée en 2a (run) et 2b (repos)
Pour garder des PR relisibles et fusionner entre deux : 2a porte le suivi de run, 2b le repos et les provisions.

### KN20 — État du run dans une colonne JSON `run`, Domaines en liste
- **Décision** : `kn_characters.run` (migration `0134`) : liste de Domaines et Domaine courant, lumière restante, Dé de
  Tension. Chaque Domaine porte son nom, ses salles, ses dés de Lair et de Sortie, ses influences d'Overseer et ses
  événements de l'Obscurité Grandissante, qui « restent en jeu pour ce Domaine » (p. 120). `status.domain` disparaît ;
  la migration convertit les survivants existants (c'était l'étape annoncée en KN12).
- **Alternative écartée** : une table `kn_domains`. Quelques entrées par survivant ne justifient ni routes ni
  jointures, alors que tout le reste se sauvegarde en un seul PUT.

### KN21 — Règles des dés d'usage : fonctions pures
La chaîne D20, D12, D10, D8, D6, D4 (p. 74) : un jet de 1 ou 2 fait descendre d'un cran, et un 1-2 au D4 déclenche.
Tension (p. 120) : départ D8, déclenchement = tirage dans la table de l'Obscurité Grandissante puis retour à D8.
Lair (p. 98) : D10, à chaque nouvelle salle posée, jusqu'à trouver le Lair. Sortie : D8, à chaque nouvelle salle une
fois le Lair trouvé. Revisiter une salle ne fait que le Dé de Tension et la lumière, sans rencontre ni événement
(p. 99).

### KN22 — Sources de lumière et Éther rattachés au moteur
Entrer dans une salle retire 1 de lumière (2 avec l'événement 69-70) et recharge l'Éther au maximum effectif (p. 18).
Sans lumière restante, le survivant est Aveuglé et doit réussir un test de Résolution par salle, sinon perdre 1 de
Santé mentale (p. 96) ; à partir du stade 3 de la Pourriture il n'a plus besoin de lumière (p. 87).

### KN23 — Interface du run : actions guidées, dés lancés ou saisis
- **Décision** : trois actions (nouvelle salle, nouveau couloir, retour dans une zone explorée) appliquent la lumière et
  l'Éther, puis ouvrent une entrée où l'on fait ce qu'il reste à faire : Dé de Tension, Dé de Lair ou de Sortie,
  rencontre de combat (D20 : 10 ou plus dans une salle, 15 ou plus dans un couloir, pas dans le Lair), table des
  Événements si pas de rencontre (p. 98-99). Chaque dé se lance dans l'outil, ou se saisit avec « 1-2 » / « 3+ » pour
  un dé lancé à la table : ces deux cas sont les seuls que la chaîne distingue. Un déclenchement du Dé de Tension
  propose le tirage dans la table de l'Obscurité Grandissante ; le tirage d'un 81-100 ajoute l'influence d'Overseer.
- **Laissé de côté** : la table des Événements et celle des Rencontres ne sont pas tirées par l'outil ; l'éditeur
  d'influences et d'événements du Domaine reste la saisie manuelle de ce qu'on tire à la table.

### KN24 — Chemin du Domaine enregistré, une entrée par salle ou couloir
- **Décision** : chaque Domaine garde la liste de ses entrées (`visits`) : type (salle, couloir, retour), dé de Tension,
  dé de Lair ou de Sortie attendu et lancé (dé avant, jet, dé après, déclenchement ou « trouvé »), événement de
  l'Obscurité Grandissante tiré. La dernière entrée est celle en cours, et porte les boutons ; les autres forment le
  chemin et s'affichent du plus récent au plus ancien, avec le dé comme il était au moment du jet. Ce qui reste à faire
  se déduit des données : un rechargement ne perd ni le chemin ni l'entrée en cours.
- **Pourquoi** : une version précédente gardait un journal de texte éphémère et excluait de « tenir le carnet de la
  partie » ; le PM veut retracer le chemin, et le dé affiché dans la liste après son jet trompait (le D6 d'un dé tombé de
  D8).
- **Alternative écartée** : garder les blocs en mémoire. Plus simple, mais le chemin disparaît au rechargement.
- **Limites** : 200 entrées par Domaine (les plus anciennes sont retirées au-delà) ; ni contenu des salles (monstres,
  butin) ni réordonnancement. « Annuler cette entrée » retire la dernière entrée et rend le compte de salles, mais ni la
  lumière, ni l'Éther, ni l'état des dés, ni l'événement tiré : ceux-là se corrigent à la main.
- **Migration** : le champ est dans la migration `0134` elle-même (pas encore fusionnée à l'époque), pas dans une
  `0135`.

### KN25 — Repos : Reprendre son souffle et Établir le camp en fonctions pures, provisions en colonne JSON
- **Décision** : `shared/ker-nethalas/camp.ts`, sans accès à la base ni au hasard imposé (tirage injectable).
  *Reprendre son souffle* (p. 123) : D10+2 de Robustesse, 1 de Santé (jamais au-dessus des maximums effectifs), −2
  d'Épuisement, −5 de lumière, Dé de Tension d'un cran vers le bas. *Établir le camp* (p. 123-125) : activités avec leur
  coût en Épuisement, leur modificateur du test de Camp et leurs consommations (Barricader, Cuisiner, Fabriquer, Soigner
  une Condition, Réparer, Harmoniser, Dormir) ; test de Camp D20 + modificateur, 12 ou plus ; bénéfices : toute la
  Robustesse, 1 Santé, D4 Santé mentale, −10 Épuisement, plus D4 Santé à la Pourriture 5 ; 1 Ration consommée. Test raté ou
  aucune Ration : bénéfices réduits de moitié, arrondis à l'inférieur. Rien n'est appliqué si une provision manque ou si
  Dormir est combiné à autre chose que Barricader.
- **Provisions** : colonne JSON `kn_characters.provisions` (migration `0135`), huit compteurs : Rations, Bandages,
  Fournitures d'Artisanat, Denrées, Huile de lampe, Crochets, Torches, Cristaux d'Harmonisation. Les activités les
  décomptent et les produisent ; le survivant peut aussi les corriger à la main.
- **Alternative écartée** : ranger les provisions dans `run`. Elles appartiennent au survivant, pas à l'exploration en
  cours ; un nouveau run ne les remet pas à zéro. Un inventaire détaillé (objets un par un) reste l'étape « équipement »
  prévue plus tard.
- **Données déduites du Domaine courant** : un événement « mains tremblantes » retire 1 au test de Camp par exemplaire ;
  « concentration impossible » interdit l'Harmonisation.
- **Laissé de côté** : historique des camps ; tirage dans la table des Rencontres sur un test raté (rappelé seulement) ;
  aptitudes et objets qui touchent au camp (bonus ou malus au test de Camp, soins supplémentaires) : le modificateur
  libre du panneau couvre le test, le reste se corrige à la main ; l'aptitude qui fait partir le Dé de Tension à D10
  (le sélecteur de dé la corrige à la main) ; les changements d'amulettes de Maîtrise, qui ne coûtent rien.

### KN26 — Aide au jet : D100 lu sur le score effectif, critiques et maladresses affichés
- **Décision** : `shared/ker-nethalas/roll.ts`, pur. Un test se fait sur le **score effectif** de la fiche, plus le
  modificateur de difficulté (Enfantin +30 à Impossible −30, ou tiré au D8), sans descendre sous 0 (p. 69). Le D100 se
  lit en deux chiffres : l'Avantage met le plus petit chiffre en dizaines, le Désavantage le plus grand (p. 70). Réussi
  si le dé lu est inférieur ou égal à la cible ; un double sous la cible est une réussite critique, au-dessus un échec
  critique (p. 71). Le dé se lance dans l'outil ou se saisit.
- **Effets** : les douze effets de critique (neuf compétences hors armes, trois résistances, p. 71-73) sont rédigés ici
  et affichés avec le résultat. Pour une compétence d'arme, un échec critique tire une Maladresse au D10 (p. 84) et une
  réussite critique rappelle le Coup critique ; la table des Maladresses des adversaires n'est pas reprise.
- **Application à la fiche** : les effets *chiffrés* (Épuisement, Santé, Santé mentale, Robustesse, dégâts, dé de Lair
  ou de Sortie) sont tirés avec le résultat, listés avec leurs dés, puis appliqués d'un clic sur « Appliquer à la
  fiche » : jamais en silence, une seule fois par jet. Les gains s'arrêtent aux maximums effectifs, les pertes à 0,
  l'Épuisement à son plafond. Les dégâts se retirent à la Robustesse d'abord, puis à la Santé, sans compter d'armure ;
  une Santé tombée à 0 est signalée. Les effets *temporaires* (Avantage ou bonus à la prochaine action, Résistance
  magique pendant D4 rounds) restent du texte à reporter ; les Maladresses d'arme aussi.
- **Interface** : une carte « Jet de dés » (test, difficulté, lecture, jet, derniers jets non conservés) et un bouton
  « Jet » sur chaque ligne de compétence ou de résistance, qui la présélectionne. Aucune donnée n'est enregistrée : pas
  de migration.
- **Référence des conditions** : la liste des seize conditions et de l'hypothermie, avec leur effet (le texte déjà
  rédigé pour les rappels), les conditions subies étant signalées.
- **Alternative écartée** : une fenêtre modale par ligne. Elle masque les scores effectifs qu'on regarde pour choisir le
  test ; la carte reste sous les yeux.
- **Laissé de côté** : les tests opposés (comparaison avec un adversaire), la résolution d'un combat (touche, défense,
  localisation, dégâts), l'application des effets temporaires de critique et des Maladresses, l'Initiative, la table de
  Maladresses des adversaires.

### KN27 — Contenu du livre rédigé hors du dépôt, chargé en base
- **Décision** : tout ce qui est rédigé à partir du livre (Maîtrises, bestiaire, objets, tables d'événements,
  descriptions de salles et de couloirs…) vit dans des **fichiers JSON privés, hors du dépôt public**, et se charge dans la
  table `kn_content` (nom du jeu de données, JSON, date ; migration `0136`). Les moteurs, les mécaniques et les catalogues
  déjà dans le dépôt (conditions, Obscurité Grandissante, Folie, jet…) restent publics.
- **Pourquoi** : le dépôt est public et l'accord de l'éditeur est donné pour un usage personnel ; la portée pour un
  dépôt public n'est pas établie (voir « Accord de l'éditeur »).
- **Registre** : `KN_CONTENT_SCHEMAS` (`shared/ker-nethalas/content.ts`) associe chaque nom de jeu de données à son schéma
  Zod. Il est vide tant qu'aucune tranche n'apporte de contenu ; chaque tranche y ajoute le sien. Un nom absent du
  registre, ou qui n'a pas la forme `[a-z][a-zA-Z0-9]{0,39}`, est refusé. Un jeu de données ne dépasse pas 1,5 Mo (une
  ligne D1 accepte 2 Mo).
- **Chargement** : `SEED_SECRET=… npm run kn:content -- <dossier> <url de base>` envoie chaque `<nom>.json` du dossier à
  `PUT /api/admin/ker-nethalas/content/<nom>`, protégé par le secret du seed (`x-seed-secret`). Les données sont validées
  contre le schéma du registre ; une donnée invalide est refusée avec le chemin de chaque erreur (20 au plus) et **n'écrase
  pas** l'existant. `GET /api/admin/ker-nethalas/content` (même secret) indique, pour chaque jeu de données, s'il est
  absent, chargé, ou chargé mais invalide.
- **Lecture** : `GET /api/ker-nethalas/content/<nom>`, sous la session exigée par le middleware du module ; le contenu est
  le même pour tous les comptes. Un jeu de données absent, ou que le schéma refuse désormais, répond 404 : l'application
  doit fonctionner sans contenu.
- **Procédure** : les fichiers vivent hors du dépôt (par exemple `~/ker-nethalas-content/`, que le PM peut sauvegarder
  dans un dépôt privé) ; le dossier `/ker-nethalas-content/` est ignoré par git au cas où on le placerait dans le
  dépôt. En local : `npm run dev`, puis la commande ci-dessus vers `http://localhost:3000`. En production : après chaque
  déploiement qui change un schéma, même commande vers l'URL du Worker.
- **Tests** : le contenu du livre n'entre jamais dans les tests ni dans la CI : ils utilisent de fausses tables.
- **Alternatives écartées** : (a) les tables dans `shared/ker-nethalas/catalog/` comme les catalogues actuels : simple,
  mais publié ; (b) un dépôt privé : touche tout le reste du projet ; (c) un objet R2 plutôt qu'une ligne D1 : plus de
  place, mais un second mécanisme à tester, et inutile tant que chaque jeu de données tient en 1,5 Mo.
- **Laissé de côté** : un composable de lecture, ajouté avec le premier consommateur (tranche 4c) ; la découpe d'un
  jeu de données trop gros en plusieurs lignes.

### KN28 — Un seul enregistrement par survivant : fiche et partie ne sont pas séparées
- **Décision** : `kn_characters` garde ensemble le survivant (identité, Maîtrises, scores de base) et la partie en cours
  (jauges courantes, Épuisement, conditions, Domaines, provisions…). Dans le livre, un survivant correspond à une
  descente : le personnage est étroitement lié à la partie, séparer les données n'apporterait pas grand-chose.
- **Alternative écartée** : deux tables (`kn_survivors`, `kn_runs`), qui auraient permis plusieurs parties par survivant et
  un historique, au prix d'une migration des données, des routes, du contrôle d'accès et de la sauvegarde automatique.
- **À la place** : une séparation **visuelle** de la fiche en deux colonnes (le survivant, la partie), suivie par l'issue
  U13.

### KN29 — Création du survivant : le serveur reçoit des choix, il construit la fiche
- **Décision** : `POST /api/ker-nethalas/characters` n'accepte plus un simple nom. Il reçoit les **choix** du joueur
  (`knCreationSchema`, `shared/ker-nethalas/creation.ts`) : nom, apparence, jauges tirées, enveloppes de compétences,
  Résistance à 40, objectifs, et un kit de départ (ou `null`). Le serveur les **valide** puis **construit** la fiche
  (`knBuildCreatedSheet`) : le client n'envoie jamais de scores. Le même schéma sert à l'assistant, qui montre à chaque
  étape ce que le serveur refuserait.
- **Règles encodées** (chapitre « Create Your Survivor ») : Santé D6+10, Robustesse 3D6+20, Éther D6+8, Santé mentale D6+10,
  jauges pleines, Épuisement 0 ; scores de départ imprimés sur la fiche, plus +60 et +40 à deux compétences d'arme
  différentes, +30 à trois compétences, +20 à deux, +10 à trois, une seule enveloppe par compétence ; une Résistance à 40
  et les deux autres à 20 ; équipement des parties suivantes : une arme au choix, une armure tirée sur la table du livre,
  1 Torche, D10 Denrées, D10+5 Fournitures d'Artisanat et D20 pièces.
- **Interface** : `/ker-nethalas/new`, assistant en étapes sur le même cadre que ceux de D&D (`WizardShell`), puis, après
  « Terminer » sur la dernière étape, un **écran de récapitulatif** (« ← Modifier » pour revenir, « Créer le survivant »
  pour valider) comme le créateur D&D ; les dés se lancent dans l'outil ou se saisissent ; un aperçu suit les choix.
  L'ancienne création par le seul nom disparaît. Les enveloppes de compétences se posent par des boutons par ligne :
  +60 et +40 ne sont proposés qu'aux compétences d'arme, et une enveloppe dont tous les exemplaires sont pris est grisée
  (sauf sur la compétence qui la porte, pour la reprendre).
- **Nouveaux champs** (migration `0137`) : `appearance` (genre, âge, apparence, aussi modifiable sur la fiche) et `coins`
  (pièces, avec les provisions de l'équipement).
- **Alternatives écartées** : (a) garder la création par le nom et remplir la fiche à la main, sans aucune validation des
  règles de départ ; (b) faire envoyer la fiche complète par le client : le serveur devrait alors deviner si les scores
  respectent les enveloppes.
- **Laissé de côté** : le choix des Maîtrises (tranche 4c) ; le tirage du crime reproché, la liste des objectifs
  personnels et la table d'armures aléatoires, qui sont du contenu du livre et viendront avec le contenu privé (KN27) :
  d'ici là, champs libres.

### KN30 — Maîtrises : format public, contenu privé, paliers débloqués par points
- **Décision** : le **format** d'une Maîtrise est public (`shared/ker-nethalas/masteries.ts`, schéma Zod enregistré sous
  le nom `masteries` dans le registre de KN27) ; son **contenu** (nom, résumé, trait, cinq aptitudes, six lieux
  d'entraînement) est rédigé en français dans `~/ker-nethalas-content/masteries.json`, hors du dépôt, et chargé par
  `npm run kn:content`. Une aptitude porte son nom, son action, son coût (affiché, et en Éther quand il est chiffré), si
  elle est magique ou maintenue, et son effet.
- **État du survivant** : `kn_characters.mastery_picks` (migration `0138`), une liste de `{ clé, paliers débloqués }`, deux
  Maîtrises au plus. Les **points d'Aptitude à dépenser** ne sont pas stockés, ils se déduisent : niveau + 1 (deux au
  niveau 1, un de plus à chaque niveau) moins les paliers débloqués. Les paliers se débloquent dans l'ordre, du 1 au 5 ;
  la première aptitude d'une Maîtrise en montre aussi le trait. « Reprendre un palier » corrige une erreur.
- **Création** : une étape « Maîtrises » (deux différentes, une aptitude chacune) qui montre, pour chaque Maîtrise, le
  trait et **l'effet de tous les paliers**, et un tirage optionnel du lieu d'entraînement (D6) par Maîtrise choisie. Le
  résultat s'affiche à l'étape, un nouveau tirage le remplace, et il est gardé dans un champ à part, `training`
  (« Entraînement », migration `0139`), sans toucher à l'apparence. Le serveur compare le choix au contenu chargé : deux
  Maîtrises connues et différentes si le contenu est chargé, aucune sinon (elles se choisissent alors sur la fiche).
- **Fiche** : une section « Maîtrises » qui montre les aptitudes, celles des paliers à venir restant lisibles mais grisées,
  et propose de choisir une Maîtrise quand il en manque (survivants créés avant le contenu compris) ; le champ
  « Entraînement » est sous l'identité.
- **Alternatives écartées** : (a) garder « Maîtrises » en texte libre, qui ne contrôle ni le nombre de points ni l'ordre
  des paliers ; (b) stocker les points non dépensés, qui divergeraient du niveau.
- **Laissé de côté** : l'**amulette** (KN32), le **choix d'avantage à la montée de niveau**, et l'application automatique
  des effets chiffrés des aptitudes (KN33) : les aptitudes étaient affichées, pas appliquées. Les 18 autres Maîtrises (le
  livre en compte 20, pas 21) sont rédigées en tranche 4d.
- **Procédure de rédaction** : les noms d'aptitudes et de traits sont en petites capitales dans le livre, que
  l'extraction de texte perd ; les pages se rendent en image (PyMuPDF, installé hors du dépôt dans `~/tools/pymupdf`) et se
  relisent à l'écran. Les valeurs viennent du livre anglais, le vocabulaire de la VF, dont les chiffres diffèrent
  (le palier 3 du Faucheur abyssal n'y coûte pas la même Santé mentale que dans Gravebound).

### KN40 — Inventaire : emplacements, capacité et encombrement
- **Règles sourcées** (livre v1.2) : p. 206 (10 emplacements sur le corps, 9 avec une arme à deux mains ; 10 emplacements de sac ;
  objets sans encombrement, normaux, lourds, légers par dix, pièces et gemmes par centaine ; Sac à dos +20 et un seul, Pochette
  +5 et trois au plus ; une armure d'un torse, de vambraces et de jambières n'occupe qu'un emplacement), p. 212 (la Ceinture a
  4 emplacements rapides, le test de Ceinture D4 détruit l'objet de la case tirée).
- **Modèle** (`shared/ker-nethalas/inventory.ts`, colonne JSON `inventory`, migration 0143) : chaque objet est un exemplaire
  qui porte ses propres caractéristiques (type, encombrement, quantité, endroit, case de Ceinture, et, pour les armes et
  armures, ce qui servira au combat). Il vient du catalogue privé ou se saisit à la main. Les champs texte « Armes » et
  « Équipement » restent des notes, sans migration de leur contenu.
- **Capacité** : 10 emplacements de sac, +20 avec un Sac à dos porté, +5 par Pochette portée ; sans l'objet, rien. Les emplacements
  rapides n'existent qu'avec une Ceinture portée : la retirer renvoie ses objets au sac. Le départ du livre n'a ni sac, ni Ceinture.
- **Placer un objet** : un endroit unique déjà pris renvoie son objet au sac ; une arme à deux mains libère l'autre main ; deux
  anneaux et trois pochettes au plus ; un objet porté est unique. La validité d'un inventaire enregistré est contrôlée par le schéma.
- **Interface** : la section Équipement a un panneau Inventaire (capacité, Ceinture, corps, provisions, ajout, quantité, endroit).
  Un endroit où l'objet ne peut pas aller (emplacement rapide sans Ceinture, anneaux ou pochettes au complet…) est grisé avec sa
  raison. Un dépassement de capacité est signalé, jamais bloqué.
- **Provisions** : elles restent le compteur de la fiche (le camp et l'exploration les consomment), mais s'éditent dans le panneau
  Inventaire, avec les autres objets ; la section Repos n'en garde qu'un rappel.
- **Catalogue** (jeu de données privé `items`, schéma public dans `items.ts`) : les 30 armes, 4 boucliers, 3 casques, 9 armures de
  torse, vambraces et jambières, et l'équipement courant du livre (p. 207-212), avec leur prix, encombrement, statistiques,
  Intégrité maximale et description. Un objet « provision » (Torche, Ration, Crochet, Cristal d'harmonisation…) s'ajoute aux provisions
  et non à l'inventaire. Ajouter un objet du catalogue en recopie les statistiques dans un exemplaire ; une armure ou un bouclier
  « trouvé » a une Intégrité d'un cran sous son maximum (p. 83).
- **Laissé de côté** (tranche 7, étapes suivantes) : les armes et armures dans le combat, l'Intégrité, le butin, les potions, le
  marchand, les objets magiques.

### KN41 — L'équipement dans le combat
- **Règles sourcées** (livre v1.2) : p. 207 (Traits des armes), p. 210-211 (armures par zone, malus d'agilité et de Perception, parade
  des boucliers), p. 83 (Intégrité : un jet après un combat où l'armure a servi, 1-2 la fait baisser d'un cran, au D4 elle est perdue ;
  la réparer la remonte d'un cran ; trouvée, elle part un cran sous son maximum), p. 125 (activité de camp Réparer).
- **Armure par zone** (`equipment.ts`) : la tête vient du casque porté, le torse de l'armure de torse, les bras des vambraces, les
  jambes des jambières ; la saisie manuelle est supprimée (`status.armor` n'existe plus). Le malus d'agilité (Acrobatie, Esquive,
  Furtivité) et celui de Perception du casque sont une source de la fiche effective.
- **Attaquer** : la carte d'attaque propose chaque arme tenue (ou les mains nues, D4) et règle la compétence, la Vitesse, la
  réserve et le type de dégâts. Réserve : D6, Puissante +1, À deux mains +2, Polyvalente +1 quand l'autre main est libre ; Simple
  ajoute +10 à l'attaque, Rapide +10 à l'Initiative.
- **Se défendre** : l'Esquive, ou une parade à l'arme quand elle a le Trait Parade ou qu'un bouclier est porté ; le bouclier ajoute
  son bonus de parade, et +10 pour une arme Défensive. Un adversaire Sauvage ne se pare pas.
- **Intégrité** : les pièces qui ont encaissé un coup (l'armure de la zone touchée) ou paré (le bouclier) sont retenues pendant le
  combat ; leur dé se joue quand le combat prend fin (victoire ou non), et la fiche de l'objet offre le jet à la main (acide) et la
  réparation. Une pièce perdue sort de l'inventaire.
- **Kit de départ** (création, p. 67) : quand le catalogue du livre est chargé, l'arme choisie et la pièce d'armure tirée sur la
  table des armures aléatoires (on relance tant que le résultat est une armure magique) entrent dans l'inventaire, neuves,
  portées (arme en main, pièce sur le corps) ; `creation.kit.items` les porte, et leur texte libre n'est alors pas repris.
  Sans catalogue, la saisie reste un texte.
- **Laissé de côté** : la réparation au camp ne choisit pas les pièces (l'activité décompte les Fournitures, le bouton « Réparer » remonte la
  pièce) ; le corps à corps à deux armes.

### KN42 — Butin et marchand
- **Règles sourcées** (livre v1.2) : p. 213 (tables de Butin). Revente : la moitié du prix, sauf les gemmes et bijoux à leur valeur
  entière (vérifié par le PM auprès de la communauté, pas dans une page du livre).
- **Tables** (`loot.ts`, jeu de données privé `loot`) : un objet de tables, chacune avec son dé (D6, D100, D20, D10), des plages
  qui couvrent le dé sans trou, et pour chaque résultat ce qu'il donne (`table`, `item`, `gem`, `fragment`, `potion`, `magic`,
  `relic`, `mastery`, `nothing`). Une table absente du jeu de données se signale (`missing`) au lieu d'inventer un résultat.
- **Tirage** : `knRollLoot` suit la chaîne des tables (six rebonds au plus) ; une quantité en dés vaut au moins 1 ; une gemme
  tire sa valeur. Une créature du bestiaire peut porter `loot` (jusqu'à trois tables de départ) ; la carte « Butin » les tire.
- **Ajouter** (`knApplyLoot`) : un objet du catalogue arrive « trouvé » (Intégrité d'un cran en moins), une provision va aux
  provisions, une gemme devient un objet de valeur tirée rangé par centaine, un fragment ou une potion garde sa table et son jet
  (KN43), un objet magique arrive « à identifier ».
  Rien ne s'ajoute sans le bouton, et un inventaire plein refuse.
- **Livres de savoir** (p. 216-219) : un « Livre de savoir » trouvé tire le D10 des dix livres (table `loreBooks` du jeu `loot`) et
  prend son titre ; le résumé français du texte du livre est en note de l'objet. Trouver un livre rapporte **10 XP** (p. 63, avec les
  autres sources d'expérience) : ils s'ajoutent à l'ajout du butin, pour chaque livre effectivement rangé. L'objectif personnel
  « Vaelorian Erudite » (10 livres) se suit à la main.
- **Marchand** (`trade.ts`) : acheter retire les pièces et ajoute l'objet ou la provision ; vendre rend les pièces (50 % arrondi au
  supérieur, gemmes à 100 %). Seuls les objets du sac et les provisions que le catalogue connaît se vendent ; les amulettes non.
- **Laissé de côté** (étapes suivantes de la tranche 7) : la génération des objets magiques et des Reliques. Les fragments et les
  potions : KN43.

### KN43 — Fragments et potions utilisables
- **Règles sourcées** (livre v1.2) : p. 214-215 (Fragments : un seul emploi, sans s'accorder), p. 126 (Potions : test de Médecine pour
  connaître les effets, sinon les essayer ; une fois identifiée, tirage de vieillissement), p. 221 (table des Potions).
- **Données** : les tables `fragments` et `potions` sont des tables de butin ordinaires (jeu `loot`) dont chaque résultat porte
  `use` : des effets (`KnTableEffect`) que la fiche applique, et au besoin un jet que l'objet demande sans l'appliquer (dégâts sur
  des cibles, Blessures soignées au fil des rounds). Le jeu `potionAging` (D20) donne le texte du vieillissement ; ses effets sont
  en code (`consumables.ts`) : tournée au poison, explosion (2D4 de force), éventée, affaiblie (moitié), normale, raffinée
  (double, +50 % de durée), parfaite (sans fin).
- **L'objet ne recopie pas ses effets** : il garde la table et le jet (`item.consumable`), et relit ses effets dans le contenu à
  l'emploi. Une correction du contenu s'applique donc aux objets déjà trouvés ; sans le contenu chargé, les boutons sont grisés.
- **Nouveaux effets de table** : soigner des Blessures (Robustesse avant Santé), retirer un état, et une durée en salles
  (`timed.rooms`, décomptée à l'entrée d'une salle, `status.custom[].rooms`). Un effet sans durée ni combat reste jusqu'à ce qu'on
  le retire (potion parfaite).
- **Interface** : une potion trouvée se range « non identifiée » (ni nom, ni ligne de table visibles, y compris sur la carte
  Butin) ; « Identifier (Médecine) » ouvre le test en ligne, « Boire » identifie d'office et applique. Un fragment s'emploie
  d'un clic. Le texte de l'objet s'affiche à chaque emploi, pour ce que les effets chiffrés ne couvrent pas.
- **Laissé de côté** : les bonus
  ponctuels (« prochain test d'Athlétisme +50 », « +D4 de feu à la Réserve ») et les actions (Action Standard gratuite) restent
  du texte ; la Pierre de Borestia (identification sans test) vient avec les objets magiques ; deux potions de Vitalité bues de
  suite ne déclenchent pas les dégâts d'acide.

### KN44 — Objets magiques : génération, harmonisation, effets
- **Règles sourcées** (livre v1.2) : p. 224 (procédure : type D8, rareté D10, une propriété par niveau, deux fois la même s'ajoutent ;
  une amulette donne accès à une Maîtrise au lieu de propriétés), p. 225 (types de dégâts D20, types d'adversaire D8), p. 226-231
  (propriétés par type d'objet, D20), p. 232-233 (peculiarités D100), p. 124-125 (activité de camp Harmoniser : 1 Cristal et
  +1 Épuisement par objet), p. 83 (réduction de dégâts : « après l'Armure »).
- **Un objet trouvé n'est que son type** : le D8 se tire à l'obtention (carte Butin) ; une arme ou une armure prend pour base un
  objet ordinaire de la table aléatoire, relancé tant qu'elle redonne un objet magique ; une amulette est une Maîtrise tirée au D20.
  Il se comporte comme son équivalent ordinaire (`item.magic.identified: false`) jusqu'à l'harmonisation.
- **Harmoniser** (activité de camp) : on coche les objets à harmoniser, ce qui fixe le nombre d'Harmonisations du camp ; à la
  fin du camp, la rareté et les propriétés se tirent (`knIdentifyMagic`) et se **figent sur l'objet** avec leur texte résolu (montant
  selon la rareté ou aux dés, type de dégâts ou d'adversaire tiré). La peculiarité (D100, un résultat peut en demander deux) est
  facultative ; la compétence « au choix » se choisit ensuite sur l'objet.
- **Vocabulaire des mécaniques** (`magicSchema.ts`, le seul que le moteur connaisse) : modificateur de compétence ou de
  résistance, Avantage, jauge maximale, portage, Résistance / réduction / immunité du survivant, Initiative, dés et Vitesse
  d'arme, dégâts contre un type d'adversaire, Armure des vambraces et des jambières, source de lumière, usage limité (par combat,
  salle, repos, camp ou Domaine, avec ou sans soin). Une propriété sans mécanique est un **rappel** affiché dans la fiche tant que l'objet
  est porté. Le contenu (tables, textes) reste privé : jeu `magicItems`.
- **Ce qui agit** : un objet n'agit que **porté** ou tenu (pas dans le sac ni à la Ceinture). Les sources rejoignent la fiche
  effective (`knMagicSources`) ; le portage entre dans l'encombrement ; la lumière dispense de source de lumière ; l'Armure des
  vambraces et jambières, l'Initiative et la Vitesse, la réserve de dégâts de l'attaque (dés de l'arme maniée, plus ceux des gants)
  suivent. Les immunités s'appliquent aux états que les effets donneraient ; les Résistances et réductions s'appliquent aux
  dégâts que le survivant reçoit en combat (`damageTarget` du survivant).
- **Reliques** (p. 234-241) : un objet unique aux propriétés fixées (jeu `magicItems`, `relics` en D20 et `containerRelics` par clé),
  déjà harmonisé, avec le texte d'ambiance en note et, s'il reprend un objet du catalogue (bouclier, sabre, plaques, masse, lance), ses
  statistiques neuves. Mécaniques en plus : bonus de parade, identification des potions sans test (Pierre de Borestia, rien qu'à la
  posséder), et objet à consommer qui augmente à jamais une jauge ou une Résistance (bouton « Consommer »). Elles tombent au butin
  précieux (D20 puis D20 des Reliques) ou, par clé, dans la table du **butin des contenants** (D20, p. 220), à tirer après la
  fouille approfondie d'un contenant.
- **Revente** (p. 127) : un objet magique se vend à prix fixe, jamais à la moitié : Peu commun 200, Rare 400, Épique 600, Relique 1 000.
  Il ne se vend qu'une fois harmonisé (sa rareté n'est connue qu'alors) ; une amulette ne se vend pas.
- **Laissé de côté** : les propriétés qui demandent un état de combat que l'outil ne suit pas (Réaction gratuite, relance de test,
  bonus de Compétence « pour parer ») restent des rappels ; les dés de dégâts d'un type propre (+D4 de feu) entrent dans la réserve
  sans type séparé, rappelés sous l'attaque ; les Gantelets de l'Étreinte du vide n'ont pas de statistiques d'arme (le livre dit
  « arme de poing » sans en donner) ; la Santé que l'Anneau de la Servitude soumise ajoute aux Sbires (la moitié du niveau, p. 12 :
  le symbole ⅃ est le niveau) se saisit à la main, comme les autres bonus de Maîtrise sur les sbires ; les effets d'un Cœur d'Amal-Tul
  (200 XP) et de la Graine de Cœur-sombre (+1 Point d'Aptitude) se font à la main.

### KN45 — Progression : expérience, niveau, amélioration des compétences, Atouts
- **Règles sourcées** (livre v1.2) : p. 62-63 (Skill Improvement, Leveling Up, Perks), p. 70 (arrondi au supérieur, KN7).
- **Expérience** (`experience.ts`, issue X19) : toutes les valeurs de la p. 63 sont à un seul endroit (`KN_XP`) : combat vaincu 50,
  Overseer 200, verrou ouvert 10, piège désamorcé 10, nouveau Domaine 50, livre de savoir 10. Un verrou ouvert ou un piège désamorcé
  ne rapporte qu'au passage d'un état à l'autre de l'obstacle (`knObstacleXp`, pure, comparée avant et après l'action), donc jamais
  deux fois, même en cas de retour en arrière. Un piège contourné ne rapporte rien (le livre dit « désamorcer »). Seule l'action
  « Nouveau Domaine » compte : revenir dans un Domaine déjà exploré n'est pas entrer dans un nouveau.
- **Passage de niveau** (`progression.ts`, `levelUp.ts`, issue X20) : dès 1 000 XP, la section Identité propose « Monter de niveau ».
  Le niveau monte (le Point d'Aptitude de plus se déduit du niveau, KN30), 1 000 XP partent, et le joueur prend l'un des huit
  avantages de la p. 62 : Santé +D4, Robustesse +D6, Santé mentale +D4, Éther +D6 (le maximum et la valeur actuelle montent du dé
  tiré), +5 à une compétence, +5 en Endurance, Résolution et Résistance magique (plafond 80), +D6 dégâts physiques (Tranchants,
  Contondants ou Perforants, au choix) ajouté à la réserve de chaque attaque, +1 aux dégâts d'une Aptitude (rappel dans la fiche
  effective). Chaque choix s'ajoute à `levelBenefits` (colonne JSON, migration 0144), qui garde l'historique et porte les deux
  avantages de dégâts. Un D6 de dégâts physiques par avantage pris, du type choisi ; les mains nues en profitent aussi (toute
  attaque de l'outil est physique, hors Aptitude).
- **Amélioration de compétence** (`skillImprovement.ts`, issue X21) : sur des doubles à un test de compétence (pas de Résistance),
  le panneau de jet propose « Marquer pour amélioration » (la case de la section Compétences reste cochable à la main). À la fin du
  camp, chaque compétence marquée, ajoutée à la main comprise, passe son test : D100 au-dessus du score, +D4 ; sinon +1 ; plafond de
  80, un score déjà au-delà ne baisse jamais. La marque est retirée et le rapport du camp détaille chaque test. Le tirage est
  automatique, sans saisie manuelle du D100.
  ⚠️ hypothèses : le livre ne dit pas si la marque survit à un échec (elle est retirée dans tous les cas) ni si le « score » est
  le score de base (c'est lui qui est testé et augmenté, pas le score effectif).
- **Atouts** (`perks.ts`, issue X22) : les six Atouts du livre se cochent dans la section Notes (colonne JSON `perkKeys`, migration
  0145 ; le champ libre devient « Autres atouts »). Leur effet est appliqué là où il joue :
  l'Avantage en Raison est un effet de fiche comme les autres sources ; l'Avantage contre les pièges s'ajoute au test de Larcin
  « Désamorcer le piège » (`KnRollRequest.advantage`, combiné à la fiche : Avantage + Désavantage donne la lecture normale, comme
  ailleurs) ; la surprise assurée réussit sans test ; les dégâts d'un Coup critique du survivant (jamais d'un sbire) se relancent
  une fois avant d'être appliqués ; la Fouille ajustable ajoute ou retranche un D4 au tirage de Fouille, une fois, tant que rien
  n'en est pris (`knAdjustScavenge`, résultat borné à la table) ; les pièces des contenants ajoutent D20 pièces au butin d'un tirage
  qui passe par la table des contenants.
  Les libellés sont descriptifs : les noms du livre sont dans le contenu privé (récompenses d'objectifs) et ne se versionnent pas.
  « Ne peut pas être surpris » n'a pas de mécanique propre (l'outil ne tire pas la surprise des créatures) : rien à faire (confirmé par le PM).
- **Récompenses d'objectifs** (`goalEffects.ts`, `goalRewards.ts`, issue X23) : le format public d'un objectif gagne un champ
  `effect` optionnel (le contenu déjà écrit reste valide), renseigné dans le contenu privé. Neuf sortes : Atout, réduction de
  dégâts d'un type, bonus de dégâts d'une compétence d'arme, dé de dégâts ajouté à toute attaque, Coup critique triplé contre un
  type de créature, XP, amulette, dé de jauge maximale, et `note` pour ce que l'outil ne sait pas jouer (le texte de la
  récompense devient un rappel de la fiche : +1 aux dégâts d'un élément, Étourdissement de l'Overseer, vente à plein prix, second
  tirage d'Obscurité Grandissante). À la récupération :
  les effets durables sont copiés dans `goalEffects` (colonne JSON, migration 0146) pour que combat, butin et fiche les lisent sans
  recharger le contenu ; annuler la récupération les retire. Les gains ponctuels (XP, amulette, dé de jauge) ne se donnent qu'une
  fois : `granted` sur l'objectif retient qu'ils l'ont été, une annulation suivie d'une nouvelle récupération ne les redonne pas
  (⚠️ les objectifs déjà récupérés avant cette tranche n'ont pas ce drapeau). Les Atouts donnés par un objectif s'ajoutent à
  ceux cochés à la main (`knActivePerks`) et s'affichent cochés, grisés. L'amulette tire sa Maîtrise comme au butin
  (`knDrawAmulet`). Un Coup critique triplé remplace le doublement ; avec un point faible, il reste triplé.
  ⚠️ hypothèses : « tous vos dégâts de Feu infligés +1 » vise surtout les Aptitudes, que l'outil ne lance pas : rappel seulement ;
  la réduction d'un type s'ajoute à celle de l'équipement.

### KN46 — Règles de combat restantes
- **Overseer vaincu** (issue X25) : vaincre l'Overseer rend D4 Santé mentale, et ses influences cessent : le Domaine porte
  `overseerDefeated`, la fiche n'en rappelle plus aucune et l'éditeur de Domaine n'en réclame plus. La liste d'influences reste
  pour mémoire, et la case « Overseer vaincu » corrige une erreur. Un Overseer n'est pas touché par sa propre influence.
- **Peur** (issue X24) : engager une créature Effrayante ou Terrifiante pose `fear` sur le combat (perte de 2 ou 4 Santé mentale,
  `knFearLoss`) ; la carte de combat propose le test de Résolution en ligne, avec « Réussi » et « Raté : −N Santé mentale ». Un seul
  test pour toute la rencontre et la perte la plus forte, comme le dit le livre. ⚠️ hypothèse : une créature ajoutée au combat après
  son début (invocation) ne redéclenche pas le test.
- **Alerte** : une créature Alerte ne peut être surprise d'aucune façon, et ce trait l'emporte sur les Atouts qui font toujours
  surprendre. Le bouton « Surprendre » est donc grisé tant qu'une créature en vie l'a (`knCannotBeSurprised`) ; l'Atout de surprise
  assurée de la tranche précédente l'ignorait.
- **Bandage hors combat** (`healing.ts`, issue X28) : dans « Repos et provisions », un test de Médecine en ligne, puis « Test réussi :
  soigner D4 Robustesse » consomme un Bandage et marque l'usage comme « par salle » (remis à zéro à l'entrée d'une salle, comme les
  aptitudes). Le soin ne touche que la Robustesse, sans déborder sur la Santé, et ne dépasse pas son maximum. La clé d'usage
  `bandage` n'a pas de palier : le format d'un usage accepte désormais une clé sans `:palier`.
  Une réussite au test de Médecine est exigée (confirmé par le PM) : le bouton se confirme après le test. ⚠️ hypothèse : un test raté
  ne consomme rien et n'épuise pas l'usage de la salle.
- **Lampe en combat** (issue X32) : un bouton de la carte de combat pose la lampe au sol (Action Standard) ou la reprend ; l'état
  `lampDown` vit dans le combat et disparaît avec lui. Lampe posée, une maladresse du survivant ne tire pas dans la table : elle
  renverse la lampe, et « Appliquer : plus de lumière » met la lumière restante à 0 (la source de lumière manquante rend déjà
  Aveuglé et déclenche le test de Résolution par salle). Une carte avertit quand les deux mains sont prises (`knFreeHands` : une arme
  ou un bouclier en prend une, une arme à deux mains les deux) alors que de la lumière reste, sauf si la lampe est posée.
  « Toute son huile se répand » se lit comme une lumière restante de 0 (confirmé par le PM). ⚠️ hypothèses : l'outil ne sait pas si la
  source est une Torche, une Lampe, une Lampe de ceinture ou un sort, donc l'avertissement le dit et laisse le joueur juger ; la lampe
  se reprend à la main, et l'état n'est pas conservé après le combat.
- **Combat à deux armes** (issue X26) : avec une arme à une main dans chaque main (`knDualPair`), la carte d'attaque propose « Combat à deux
  armes » et le choix de l'arme dominante, à faire au début du combat (`combat.dual`). Seule l'arme dominante attaque, avec ses Traits et
  ses propriétés magiques : toutes les attaques à −40, +1 dégât (`KN_DUAL_WIELD`). Elle ouvre aussi une Parade gratuite par round, même sans
  le Trait Parade : cette défense n'ajoute pas au compte des Réactions et ne subit pas leur malus cumulatif ; elle se libère au round
  suivant (`freeParryUsed`). Décocher la case rend les deux armes séparées.
  Le −40 vise les attaques, pas la Parade gratuite (confirmé par le PM). ⚠️ hypothèses : la Parade gratuite se fait avec l'arme dominante,
  dont la compétence sert au test ; une seconde Parade du même round compte comme une Réaction ordinaire.
- **Arme ou bouclier sacrifié** (issue X27) : quand une créature porte un Coup critique au survivant, le tour propose de sacrifier l'arme ou le
  bouclier tenus : tous les dégâts sont absorbés (le tour passe en « appliqué » à 0) et l'objet est brisé (`broken` sur l'objet,
  `knBreakItem`). Un objet brisé reste dans sa main mais ne sert plus : il n'attaque ni ne pare, un bouclier brisé n'apporte plus son
  bonus, et ses propriétés magiques cessent (`knIsWorn`). Il ne se répare qu'au camp (le livre renvoie aux activités de camp ; confirmé par
  le PM) : le panneau de camp liste les objets brisés, chacun coché ajoute une pièce à l'activité Réparer (2 Fournitures par pièce,
  +2 Épuisement et −2 au test une seule fois), et la réparation s'applique à la fin du camp ; son Intégrité ne bouge pas. Ne vaut que
  pour le survivant, pas pour un sbire.
  ⚠️ hypothèse : les conditions que l'action de la créature aurait imposées en plus des dégâts sont annulées avec le coup.
- **Destin refusé** (`fateDenied.ts`, issue X29) : règle optionnelle du livre, offerte par un encart qui n'apparaît que lorsque la Santé
  est à 0 ; un premier clic demande la confirmation. Le survivant récupère 2D6 Santé mentale, 2D6 Santé et toute sa Robustesse (sans
  dépasser les maximums), le combat en cours s'arrête sans gain (« la pièce est vidée ») et il perd deux Aptitudes de Maîtrise au choix,
  jamais sous une Aptitude par Maîtrise, celle de l'amulette portée comprise. Chaque Aptitude perdue est la plus haute de sa Maîtrise ;
  s'il n'en reste qu'une (ou aucune) à perdre, on perd ce qui reste.
  La règle étant optionnelle, l'encart s'offre toujours et il suffit de ne pas le confirmer pour repartir avec un nouveau survivant :
  pas de réglage par survivant (confirmé par le PM). ⚠️ hypothèses : « 2 Aptitudes au choix » se retire par le haut, pour que les
  paliers restent consécutifs ; les Conditions et la Pourriture ne changent pas.

### KN56 — Retours de séance : jets appliqués d'eux-mêmes, influence de l'Overseer, jauge d'Épuisement
- **Le résultat d'un test s'applique tout de suite**, sans bouton à repérer : fouille (`KnVisitBlock` : la réussite tire la table de Fouille), perception,
  désamorçage, contournement, évitement, crochetage et forçage (`KnObstacleBlock`, table `ROLL_OUTCOMES`), branches « réussite » et « échec » d'un
  événement (`KnOutcomePanel.onRolled`), Peur, Bandage et chœur du premier Domaine. Le jet reste affiché, suivi de « Appliqué : … » ; les boutons
  « Réussi » / « Raté » restent pour les dés physiques.
- **Influence de l'Overseer** : elle se tire une seule fois, en entrant dans le Domaine (livre p. 96-98, et p. 243 pour le Domaine d'introduction). `KnDungeonPanel`
  offre une ligne D10 « Tirer / Saisir » tant que le Domaine n'a aucune influence (`knDrawOverseerInfluence`, `knOverseerInfluenceAt`) ; les influences
  s'affichent en badges sous la carte de l'Overseer, qu'il soit déjà tiré ou non : la croix retire l'influence, l'infobulle donne son texte. C'est leur
  seul affichage : ni liste dans les réglages du Domaine (qui gardent la saisie d'une influence), ni rappel sur la fiche. Un Overseer vaincu les barre.
- **« Résistant » tire son type de dégâts** sur le D20 de la table des types (p. 225, `knDamageTypeAt`, déplacée dans `catalog/damageTypes.ts` : `run.ts` en a
  besoin et `magic.ts` importe `run.ts`). Le type est rangé dans `domain.overseerResistances`, apparié dans l'ordre aux influences « Résistant »
  (`knOverseerInfluenceEntries`) ; le champ est **optionnel** (absent tant qu'aucun type n'est tiré, donc aussi dans les Domaines enregistrés avant : il se lit comme vide). Un « Résistant » sans
  type (saisi à la main, ou ajouté dans les réglages) fait apparaître sa ligne D20 ; l'événement d'Obscurité 81-100 tire les deux d'un coup.
  Retirer l'influence retire aussi son type (`knRemoveInfluence`).
- **Jauge d'Épuisement** : cinquième jauge de la barre d'état, de 0 à 21, d'une couleur à elle (les autres jauges ont déjà rouge, bleu, violet et gris), avec un repère
  à chaque seuil du livre (p. 90 : 0-10, 11-15, 16-20, 21 ou plus ; `knExhaustionStage`) et une infobulle qui liste les quatre paliers. Elle remplace le badge, qui n'apparaissait qu'au-dessus de zéro.
- Laissé de côté : les influences ne modifient rien dans le moteur (la résistance n'est pas retranchée des dégâts reçus par les créatures du Domaine,
  comme les autres influences) ; l'alerte des réglages « un événement 81-100 sans influence » compte l'influence de début de Domaine comme une influence d'événement
  et ne se déclenche donc plus quand elle est tirée.

### KN55 — Arme à terre, maximum qui grandit avec le niveau, projection de l'esprit
- **Arme lâchée ou fichée au sol** (`KnItem.dropped`, `knDropItem`, `knPickUpItem`) : une maladresse du survivant qui lui fait lâcher son arme (À terre) ou
  la plante hors de portée (Fichée au sol), ou qui heurte la pierre avec une arme magique sans la briser, la rend inutilisable comme une arme brisée
  (`knIsUsable` : elle n'attaque plus, ne pare plus, ses effets magiques cessent). La fiche la marque et propose « Ramasser » (un tour) ou, pour
  une arme fichée, un test d'Athlétisme puis « Récupérée ». ⚠️ hypothèse : l'arme qui a servi est celle qui tombe ; sans arme tenue, la prochaine
  attaque subit −20 (comme avant) ; pour tenir une autre arme, on la déplace à la main.
- **Maximum d'une jauge qui grandit avec le niveau** (`permanent.maxVitalPerLevel`, `knMasteryLevelSources`) : le bonus se **dérive** (il part avec le
  palier) : le niveau auquel on a débloqué l'aptitude, plus un nombre fixe par niveau gagné depuis. Chaque Maîtrise choisie retient donc le
  niveau de chaque palier (`masteryPicks[].levels`). ⚠️ hypothèses : sans niveau connu (palier pris avant ce changement, ou à la création), l'aptitude
  compte comme obtenue au niveau actuel ; le maximum monte, la valeur courante non (on récupère en se soignant).
- **Projection de l'esprit** (`project`, `foresight.ts`, `KnForesightPanel`) : une aptitude à usage limité tire d'avance jusqu'à 5 entrées nouvelles du
  Domaine : forme, description, porte, rencontre (et sa créature) et événement, comme une entrée réelle mais sans bouger ni entamer la lumière
  (`domain.foresight`). Elles s'affichent en entier dans la colonne de la pièce. Les prochaines entrées nouvelles du Domaine, dans cet ordre,
  reprennent ces tirages (`visit.foreseen`) quoi qu'on demande comme type ou forme ; les retours et le Domaine d'introduction n'y touchent
  pas. ⚠️ hypothèses : le Dé de Tension, le Lair et la Sortie se tirent à l'entrée réelle ; une projection remplace la précédente ; un événement
  pressenti dans une pièce qui se révèle être le Lair n'a pas lieu (les règles de l'entrée s'appliquent) ; la créature d'une rencontre se
  lit dans la table des Rencontres du Domaine, comme à l'entrée réelle.

### KN54 — Mouvements défensifs, passifs, gravure et dés typés
- **Mouvement défensif du survivant** (`survivorMoves.ts`, livre p. 77) : le D10 tiré après une défense réussie s'applique tout seul
  quand l'outil sait le faire. Six résultats posent un état sur la **prochaine attaque** du survivant (`combat.next` : bonus, dés,
  Avantage, visée sans Désavantage), consommé à sa prochaine attaque, touchée ou non ; un retire 1 d'Armure à la localisation
  d'adversaire tirée (`creature.armorLoss`, jusqu'à la fin du combat) ; un inflige 1 dégât perforant qui ignore l'Armure, en tenant
  compte des Résistances ; un retire 20 au prochain test défensif de l'adversaire (`creature.defenseMalus`, consommé à sa prochaine
  défense) ; un rend 2 Robustesse. Les deux résultats sur les conditions (Saignement de l'adversaire, Immunité) restent du texte.
- **Aptitude de réaction à l'Esquive** : sur une défense à l'Esquive réussie, un bouton donne à la prochaine attaque le bonus de
  l'aptitude (`attack.afterDodge`), qui **remplace** celui du mouvement défensif s'il est plus fort au lieu de s'y ajouter.
- **Aptitude à bonus défensif sur touche** (`attack.afterDefenseIfHit`) : le bonus au prochain test défensif ne vaut que si l'attaque
  touche. **Aptitude sans dégâts qui retire l'Armure** (`attack.noDamage`, `attack.stripArmor`) : sur une touche, le joueur choisit la
  localisation et la créature y perd toute son Armure (`armorLoss` à 99) jusqu'à la fin du combat.
- **Mouvement défensif d'une créature** (`monsterMoves.ts`, livre p. 78) : quand une créature pare l'attaque du survivant, son D10 s'applique.
  Sa prochaine attaque devient un effet d'une seule attaque de la créature (bonus de compétence, Avantage, dé de dégâts : mécanisme
  existant des effets de créature, `once`) ; le survivant perd 1 d'Armure à une zone tirée (`combat.armorLoss`), reçoit Saignement (1) ou
  1 dégât perforant direct, ou subit −20 à son prochain test défensif (Esquive, parade ou Résistance magique, `combat.defenseBonus`) ; la
  créature récupère D4 Santé. « Nettoie ses conditions » et « rejoue un tour » restent du texte ; la clause « si l'action est magique »
  reste dans le libellé de l'effet.
- **Aptitudes passives** (`permanent`) : défenses du survivant (Résistant, Immunisé, Restauré par un type de dégâts), type de ses
  dégâts, Blessure soignée par coup qui inflige des dégâts (`rewardSurvivorHit`). **À la mort de la cible** (`attack.onKill`) : ce que le
  survivant récupère. **À l'usage** : `combatModifier` pose un modificateur de combat (jusqu'à la fin du combat) en plus de `self` (échange
  de compétence d'arme contre des points temporaires).
- **Gravure** (`engrave`, `provisions`, `KnItem.engraved`) : une aptitude grave des dés typés sur une arme choisie, une fois par arme,
  et consomme des provisions (Composants rituels) ; l'arme gravée les ajoute à ses attaques.
- **Dés typés** : les dés ajoutés à une attaque qui ont un type propre (objets magiques, objectifs, niveau, gravure) ne sont plus écrits
  dans le texte de la réserve (qui n'a qu'un type) : `KnAttackOption.typed` les porte, le formulaire les affiche et les joint à la réserve,
  si bien que le dé retenu donne son type à l'attaque (Résistances, objectifs de dégâts).
- ⚠️ hypothèses : « remplace le +10 habituel » se lit comme un bonus qui prend la valeur la plus forte, pas une somme ; la réaction
  n'ajoute pas de défense au compte du round ; l'Armure retirée vaut aussi pour les Coups critiques ; le mouvement défensif du survivant
  n'est tiré que sur les attaques physiques (comme avant) ; les défenses permanentes jouent contre les attaques de créature sur le survivant (pas sur ses
  sbires) ; le soin par coup s'applique au moment où l'on applique les dégâts à la créature ; le bonus qu'une aptitude passive donne aux
  sbires Morts-vivants n'est pas appliqué.
- **Maladresses** (`fumbles.ts`, livre p. 84). Du survivant (D10 d'un échec critique) : l'arme se brise si elle n'est pas magique (réparable au
  camp), un objet de la Ceinture se casse (sans Ceinture, 1 dégât perforant), perte de D8 Éther (sans Éther, 1 dégât perforant), À terre,
  À terre et Hébété (2), et le **coup qui se retourne** (contre un allié, un sbire, quand il y en a ; sinon contre soi ; Coup critique au
  10) : dégâts lancés avec la réserve de l'attaque, l'Armure et les défenses, à appliquer par un bouton. Sans arme, la prochaine attaque
  subit −20 ; arme perdue ou fichée dans le sol : texte (récupérer l'arme est un geste). D'une créature : sa prochaine attaque −20 ; Entravée
  (−20 pendant D4 rounds), Effrayée (20) ; **conditions des créatures** modélisées par des effets : Étourdie (perd ses tours, ne se défend pas
  activement : `lostTurn`, `noDefense`), À terre (attaques contre elle avec Avantage : `advantageAgainst`, perd son tour pour se relever),
  Saignement cumulatif (`bleeding`, dégâts par round, l'Armure ignorée) ; dégâts qu'elle s'inflige ; Avantage défensif du survivant pendant
  2 rounds (`combat.defenseAdvantage`) ; Dissimulé (condition posée, à retirer à la main). Le tirage de l'action d'une créature qui a perdu
  un tour le dit et le consomme.
- **Mouvement défensif du survivant, suite** : Saignement (1) de l'adversaire (`knBleedCreature`) et Immunité à toutes les conditions jusqu'à
  sa prochaine attaque (`combat.immuneConditions` : les conditions subies n'ont plus d'effet, aucune nouvelle ne se pose).
- **Passives, suite** (`permanent`) : conditions auxquelles le survivant est Immunisé, pénalité de Réaction réduite (`reactionPenalty`),
  Santé laissée à 1 une fois par camp quand une attaque la ferait tomber à 0 (`surviveOnce`, dégâts de combat seulement), Dé de Tension qui
  recommence à D10 (`tensionStart`, `run.tensionStart`), bonus à un test pour éviter un piège (`trapAvoid`), provisions trouvées à chaque
  Fouille réussie (`scavengeFinds`), dés et Santé en plus pour les sbires d'un type de créature (`minionBonus`).
- ⚠️ hypothèses de ces ajouts : la maladresse d'une créature ne s'applique qu'à la créature elle-même quand sa cible est un sbire ; Effrayée (20)
  vaut −20 à ses attaques pendant 2 rounds (le livre la fait décroître de 10 à la fin de chacun de ses tours) ; Étourdie dure autant de tours
  que sa valeur, un tirage d'action en consomme un ; la maladresse « Dissimulé » ne dit pas combien de rounds elle dure, l'outil pose la
  condition et rappelle D4 rounds ; les dégâts qu'une créature s'inflige ignorent son Armure ; le coup qui se retourne contre un allié ne
  double pas ses dégâts, même au Coup critique ; la Santé laissée à 1 ne vaut que pour les dégâts de combat appliqués par l'outil.
- Laissé de côté : voir KN55. Contenu privé à recharger en prod après le merge (`npm run kn:content`, jeu `masteries`).

### KN53 — Aptitudes qui changent l'attaque du survivant
- **Format** (`masteries.ts`, `abilityAttack.ts`) : champ public optionnel `attack` sur une aptitude, renseigné dans le contenu privé.
  Il porte un bonus à l'attaque, des dés typés à la réserve (ou une réserve de remplacement), un Coup critique forcé, une cible qui ne
  se défend pas, une seconde attaque gratuite si la première touche, une attaque contre chaque adversaire, une marque de cible, un
  bonus au prochain test défensif et une défense interdite jusqu'à la prochaine attaque. 14 aptitudes sont annotées.
- **Une aptitude est une option de l'attaque.** Le formulaire d'attaque liste les aptitudes débloquées qui changent l'attaque : on
  coche celles qu'on veut, et « Attaquer » les paie (Éther, Santé, Épuisement), note leur usage limité et applique leur plan
  (`knAttackPlan`), réussie ou non. Une aptitude Maintenue allumée s'ajoute d'elle-même à toutes les attaques ; une marque de cible
  se pose par son bouton (une fois par adversaire, `creature.mark`) et joue pour les attaques suivantes contre elle. Les aptitudes
  d'attaque non Maintenues n'ont plus de bouton « Utiliser » dans la carte des Aptitudes de Maîtrise (`knAbilityIsUsable`).
- **Dés typés** : la réserve de dégâts garde un dé (le plus haut, le premier à égalité) et chaque dé peut avoir son type ; le dé retenu
  donne son type à l'attaque (`pickedType`), donc ses Résistances, Vulnérabilités et les objectifs de dégâts par type.
- **Défense du survivant** : `combat.defenseBonus` se consomme au prochain test défensif physique, `combat.noDefense` supprime la défense
  physique (`KN_NO_DEFENSE`, sans jet ni réaction comptée) jusqu'à la prochaine attaque du survivant.
- ⚠️ hypothèses : « Coup critique automatique » = une touche est un Coup critique (le jet d'attaque reste fait) ; la seconde attaque
  gratuite reprend la compétence et les bonus de la première, avec la réserve de l'aptitude quand elle en a une ; « tous les adversaires
  engagés » = tous les adversaires en vie (l'engagement n'est pas suivi) et l'état Hébété n'est pas posé ; les aptitudes liées à une arme
  précise valent pour toutes les attaques tant qu'elles sont allumées ; « prochaine attaque » se consomme même ratée (confirmé par le PM) ;
  la défense interdite ne vaut que pour l'attaque physique, pas pour le test de Résistance magique ; le joueur ne choisit pas un dé plus
  faible du pool contre une Vulnérabilité (le plus haut compte).
- Laissé de côté : les aptitudes qui agissent sur l'équipe. Gravure, effets à la mort, effets permanents et dés typés : KN54.

### KN52 — Folie : les effets qui jouent tout seuls
- **« Les ténèbres approchent »** : chaque perte de Santé mentale prend 1 de plus par cumul (`knSanityLossExtra`), qu'elle vienne d'une
  table (`knApplyTableEffects`) ou d'un Coup critique (`knApplyCriticalEffects`, paramètre `extraSanityLoss` passé par `KnRollPanel`). Un
  gain de Santé mentale, ou une perte nulle, ne change pas.
- **« Mémoire défaillante »** : chaque gain d'XP perd 10 par cumul, sans descendre sous 0 (`knReduceXpGain`) : effets de table,
  récompense d'objectif (`knClaimGoalReward`, `status` optionnel), fin de combat (`useKnCombatEnd`), livre de savoir (`KnLootSection`).
  Les messages disent la réduction (« dont N des Ténèbres qui approchent », « moins N par la Mémoire défaillante »).
- ⚠️ hypothèses : le plancher à 0 de l'XP, et la réduction aussi appliquée au +100 XP du résultat 10 de la table de Folie (il passe par
  `applyEffects`, donc par `knApplyTableEffects`).
- **Contenant « Vide »** : le résultat 1-5 du contenu d'une fouille approfondie donne quand même ses D20 pièces à l'Atout des pièces de
  contenant (`deepSearchContent`), puisque le butin ne sera pas tiré (le PM confirme que l'Atout vaut aussi pour un
  contenant vide).
- **Armure d'un effet** : une entrée `armor` (modificateur libre, effet de potion ou de Maîtrise) devient l'effet `armorBonus`, que
  `resolveKnSheet` additionne (`armorBonus`) et que `knArmorByZone` ajoute à chaque zone, pièce portée ou non (Peau de pierre : contenu
  privé de la potion mis à jour, à recharger par `npm run kn:content`).
- **Outils de voleur** (`knHasThievesToolkit`, objet du catalogue de clé `thievesToolkit`) : désamorcer un piège exige de les avoir (le
  test est bloqué et un avertissement s'affiche sinon ; « Réussi » et « Raté » restent saisissables) et ils donnent +5 en Larcin tant qu'ils
  sont dans l'inventaire et entiers. ⚠️ hypothèse : le +5 vaut pour tout test de Larcin, pas seulement le désamorçage (le livre ne précise pas).
  Les Crochets restent une provision, pour les verrous.

### KN51 — Revue de la fiche contre la maquette
- **Cartes repliables** (`KnCard`) : comme les sections de la fiche D&D, un bandeau d'en-tête (fond relevé, titre en capitales) cliquable avec un
  chevron ; replié, il montre un mini-résumé du contenu et aucun espace vide. État retenu par carte dans le navigateur (`kn:card:<clé>`). Identité et Notes et atouts, repliées par défaut, ont désormais un titre. Les Maîtrises se replient aussi une à une.
- **Compacité** : objectifs sur une ligne (nom, progrès, +1 / −1, récompense à récupérer), détail à l'ouverture ; équipement une ligne par objet,
  actions principales visibles, détails à la demande ; provisions, ajout d'objet et notes libres repliés ; Overseer sur une ligne (influences en
  pastilles, bouton « Engager le combat »), fiche à la demande ; compteurs, dés et éditeur d'Obscurité dans « Réglages du Domaine ».
  À 1 600 px : colonne du survivant 8 220 → 5 750 px, du donjon 2 480 → 750 px.
- **Couleurs** : cartes violettes par effet de Folie (texte de l'effet, cumul modifiable), panneau vert-brun pour la Pourriture.
- **Jet de dés** : la carte disparaît ; le bouton « Jet » de chaque compétence, résistance ou compétence ajoutée ouvre le test dans un panneau
  (`KnRollButton` → `KnInlineCheck`).
- **Repos** : « Prendre son souffle » (effet immédiat, résumé en message, `useKnBreather`) et « Établir le camp » (panneau du camp ouvert) sont dans
  la barre d'état. Un repos s'inscrit sur la pièce courante (`visit.rest`, `knMarkRest` ; le livre dit que le camp implique de sécuriser une
  salle) et se lit dans le bloc de la pièce et sur sa ligne du chemin.
- **Dés d'entrée** (`entryRolls.ts`) : la description d'une nouvelle salle ou d'un nouveau couloir se tire à l'entrée ; « Lancer les dés d'entrée »
  tire d'un coup ce qui ne demande aucun choix (Tension, Lair ou Sortie, porte, rencontre de combat, événement) ; « Saisir mes propres dés » rend les
  champs de saisie. Un retour ne tire que sa Tension. Tout tirage automatique se fait ici, jamais sans clic, pour garder la saisie de vrais dés.
- **Repères du chemin** : pastilles combat (ou fui), butin, marchand, Lair, Sortie, événement, obstacles, repos. La carte « Butin » ne s'affiche
  qu'après un combat, une fouille, un événement ou un contenant, un bouton la montre à la demande.
- Laissé de côté : la carte du Domaine, la mémorisation des cartes par survivant (elle est par appareil), un réglage pour lancer les dés d'entrée dès
  l'entrée.

### KN50 — Pièces persistantes : retour, fouille, pièges et fuite (X34)
- **Une pièce a une identité.** Un retour (`kind: 'revisit'`) désigne désormais la pièce ou le couloir qu'il revisite (`of`, l'identifiant `id`
  que reçoit la pièce la première fois qu'on y retourne). La **pièce courante** (`knLocationIndex`) est la dernière entrée, ou la pièce que cette
  entrée désigne. Le Dé de Tension, le Lair, la Sortie, le dé de l'Obscurité et l'annulation restent sur la dernière entrée ; fouille, portes,
  pièges, événement déjà tiré, créatures, marchand et vacarme agissent sur la pièce courante (`withLocationVisit`). Les anciennes entrées de
  retour, sans `of`, se comportent comme avant (la pièce courante est l'entrée elle-même).
- **Repasser par une pièce** (livre, ch. IV, « Retracing Your Steps ») : Dé de Tension et lumière à chaque entrée, mais ni rencontre de combat ni
  événement à tirer (`knRetracing`), et pas de description : ces tirages sont refusés. Ce qui reste à faire dans la pièce se fait : fouille si elle
  n'a pas eu lieu, pièges et verrous non réglés, effets d'un événement déjà tiré, marchand.
- **Fuir** (livre, ch. III, « Flee ») : test d'Esquive réussi, comme Action Standard (bouton « Fuir » de la carte Combat, `useKnFlee`). Le combat
  s'arrête sans récompense (`knFlee`), les créatures encore en vie restent dans la pièce (`visit.fled`) avec leur Santé remise à fond, et le
  survivant repasse dans la pièce précédente par une entrée de retour. En retournant dans la pièce, le bloc propose « Reprendre le combat »
  (`knResumeCombat`). Un test raté laisse le combat en cours.
- **Interface** : chaque pièce du chemin a un bouton « Y retourner » (le bouton générique disparaît) ; la colonne de droite montre le retour puis la
  pièce où il ramène, marquée « De retour ici ».
  ⚠️ hypothèses : la « pièce précédente » est la dernière entrée non-retour avant la pièce du combat ; le test de fuite est de difficulté normale
  et ne fait pas avancer le round ; les créatures déjà vaincues ne reviennent pas ; la peur d'une créature Effrayante se rejoue à la reprise.

### KN49 — Fiche en trois colonnes (U13a)
- **Maquette retenue** : trois colonnes, choisies sur maquette (Design) entre deux colonnes, colonne fixe, tiroir et trois colonnes. Le
  survivant d'un côté, le donjon (le chemin du Domaine) au milieu, la pièce choisie à droite. Pas de version téléphone : la fiche se joue sur
  grand écran, et sous 1 400 px les colonnes passent simplement les unes sous les autres. Les deux premières colonnes grandissent jusqu'à 32 et 36 rem
  quand l'écran le permet, la colonne de droite garde au moins 30 rem.
- **Page pleine largeur** : la page utilise le layout `wide` (l'en-tête du site est `AppHeader`, partagé avec `default`, sans `UContainer`).
- **Barre d'état collante** (`KnStatusBar`) : nom, niveau, Domaine et entrée en cours, XP, les quatre jauges, Épuisement, lumière, une pastille
  par condition (au survol, ce que la condition fait), Pourriture et Folie. Les jauges ouvrent un panneau (`KnVitalsSection`) et « Établir le
  camp » un autre (`KnRestSection`), accessibles de partout ; « Prendre son souffle » est un bouton direct (KN51). La carte « Référence des conditions » disparaît, ses textes
  sont dans les pastilles.
- **Colonne Donjon** (`KnDungeonPanel`) : Domaine, lumière, dés, Overseer, influences, boutons d'entrée, chemin du Domaine ; chaque entrée est un
  bouton qui la sélectionne. **Colonne Pièce** (`KnRoomPanel`) : le bloc de l'entrée choisie (`KnVisitBlock`), puis combat, butin et marchand.
  `KnRunSection`, qui faisait les deux, est supprimée.
- **Sélection d'entrée** : état d'interface (`selectedVisit` de la page), sans enregistrement. `null` suit la dernière entrée ; elle revient à
  `null` à chaque nouvelle entrée ou changement de Domaine. Une entrée plus ancienne s'affiche en lecture seule : on ne joue que la pièce
  où l'on se trouve, y compris après un retour (KN50, issue X34 #290).
- **Sous-titres des cartes** : `KnCardHeader` affiche le titre et range le sous-titre dans une infobulle derrière une icône d'information ; ce
  qui change en cours de partie (points à dépenser, pièces, contenus pris) reste affiché à côté du titre.
- **Grilles** : les colonnes sont des conteneurs (`@container`) et les grilles des sections du survivant passent aux variantes `@sm:` et `@md:`,
  sinon la liste des compétences se chevauchait dans 22 rem.
- **Refonte du contenu des sections** : (1) une compétence ou une résistance n'affiche que son score effectif ; un clic ouvre le détail du
  calcul et le score de base, modifiable (`KnEffectiveScore`, `v-model:base`), l'avantage et le désavantage sont des symboles ▲ ▼ ◆. (2) La carte
  « Folie et Pourriture » (`KnMadnessSection`) tire sur la table de Folie (`madnessDraw.ts`) : 1 mort, 2 à 7 un cumul de plus, 8 un souvenir
  bloqué à choisir, 9 deux D6 de dégâts contondants (bouton), 10 +100 XP (bouton) ; « Esprit fragile » retire 1 par cumul au D10 ; une alerte et
  un badge de la barre apparaissent à 0 en Santé mentale. (3) L'inventaire est groupé par emplacement (sur le corps, ceinture, sac), avec
  l'Intégrité en badge ; « Sur le corps » liste d'abord tous les emplacements (`knBodySlots`), vides compris, puis les objets portés ; la ceinture rapide (ses quatre cases) n'a sa
  section qu'une fois portée, et le sac à dos et les pochettes portés rejoignent la section « Sac », dont ils augmentent la capacité. (4) La carte Combat liste les Aptitudes de Maîtrise utilisables (`KnCombatAbilities`, qui réutilise `KnAbilityUse`) ; l'armure par zone quitte
  la carte Combat pour la section Équipement, et chaque créature y affiche sa Santé en barre avec un champ aligné.
  ⚠️ hypothèses : un résultat ramené à 1 ou moins par « Esprit fragile » compte comme un 1 ; les dégâts du 9 passent par la Robustesse puis la
  Santé comme tout dégât, l'armure n'y intervenant pas ; la Santé mentale n'est pas remise à niveau après un tirage (le livre ne le dit pas).
- Laissé de côté : boutons « Prendre son souffle » et « Établir le camp » directement dans la barre (ils sont dans le panneau), provisions dans la
  barre, carte du Domaine (l'effet des Aptitudes sur l'attaque vient en KN53, les effets de la Folie en KN52).

### KN48 — Début de partie : Débuts difficiles et Domaine d'introduction
- **Choix à la création** (issues X30 et X31) : une première partie ne prend aucun équipement, c'est le Domaine d'introduction qui le
  fournit. L'étape « Équipement » propose « Commencer par le Domaine d'introduction », cochée par défaut tant qu'on n'a pas choisi le
  kit des parties suivantes, décochable pour un départ « hardcore » (le livre le permet). Le serveur crée alors un run dont l'unique
  Domaine porte `intro` (`knIntroRun`) : Repaire et Sortie déjà « trouvés » (ils sont sur la carte, donc pas de dé d'usage), et aucune
  lumière jusqu'à la torche de la salle I.
- **La carte** (`KnFirstDomainSection`, `firstDomain.ts`) : huit salles au contenu fixe, que le jeu de données privé `firstDomain` décrit
  (nom, texte, ce que la salle donne : lumière, objets du catalogue avec leur nombre, gains de provisions, tables de butin à tirer) ;
  un bouton « Prendre le contenu » par salle, une seule fois (`intro.taken`). La salle du chœur teste la Résolution à chaque entrée (échec :
  dégâts) et un test de Raison ouvre un tirage sur la table de dépouilles ; la salle de l'Overseer renvoie au tirage habituel de la section Run ;
  la sortie passe au Domaine suivant et ferme celui-ci (`intro.left` : il disparaît du sélecteur de Domaine). Chaque salle a un bouton
  « Entrer dans la salle » (« Y retourner » ensuite) qui crée l'entrée du chemin du Domaine liée à la salle (`visit.introRoom`), avec son Dé de
  Tension et ses tests comme partout ; les entrées créées par la section Run restent libres (le livre laisse décider de ce qu'est un couloir).
- **Rencontres et événements par salle** : sauf mention contraire du livre, une salle a ses rencontres de combat et ses événements comme une salle
  ordinaire. Le jeu de données porte ce que le livre exclut (`noEncounter` : ni rencontre de combat ni événement, salles I et II ; `noEvent` :
  pas d'événement même sans adversaire, salles III et IV) ; l'entrée en garde les drapeaux et son bloc n'affiche plus les tests exclus.
- **Règles propres au Domaine** : toutes les portes sont marquées, donc pas de D10 de porte (« Vérifier une porte » est toujours proposé),
  mais verrous et pièges se vérifient comme d'habitude ; une table de rencontres à un seul D20 (jeu privé `encountersFirstDomain`) remplace
  les deux tables de la section Combat, et le tirage d'une créature n'a plus de D6.
- **Débuts difficiles** (X30) : un bouton de la carte, une seule fois (`intro.awakened`), applique D6 dégâts (Robustesse puis Santé), D4 de
  Santé mentale perdue et +1 Épuisement par les effets habituels (`KN_HARD_BEGINNINGS`).
- **Contenu privé** : `firstDomain` et `encountersFirstDomain` (français rédigé hors du dépôt, à relire avant tout chargement en production).
  ⚠️ hypothèses : le jeu part sans lumière et la torche donne 10 salles ; chaque entrée dans la salle du chœur refait le test et chaque
  réussite de Raison donne un tirage de dépouilles ; l'armure aléatoire de la salle II se tire telle quelle (elle peut être magique) ; les
  objets du Domaine arrivent « trouvés » comme tout butin. Les textes des salles sont ceux du chapitre du PDF français (VF v1.8), sauf la
  salle VI, nouvelle dans Gravebound, rédigée ici ; le « pilum » de la VF est l'épieu du catalogue.

- **Marchand conservé dans le Domaine** (issue X33) : un marchand trouvé dans un Domaine y reste et peut être revisité. L'entrée du chemin
  où il se trouve porte `trader` et le Domaine retient `traderFound`. Un bouton de l'entrée active marque « Un marchand est ici »
  (« Retourner voir le marchand » une fois trouvé, pour une entrée de retour ; « Il n'est pas là » corrige une erreur) ; la carte
  « Marchand » n'est affichée que dans une entrée marquée, et un nouveau Domaine repart sans marchand.
  ⚠️ hypothèses : le jeu ne sait pas où le marchand se trouve sur la carte, c'est le joueur qui marque l'entrée ; un survivant déjà
  en cours ne voit plus la carte Marchand tant qu'il n'a pas marqué une entrée.

### KN47 — Progrès automatique des objectifs
- **Format** (`goalCounts.ts`, issue X17) : un objectif porte un champ optionnel `counts`, la nature de ce qu'il compte (le contenu déjà
  écrit reste valide, un objectif sans `counts` se note à la main). Douze natures : adversaires vaincus (tous, d'un type, avec une
  compétence d'arme, ou Overseers : un seul critère à la fois), dégâts infligés d'un type, pièces obtenues, adversaires surpris, verrous
  crochetés, coups critiques, Reliques trouvées, pièces fouillées, tests de Raison réussis sur un événement, pièges désamorcés, événements
  d'Obscurité Grandissante, Livres de savoir pillés. Les valeurs sont dans le contenu privé.
- **Incrément direct, sans confirmation** (décision retenue, l'issue laissait le choix) : chaque événement fait avancer les objectifs
  en cours qui le comptent (`knApplyGoalEvents`, `useKnGoalProgress`) ; un message n'annonce que la cible atteinte. Le correctif manuel
  (+1, −1, saisie) reste disponible. Un objectif récupéré ne bouge plus ; le progrès a le même plafond que la saisie.
- **Où chaque événement naît** : adversaires vaincus à la fin du combat, avec leur type, la compétence d'arme du coup fatal (`slainBy`,
  posé quand le coup du survivant ramène une créature à 0) et le rang d'Overseer ; dégâts et Coups critiques quand l'attaque du survivant
  est appliquée ; surprise réussie ou automatique (les créatures en vie comptent chacune) ; verrou crocheté et piège désamorcé aux actions
  des obstacles ; pièce fouillée au tirage de la table de Fouille ; Relique et Livre de savoir à l'ajout du butin ; test de Raison réussi
  sur un événement ; pièces des effets de table, des ventes au marchand et de l'Atout des contenants ; Obscurité Grandissante par un seul
  observateur de la page, sur le Domaine courant.
  ⚠️ hypothèses : les dégâts d'Aptitudes et de sorts, que l'outil ne lance pas, ne sont pas comptés ; les pièces saisies à la main ne
  comptent pas (taper un nombre chiffre par chiffre en compterait trop) ; les adversaires vaincus par un sbire comptent sans compétence ;
  une créature éphémère disparue après son action ne compte pas ; « adversaires surpris » compte chaque créature en vie à la surprise ;
  un test de Raison sur une Fouille ne compte pas, seulement sur un événement ; un Domaine ajouté à la main compte un événement
  d'Obscurité de plus.

### KN39 — Suivi de combat : échange opposé, dégâts calculés, application par bouton
- **Règles sourcées** (livre v1.2) : p. 70 (jet opposé), p. 75-79 (attaque, défense, actions, Initiative et surprise,
  réactions à −20 cumulatif, vitesse de l'arme), p. 78 et 85 (mouvements défensifs, maladresses des monstres), p. 80-83
  (localisations, réserve de dégâts, types de dégâts, Armure, Coup critique), p. 131 (défense contre les actions des créatures).
- **Moteur pur** (`shared/ker-nethalas/combat.ts`) : `knCombatExchange` (succès, critique, échec critique, jet le plus haut,
  égalité, et « si les deux échouent, 1 dégât inévitable »), `knOpposedCheck` pour l'Initiative et la surprise,
  `knRollDamagePool` (le dé le plus haut plus tous les bonus fixes), `knResolveDamage` (doublement par Coup critique ou point
  faible, Armure sauf ce que le type ignore, perforant, tranchant, Vulnérable, Résistant, Restauré), Meute et Pénétrant.
- **État** (`combatState.ts`, dans `run.combat`) : les créatures engagées avec leur Santé fixée à l'engagement (au niveau du
  survivant), le round, l'Initiative, la surprise, les défenses déjà faites ce round (−20 cumulatif) et un journal. Aucune
  migration. La victoire et la fin du combat passent par `useKnCombatEnd`, partagé avec la carte « Fin de combat ».
- **Interface** : « Engager le combat » sur une fiche de créature ou sur l'Overseer ; carte « Combat » avec l'armure du
  survivant par zone, la Santé de chaque créature, l'Initiative, l'attaque du survivant (compétence d'arme, réserve de dégâts
  saisie, type, point faible visé avec Désavantage) et le tour d'une créature (action tirée, défense, test d'une action
  magique, dégâts). Les dégâts ne s'appliquent que par un bouton.
- **Dégâts des actions** : champ optionnel `damage` (dé et type) sur une action de créature, ajouté à la réserve des dés de
  ses paliers de niveau. Sans lui, le joueur saisit les dégâts du texte. Il porte aussi, au besoin, `always` (dus que le test
  du survivant réussisse ou non, quand il ne sert qu'aux effets annexes), `direct` (à la Santé, sans passer par la Robustesse ni
  l'Armure) et `extra` (dés qui rejoignent la réserve). Une action sans étiquette avec des dégâts se joue comme une action
  Magique : un test du survivant, et les dégâts à l'échec.
- **Les adversaires retiennent le dé le plus haut** (p. 80-81, « Enemies and NPCs ») : les dégâts que les effets d'une action
  infligent (`2D6`) suivent la même règle que sa réserve, au lieu d'une somme. Un effet de dégâts peut aussi valoir la moitié du
  jet, arrondie au supérieur, pour « la moitié en cas de réussite ».
- **Effets des actions** : champs optionnels `checks` (le test demandé au survivant) et `outcomes` (états, dégâts annexes,
  même format que les événements, KN37) sur une action. Une action sans étiquette propose son test et ses effets tout de suite ;
  une action Physique, une fois touché ; une action Magique, après un test raté, et son `checks` donne alors le test du
  survivant à la place de la Résistance magique. Les effets s'appliquent par bouton, par le même chemin que les événements
  (`useKnApplyEffects`). Les dégâts d'une action sans étiquette passent par ses `outcomes`, sans Armure.
- **Effets à durée sur le survivant** : un effet `timed` (étiquette, rounds en dés ou en nombre, dégâts de début de tour,
  modificateurs) devient un modificateur de la fiche marqué « de combat » (`combat`, `rounds`, `tick` dans `status.custom`), donc
  compté par le calcul des scores. Reposer le même effet en remplace la durée. « Round suivant » inflige les dégâts de début
  de tour (le dé le plus haut), puis retire un round ; les effets disparaissent à la fin du combat, et la carte de combat
  les liste avec un bouton pour en retirer un (se libérer d'une étreinte). Aucune migration.
- **Effets sur la créature** : `self` sur une action. Soins et Santé temporaire (en dés, ou en part des dégâts infligés, de
  la Santé maximale ou de la Santé actuelle, arrondie au supérieur ; plafond en multiple de la Santé ; terme : prochain tour
  ou fin du round) ; effets en cours (`buff`) : Résistant ou Vulnérable à tout (sauf certains types), Immunisé, Immunisé aux
  dégâts non magiques, Avantage à ses attaques ou à ses défenses, bonus de Compétence de combat, dé de dégâts en plus, attaques
  qui la visent avec Désavantage, dégâts renvoyés, usage unique. Ils durent des rounds, jusqu'au prochain tour de la créature
  ou jusqu'à la fin du combat, et peuvent toucher toutes les créatures de la même fiche. Les attaques du survivant et les
  tours de la créature en tiennent compte ; la riposte se subit par un bouton.
- **Sbires alliés** : un sbire invoqué s'ajoute à l'équipe par un bouton sous l'aptitude (six au plus, `run.minions`). Les
  sbires suivent le survivant de pièce en pièce, récupèrent toute leur Santé à la fin du combat et sont détruits à 0 Santé
  (p. 92-93). La carte « Sbires » joue leur tour : action tirée sur leur fiche, attaque d'une créature (leur Compétence de
  combat, sa défense et son Armure) ou sort (test de Résistance magique de la créature). Une créature peut viser un sbire :
  il se défend avec sa fiche. Qui l'adversaire vise reste le choix du joueur ; le livre veut les PJ d'abord.
- **Adversaires invoqués** : un effet `summon` fait entrer des créatures de plus, jusqu'à un maximum de la même fiche, et peut
  les placer d'emblée sous un effet (`buff`). Une fiche éphémère (`ephemeral`) disparaît au tour suivant celui où elle a joué
  son action : c'est le cas des serviteurs qui n'attaquent qu'une fois.
- **Fin du combat** : le survivant récupère D4 Robustesse quand un combat se termine (p. 86), victoire ou non ; « Annuler le
  combat » retire l'état sans rien rendre. La carte « Fin de combat » est supprimée : ses boutons (Combat remporté, Overseer
  vaincu, Combat terminé sans victoire) sont dans la carte « Combat », qui n'existe que pendant un combat, si bien que
  l'expérience d'une victoire ne se prend qu'une fois.
- **Public** : les 20 textes des mouvements défensifs et des maladresses des monstres, reformulés (`ker_nethalas.combat`).
- **Laissé de côté** : l'armure du survivant est saisie par zone à la main jusqu'à X16 (#263) ; les effets des mouvements
  défensifs et des maladresses restent du texte ; les conditions qui touchent une créature (Entravée, Aveuglée…) ne sont pas
  suivies ; le « une seule action par round » des créatures invoquées ; la réduction de la Robustesse maximale
  par un coup ; la fuite, le corps à corps à deux armes, le bouclier, la
  réduction d'Armure par l'acide, les conditions qui donnent Avantage ou Désavantage (À terre), l'influence de l'Overseer et les
  bonus de combat de l'Obscurité Grandissante par catégorie d'adversaire.

### KN38 — Bestiaire : format public, fiches privées, tirage par clé
- **Règles sourcées** (livre v1.2) : p. 133-135 (un D6 choisit la table de rencontre : 1-3 A, 4-6 B ; un D20 donne la
  créature), p. 179 (D10 pour l'Overseer, une fois en entrant dans un Domaine), p. 129-133 (types, traits, fiche, adaptation
  au niveau), p. 80-81 (localisations), p. 82-83 (types de dégâts, Armure).
- **Public** (`shared/ker-nethalas/creatures.ts`, `catalog/`) : le schéma d'une fiche (types, Nombre en dé, Esprit, Endurance,
  Corps, Santé fixe ou « base + par niveau », table de localisation et point faible, Armure par localisation, Compétence de
  combat, Résistance magique, traits, affinité, vulnérabilités, table d'actions D6 avec étiquette Physique ou Magique,
  paliers d'adaptation) ; les 14 types de dégâts et ce qu'ils ignorent de l'Armure ; les 6 tables de localisation ; les règles
  des 8 types de créature ; les 9 traits communs, reformulés. Ce sont des règles, comme les conditions.
- **Privé** : les fiches (`bestiary`, un tableau de fiches de clé unique) et les tirages (`encountersA`, `encountersB`,
  `overseers`, des tables dont chaque entrée porte le nom et `ref`, la clé de la fiche). Une créature sans fiche chargée
  s'affiche avec son nom et l'invitation à noter ses caractéristiques.
- **Adaptation au niveau** : le niveau du survivant fait la Santé (base + par niveau) et ouvre les paliers « après le
  niveau N », qui s'ajoutent tous (Santé, Compétence de combat, Résistance magique, dé de dégâts, Armure). L'adaptation
  s'affiche sur la fiche ; l'appliquer aux dégâts des actions viendra avec le suivi de combat.
- **Dans le run** : `creatures` dans une entrée (jusqu'à 4 tirages : test de combat, événement ou alarme) et `overseer` dans
  le Domaine, tous deux de simples numéros de dés ; aucune migration.
- **Vocabulaire** : Esprit, Corps (Mind, Body) sont mon choix : la VF, d'une édition antérieure, dit Vigilance et Athlétisme.
- **Sbires** : une fiche de rôle `minion` (même schéma, tableau d'actions à deux plages 1-4 / 5-6, pas d'adaptation) ; une
  aptitude de Maîtrise l'invoque par `summons`, sa clé, et la fiche s'affiche sous l'aptitude une fois débloquée, sans
  bouton d'engagement.
- **Laissé de côté** : les bonus de Maîtrise sur leur fiche, qui se saisissent en « dés de dégâts en plus » et à la main pour la
  Santé (KN39 pour le reste).

### KN37 — Tests en ligne, conséquences automatiques, actions sur les obstacles
- **Test en ligne** : un bouton « Tester » ouvre, dans le bloc de l'entrée, le même panneau que la carte « Jet de dés »
  (`KnRollPanel`, avec le test imposé : compétence ou résistance, difficulté, bonus) : cible, D100 tiré ou saisi, Avantage et
  Désavantage, critiques, maladresses et effets de critique. Le joueur n'a pas à changer de bloc ; le résultat met en avant le
  bouton « réussi » ou « raté » qui lui correspond, sans le cliquer à sa place. La fiche et ses scores viennent d'un contexte
  fourni par la section du run (`useKnCheckContext`). Première version écartée : régler la carte « Jet de dés » et y faire
  défiler, qui obligeait à aller et venir entre deux blocs (retour du PM).
- **Résultats d'une entrée de table** : format public optionnel `checks` (test à faire, par groupe) et `outcomes` (branche
  `success`, `failure`, `choice` ou `always`, avec ses effets). Une seule branche par groupe hors `always` ; deux tests
  indépendants dans une entrée font deux groupes. Chaque branche prise est marquée (`taken`) et ne se rejoue pas. Les effets
  sont ceux du moteur : pièces, provisions, XP, jauges, dégâts, Épuisement, état, temporaire, remise du Dé de Tension à D8,
  baisse du Dé de Lair, tirage d'Obscurité Grandissante. Les dégâts retirent la Robustesse temporaire, puis la Robustesse, puis
  la Santé (avant toute résistance aux dégâts : l'outil ne les applique pas). Un état déjà présent garde sa plus forte valeur :
  le livre ne dit pas comment cumuler. ⚠️ hypothèse
- **Ce qui reste du texte** : bonus temporisés (autels : « pendant les D10+2 prochaines pièces »), choix de l'arme, tirages
  dans les tables de Butin, de Folie et de Rencontres, la Pourriture, et tout ce qui dépend d'un
  second dé (baies, herbes), ou qui se répète à chaque visite de la pièce (massacre, flammes).
- **Fouille** : « Test de Fouille » se fait dans le bloc ; le premier résultat de la table (restes macabres) porte son test
  de Résolution et sa perte de Santé mentale.
- **Obstacles** : une machine d'états par porte, contenant ou piège de la pièce (un événement 1-10 en installe un). Piège
  repéré : désamorcer (Larcin à difficulté aléatoire ; un échec le déclenche), contourner (pièce seulement, test d'évitement
  +20), ou déclencher exprès (+20). Piège déclenché : test d'évitement de la compétence de la table, +20 si repéré ; « Subi »
  applique les effets d'échec du piège et le règle une fois pour toutes. Un piège de la pièce non repéré se déclenche aussitôt.
  Verrou, une fois le piège réglé : crocheter (Larcin, un Crochet ; la difficulté tirée au premier essai est retenue, chaque
  échec brise un Crochet des provisions et la baisse d'un cran) ou forcer (Athlétisme, +20 par échec précédent ; chaque
  tentative fait un test de Dé de Tension, automatique, enregistré dans l'entrée).
- **Laissé de côté** : un piège à
  conséquence partielle (filet : Entravé et dégâts de la chute après D6 tentatives) n'en applique que ce qui est
  inconditionnel ; le gaz et l'alarme restent du texte.

### KN36 — Exploration : tables de tirage privées, jets enregistrés par numéro
- **Règles sourcées** (livre v1.2, p. 98-99 et 117) : la forme d'une entrée se tire au D100 (1-25 couloir, 26-100 salle) ;
  rencontre de combat au D20, 10 ou plus dans une salle, 15 ou plus dans un couloir ; un événement se tire dans une salle
  seulement, si aucun combat n'a lieu ; une porte au D10 (1-5 présente, 6-10 absente), à vérifier pour verrous et pièges ;
  fouille au D20 après un test de Fouille réussi.
- **Tables** : format public `{ die, entries: [{ min, max, title?, text, effects? }] }`, validé par Zod (les plages couvrent
  1..dé sans trou ni chevauchement). Le contenu (descriptions de couloirs et de salles, fouille, événements) est privé,
  chargé comme les Maîtrises (KN27) ; `useKnContent` renvoie `null` s'il est absent, et l'écran invite alors à noter le
  résultat du livre.
- **Chemin du Domaine** : chaque visite ne garde que les **numéros** tirés (forme, description, rencontre, événement, porte,
  fouille), jamais le texte : le texte se relit dans la table, qui peut être corrigée sans toucher aux parties en cours.
  Un jet saisi à la main est accepté partout.
- **Effets de table** : `effects` ne porte que des gains ou pertes inconditionnels (pièces, provisions, XP, jauges, avec dés) ;
  « Appliquer le résultat » les applique au survivant, bornés (provisions et jauges au maximum, pertes au plancher 0). Ce qui
  dépend d'un test reste en texte, à jouer à la table.
- **Événements** (5b) : la table (D100, contenu privé) est en **texte seul**, sans `effects` : seuls trois résultats donnent
  un gain ou une perte sans test ni choix (Santé mentale, Épuisement), et le schéma des effets de table ne connaît pas
  l'Épuisement ; le bouton « Appliquer » n'existe que pour la fouille. Les renvois du livre (tables des Pièges, du Butin,
  Marchand) restent des renvois, à traiter en 5c et en tranche 7.
- **Verrous et pièges** (5c, livre p. 116-119) : une porte (trouvée par le D10 de porte) ou un contenant (fouille
  approfondie) se vérifie en deux temps. Test de Perception à difficulté aléatoire, noté « réussi » ou « raté » (le test se fait
  dans la section « Jet de dés ») ; D10 de piège (7 ou plus : piégé, repéré si la Perception est réussie) ; type de piège au D10 (table
  privée `traps`, avec la compétence d'évitement dans le champ optionnel `skill` de l'entrée) ; D20 de verrou (12 ou plus pour
  une porte, 10 ou plus pour un contenant). Chaque étape ne se tire qu'une fois, dans l'ordre. Le texte de résolution
  (désamorcer, contourner, déclencher, crocheter, forcer) est un rappel rédigé ici, replié.
- **Fouille approfondie** (p. 116) : une par entrée, hors zone explorée ; elle lance tout de suite un test de Dé de Tension et
  ajoute 2 Épuisement, puis ouvre un contenant à vérifier ; D10 de contenu (1-5 vide, 6-10 butin).
- **Tests de Tension supplémentaires** : la fouille approfondie et chaque tentative de forcer un verrou (vacarme) font un test
  de plus que celui de l'entrée. Ils sont enregistrés dans l'entrée (`extraTension`, dix au plus), modifient le Dé de Tension du
  run, et un déclenchement fait tirer un événement de l'Obscurité Grandissante, ajouté au Domaine. Comme pour l'entrée,
  « annuler » retire l'enregistrement mais ne rend pas l'état du dé, qui se corrige à la main.
- **Laissé de côté** : les illustrations de forme des salles (non reprises, accord éditeur) ; table du Butin des contenants
  (p. 220) et du Butin (p. 213) en tranche 7 ; choix de l'Overseer du Domaine (liste p. 179) avec ses blocs de caractéristiques en tranche 6 ;
  conséquences d'un piège déclenché (dégâts, états) : le texte les donne, le joueur les applique.

### KN35 — Activités de camp ajoutées par les traits, bonus au test de Camp, composants rituels
- **Règles sourcées** (livre v1.2, p. 124-125) : les activités de camp ont chacune un coût en Épuisement et un modificateur du
  test de Camp, payés une fois quelle que soit la quantité pour les activités de fabrication ; « Swap Mastery Amulets » est une
  activité de camp (sans coût) : l'outil rappelle qu'on ne change d'amulette qu'au camp sans le contrôler. Les textes des
  traits donnent les activités ajoutées et le bonus d'une aptitude de Pisteur.
- **Format public** (optionnel) : `campActivity` sur un trait (nom, Épuisement, modificateur du test, provisions consommées et
  produites par unité, `quantity` pour une activité à quantité, `recover` pour des effets sur soi appliqués à la fin du camp) ;
  `campCheck` sur une aptitude. `knCampTraits` (pur) les rassemble pour les Maîtrises possédées, `knCampContext` les reçoit,
  `knPreviewCamp` les ajoute aux activités du livre (Épuisement et test une fois, provisions par unité, Dormir interdit toute
  autre activité, y compris celles-ci, sauf Barricader).
- **Provisions** : `ritualComponents` rejoint les provisions ; migration `0142` (`json_set`) pour les survivants existants, car
  chaque provision est obligatoire. Le DEFAULT SQL de la colonne, que SQLite ne permet pas de modifier, reste celui de 0135 :
  l'application fournit toujours les provisions à l'insertion.
- **Fiche** : le panneau du camp liste les activités de trait avec leur coût, un champ de quantité (0 ou 1 sinon), le bonus
  d'aptitudes dans la ligne du test ; à la fin du camp, les effets sur soi des activités faites sont jetés et appliqués, et
  dits dans le compte rendu.
- **Interprétation** : le gain d'une activité de trait (Prier soigne la Santé mentale) n'est pas un « bénéfice du camp » : il
  n'est pas réduit de moitié après un test raté ou sans Ration, comme les effets de l'activité Dormir : seuls le sont les
  bénéfices de la liste du livre (Robustesse, Santé, Santé mentale, Épuisement), calculés après les activités (confirmé par
  le PM). L'effet de Prier est donc appliqué avant ces bénéfices, pour que le plafond de la jauge joue dans le bon ordre.
- **Contenu privé** : deux activités (le trait d'une Maîtrise de foi, celui d'une Maîtrise de rituels) et un bonus de +2.
- **Laissé de côté** : la dépense de composants rituels dans les aptitudes du Ritualiste (quantités variables) ; ils se
  tiennent dans les provisions et se retirent à la main.

### KN34 — Points temporaires, Blessures, fréquences d'usage et effets sur soi
- **Règles sourcées** (livre v1.2) : *Temporary* (p. 13) : un bonus temporaire dure jusqu'à être dépensé ou jusqu'à ce qu'on
  se repose, et peut dépasser le maximum ; les dégâts retirent d'abord la Robustesse, puis la Santé (p. 81) ; « récupérer X
  Blessures » remplit d'abord toute la Robustesse, puis la Santé (p. 13 et 86) ; fréquences (p. 123) : « une fois par repos »
  vaut pour une pause comme pour un camp, « une fois par camp » pour le camp seul ; l'expérience d'un combat vaincu est de
  50, celle d'un Overseer de 200 (p. 62-63). Le PM confirme que le temporaire se dépense avant le reste.
- **État** (`status`, optionnel : pas de migration) : `temporary` (`health`, `toughness`, `aether`, `sanity`), et `used`, la
  liste des aptitudes à fréquence déjà utilisées, avec leur fréquence (`combat`, `room`, `rest`, `campRest`), pour que la
  remise à zéro ne dépende pas du contenu chargé.
- **Fonctions pures** : `shared/ker-nethalas/vitals.ts` (`knTakeDamage`, `knHealWounds`, gains et effacement du temporaire,
  `knRest`, `knResetUses`), `dice.ts` (dés `{ nombre, faces, bonus }`, un montant fixe a zéro dé), `masteryEffects.ts`
  (`knApplySelfEffects`, usage limité, gains de fin de combat). `knApplyCriticalEffects` dépense la Robustesse temporaire
  avant la Robustesse (une seule règle de dégâts pour la fiche).
- **Format public** (champs optionnels) : `limit` et `self` sur une aptitude ; `onCombatWon` sur un trait. `self` : soigner
  des Blessures (`woundsHeal`), récupérer une jauge (`recover`), gagner des points temporaires (`temporary`), chacun avec ses
  dés. Le contenu privé porte quatre aptitudes avec effet sur soi, un trait avec gain de fin de combat, et huit fréquences relevées dans les textes.
- **Fiche** : « Points temporaires » et « Dégâts et soins » dans les Jauges (montant, « Subir », « Soigner des Blessures »,
  avec les maxima effectifs) ; « Utiliser » jette les dés d'effet, les applique, marque l'usage et le dit dans une
  notification ; un passif à fréquence a un bouton « Marquer utilisée » ; « Annuler » défait un marquage ; une carte « Fin de
  combat » (combat remporté +50 XP et gains des Maîtrises, Overseer vaincu +200 XP, combat terminé sans victoire) ; un repos
  efface le temporaire et les usages concernés, une entrée dans une pièce remet à zéro les usages « par pièce ».
- **Interprétations** : plusieurs gains temporaires s'additionnent (le livre ne dit pas qu'on garde le meilleur) ; toute
  entrée dans une pièce, y compris un retour dans une zone explorée, remet à zéro « une fois par pièce » ; le trait « pour
  chaque rencontre de combat vaincue » se déclenche aussi pour un Overseer, qui est un combat (précision du PM).
- **Laissé de côté** : les fréquences « par cible », « par adversaire » ou « par arme », qui restent du texte ; les soins
  égaux aux dégâts infligés, ou par composant dépensé (variables) ; les activités de camp ajoutées par un trait ; la
  Robustesse temporaire conditionnelle (réduire une compétence pour en gagner) ; les points temporaires de Santé, que le livre
  ne donne qu'aux créatures.

### KN33 — Effets des Maîtrises : coûts structurés, aptitudes Maintenues et effets chiffrés dans le moteur
- **Règles sourcées** (livre v1.2, p. 21) : une aptitude Maintenue retranche son coût en Éther de l'Éther **maximum** tant
  qu'elle dure (maximum 25 → 20 pour un coût de 5), et s'allume ou s'éteint hors combat ; les aptitudes Magiques se défendent
  par un test de Résistance magique. Une aptitude « Passif » n'a ni coût ni bouton.
- **Format public** (`shared/ker-nethalas/masteries.ts`, tous champs optionnels, donc le contenu déjà chargé reste valide) :
  `exhaustion` et `health` (coûts) à côté de `aether` ; `light` (tient lieu de source de lumière) ; `effects` sur un trait
  ou une aptitude, dans le format des modificateurs libres (`knCustomEntrySchema` : bonus de score, Avantage, Désavantage,
  maximum de jauge). Le texte reste la référence pour tout ce qui n'est pas chiffrable. Le contenu privé a reçu les coûts,
  tirés de ses propres textes de coût, deux drapeaux de lumière et cinq effets de trait ou d'aptitude (bonus d'Endurance,
  d'Avantage, de Résistance magique, de Santé mentale maximale).
- **Moteur** : `knMasterySources` (pur, `shared/ker-nethalas/masteryEffects.ts`) transforme les Maîtrises possédées, leurs
  paliers débloqués et les aptitudes allumées en sources, que `resolveKnSheet` reçoit par `extraSources` ; le trait d'une
  Maîtrise agit dès qu'elle est possédée, une aptitude une fois son palier débloqué, et une aptitude Maintenue seulement si
  elle est allumée. `lightProvided` supprime la pénalité d'obscurité quand une aptitude de lumière est allumée.
- **État** : `status.sustained` (liste de `<Maîtrise>:<palier>`), optionnel pour que les survivants existants restent valides,
  sans migration. Une aptitude allumée dont le palier est repris, ou dont l'amulette n'est plus portée, n'a plus d'effet ; sa
  clé reste dans la liste.
- **Fiche** : un bouton « Utiliser » par aptitude débloquée non passive (vérifie l'Éther actuel, déduit Éther et Santé, ajoute
  l'Épuisement) et un interrupteur « Maintenir » pour les aptitudes Maintenues (vérifie que l'Éther maximum absorbe le coût ;
  l'Éther actuel est ramené au nouveau maximum). Les effets sur la cible restent du texte.
- **Interprétations** : une aptitude dont le coût en Éther ou en Santé dépasse la ressource actuelle est bloquée (« Éther insuffisant »,
  « Santé insuffisante », règle du PM) ; payer jusqu'à 0 reste permis, avec une notification si la Santé tombe à 0 ; « +5 Santé
  mentale » du trait d'une Maîtrise est lu comme +5 de **maximum** (⚠️ le livre ne précise pas) ; le tirage et l'application
  de dés d'effet ne sont pas faits.
- **Alternative écartée** : coder les effets de chaque Maîtrise dans le moteur, qui lierait du contenu du livre au dépôt
  public ; le format public décrit seulement la forme, et les chiffres restent dans le contenu privé.
- **Laissé de côté** (tranche 4f-3) : points temporaires (Robustesse, Santé mentale, Éther) et leur consommation en premier, soin
  de Blessures (Robustesse puis Santé), événement « combat remporté », activités de camp ajoutées par certains traits, limites
  « une fois par combat, pièce ou repos », bonus conditionnels et effets sur un choix du joueur (arme du Maître d'armes).

### KN32 — Amulettes : possédées, une portée, des paliers communs
- **Règles sourcées** (livre v1.2) : une amulette donne accès à une troisième Maîtrise (p. 21 et 63) ; on en trouve en butin
  comme objet magique, et l'on tire alors une fois sur la table « Random Mastery » (p. 222 : un D20 sur les 20 Maîtrises,
  dans l'ordre du livre) pour savoir laquelle (p. 224) ; avec deux amulettes ou plus qui donnent des Maîtrises
  différentes, on les échange au camp, sans coût (p. 125) ; elles ne se vendent pas (p. 127) ; l'équipement a un
  emplacement « Amulette » (p. 206). Les aptitudes débloquées pour la Maîtrise d'une amulette restent les mêmes d'une
  amulette à l'autre, et le trait est actif dès qu'elle est portée (p. 63).
- **Décision** : colonne `kn_characters.amulets` (migration `0141`), `{ owned, equipped, tiers }` : les Maîtrises des
  amulettes possédées (deux amulettes peuvent donner la même), celle de l'amulette portée (qui doit être possédée), et les
  paliers débloqués, de 0 à 5, partagés entre toutes les amulettes. Les paliers coûtent des points d'Aptitude comme ceux des
  Maîtrises apprises (`knAbilityPointsUnspent(niveau, apprises, paliers de l'amulette)`).
- **Amulette sans effet** : une amulette dont la Maîtrise est déjà apprise reste possédée (elle ne se vend pas) mais n'apporte
  rien : `knAmuletMastery` renvoie `null`, la fiche l'indique, et ses paliers ne se débloquent pas. Ce comportement vient du
  PM, qui le tient de l'auteur sur Discord ; ⚠️ il n'est pas dans le livre. Il vaut aussi pour un supplément qui ajouterait
  des Maîtrises.
- **Fiche** : le panneau « Amulettes » de la section Maîtrises liste les amulettes possédées (« Porter », « Ne plus porter »,
  « Retirer »), en ajoute une choisie ou tirée au D20 (ordre du contenu chargé, qui reprend celui du livre : ⚠️ à revoir si un
  supplément ajoute des Maîtrises), et la section Équipement rappelle l'amulette portée. Une amulette qui arrive est portée
  d'office si l'emplacement est libre et qu'elle apporte quelque chose ; changer d'amulette ne se fait qu'au camp, l'outil ne
  le contrôle pas.
- **Alternatives écartées** : (a) une entrée de plus dans `mastery_picks`, qui ne sait pas représenter plusieurs amulettes
  possédées ; (b) une seule amulette échangeable à volonté, première version de cette tranche, trop simple.
- **Laissé de côté** : l'amulette comme objet d'inventaire à part entière et le butin qui en génère (tranche 7) ; l'amulette
  de la récompense de l'objectif « recommandé en premier » s'ajoute à la main ; il existe aussi des reliques de type Amulette
  sans Maîtrise (p. 240), qui ne relèvent pas de ce modèle.

### KN31 — Objectifs personnels : liste choisie, progrès noté à la main, récompense récupérée par un bouton
- **Décision** : même schéma que KN30. Le **format** d'un objectif est public (`shared/ker-nethalas/goals.ts`, schéma
  enregistré sous le nom `personalGoals`) ; son **contenu** (nom, objectif, cible chiffrée, récompense, mention
  « recommandé en premier » pour un seul) est rédigé en français dans `~/ker-nethalas-content/personalGoals.json`, hors du
  dépôt : 39 objectifs, relevés dans le tableau du livre rendu en image (le texte extrait mélange les lignes). Tout
  objectif se compte : celui qui se fait « en une fois » a pour cible 1.
- **État du survivant** : `kn_characters.goal_picks` (migration `0140`), une liste de `{ clé, progrès, récupéré }`. **Deux
  objectifs en cours au plus** ; un objectif récupéré ne compte plus dans les deux, mais ne se reprend pas (« chacun ne se
  prend et ne s'accomplit qu'une fois »). Le champ texte `personal_goals` reste, relibellé « Autres objectifs » : il
  garde les notes des survivants créés avant, et sert quand le contenu n'est pas chargé.
- **Création** : l'étape « Objectifs » remplace le texte libre par la liste (deux différents, comme pour les Maîtrises) ;
  le serveur compare le choix au contenu chargé (`knGoalPickIssues`) et n'en accepte aucun quand le contenu n'est pas
  chargé (ils se choisissent alors sur la fiche).
- **Fiche** : une section « Objectifs personnels » : progrès (champ numérique, +1, −1), barre, **bouton « Récupérer la
  récompense »** actif quand la cible est atteinte, puis l'objectif passe dans « Récompenses récupérées », où « Annuler »
  corrige une récupération par mégarde (s'il reste de la place). « Retirer » corrige un objectif choisi par erreur, mais
  seulement tant que son progrès est nul : le livre veut qu'il ne se change plus.
- **Alternative écartée** : garder le texte libre et lui ajouter un compteur, qui ne limite pas à deux objectifs, ne
  retient pas ceux déjà accomplis et ne se laisse pas brancher à un suivi.
- **Mise à jour automatique** (demandée, « pas urgent ») : le progrès est un compteur par objectif, donc le suivi de
  combat de la tranche 6 pourra l'alimenter. Ce qui manquera alors dans le contenu : la **nature** de ce qui compte
  (dégâts d'un type, adversaires d'un type vaincus, coups critiques, pièces trouvées…) ; ce sera un champ optionnel
  ajouté au format, sans invalider le contenu déjà écrit. Non ajouté maintenant : sans consommateur, il se figerait sur
  une forme devinée. Suivi : issue X17 ([#265](https://github.com/kevmorpain/le-bureau-du-jdr/issues/265)).
- **Laissé de côté** : l'application des récompenses (réduction de dégâts, bonus, Atout, XP, Amulette) : elles s'affichent
  et se reportent à la main, comme les aptitudes de Maîtrise ; le gain de 100 XP d'un objectif ne s'ajoute pas tout seul.
  L'Amulette (récompense de l'objectif recommandé en premier, qui ouvre une troisième Maîtrise) n'a pas d'effet sur la
  fiche : elle viendra avec la tranche 4d. Repris par KN45 (X23) : les récompenses s'appliquent.

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
| **0 — Socle** | entrée dans la navigation (`app/layouts/default.vue`), route `/ker-nethalas`, tables `kn_*`, fiche en saisie libre (nom, niveau, XP, Health/Toughness/Aether/Sanity, compétences, résistances) | fusionnée (PR #253) |
| **1 — Fiche effective** | moteur pur ; conditions, épuisement, Rot, folies, Growing Darkness, influence d'Overseer, modificateurs libres ; scores effectifs avec détail du calcul ; tests de contrat | fusionnée (PR #253) |
| **2a — Suivi de run** | Domaines, compteur de salles, source de lumière, Dé de Tension, dés de Lair et de Sortie, actions « Nouvelle salle », « Nouveau couloir » et « Retour dans une zone explorée », tirage dans la table de l'Obscurité Grandissante, chemin du Domaine enregistré (une entrée par salle ou couloir, avec ses dés) | fusionnée (PR #254) |
| **2b — Repos** | Reprendre son souffle, Établir le camp (activités, test de Camp, bénéfices, Rations), provisions | fusionnée (PR #255) |
| **3 — Aide au jet et référence** | jet D100 avec cible calculée, doubles, Avantage/Désavantage, effets des critiques et maladresses, application des effets chiffrés ; référence des conditions rédigée ici | fusionnée (PR #256) |
| **4a — Contenu privé** | table `kn_content`, chargement depuis des fichiers hors du dépôt, lecture sous session (KN27) ; issue X11 (#258) | écrite, vérifiée, non fusionnée |
| **4b — Création du survivant** | assistant en étapes (identité, jauges tirées aux dés, enveloppes de compétences, résistances, objectifs, équipement de départ), validation serveur ; issue X12 (#259) | écrite, vérifiée, non fusionnée |
| **4c — Maîtrises (pilote)** | format public, contenu privé de deux Maîtrises (Faucheur abyssal, Arcaniste), étape de création, section de la fiche, points d'Aptitude (KN30) ; issue X13 (#260) | écrite, vérifiée, non fusionnée ; contenu à valider par le PM |
| **4c bis — Objectifs personnels** | format public, contenu privé des 39 objectifs, étape de création (liste), section de la fiche (progrès à la main, récupération de la récompense, KN31) ; rattaché à X12 (#259) | écrite, vérifiée, non fusionnée ; contenu à valider par le PM |
| **4d — Maîtrises (suite)** | les 18 autres Maîtrises, en quatre lots ; issue X13 (#260) | contenu écrit, validé par le schéma, vérifié par recoupement des nombres ; à relire par le PM |
| **4e — Amulettes** | amulettes possédées, une portée, paliers communs, tirage au D20 (KN32) ; issue X13 (#260) | écrite, vérifiée, non fusionnée |
| **4f-1/2 — Coûts, aptitudes Maintenues, effets chiffrés** | bouton « Utiliser », interrupteur « Maintenir », effets du moteur (KN33) ; issue X13 (#260) | écrite, vérifiée, non fusionnée |
| **4f-3 — Effets sur soi** | points temporaires, soin de Blessures, fin de combat, fréquences d'usage, effets sur soi avec dés (KN34) | écrite, vérifiée, non fusionnée |
| **4f-4 — Activités de camp des traits** | activités ajoutées au camp par certains traits, bonus au test de camp, composants rituels (KN35) | écrite, vérifiée, non fusionnée |
| **8 — Progression** | sources d'XP (X19 #271), passage de niveau (X20 #272), amélioration de compétence au camp (X21 #273), Atouts (X22 #274), récompenses d'objectifs (X23 #275) avec le progrès automatique (X17 #265) ; une seule PR, un commit par issue (KN45) | fusionnée (PR #286) ; jeu `personalGoals` typé chargé en production |
| **10 — Début de partie** | Débuts difficiles (X30 #282), Domaine d'introduction : carte fixe, contenu des salles, table de rencontres propre, sortie sans retour (X31 #283), marchand conservé dans le Domaine (X33 #285) ; une seule PR (KN48) | écrite (X30, X31 et X33) |
| **X17 — Progrès automatique des objectifs** | champ `counts` sur l'objectif, événements du combat, de l'exploration et du butin qui font avancer le progrès, sans confirmation (KN47) | fusionnée (PR #288) |
| **9 — Règles de combat restantes** | Overseer vaincu (X25 #277), test de Résolution contre les créatures Effrayantes et Terrifiantes (X24 #276), Bandages hors combat (X28 #280), lampe en combat (X32 #284), combat à deux armes (X26 #278), arme ou bouclier sacrifié (X27 #279), Destin refusé (X29 #281) ; une seule PR, un commit par issue (KN46) | fusionnée (PR #287) |
| **5a — Exploration : tables, forme, description, rencontre, porte, fouille** | format des tables de tirage, forme au D100, descriptions de couloirs et de salles, contrôle de combat, porte, fouille avec application des effets (KN36) ; issue X14 (#261) | fusionnée (PR #268) ; contenu à relire par le PM |
| **5b — Événements** | table des événements (D100), contenu privé, ses tests et ses résultats (KN36, KN37) | fusionnée (PR #268) ; contenu à relire par le PM |
| **5c — Verrous, pièges, fouille approfondie** | vérification des portes et des contenants (Perception, piège, type de piège, verrou), fouille approfondie, tests de Tension supplémentaires (KN36) | fusionnée (PR #268) ; contenu à relire par le PM |
| **5d — Tests en ligne, conséquences, actions d'obstacle** | « Tester » fait le test dans le bloc de l'entrée, résultats d'événement, de fouille et de piège appliqués à la fiche, désamorcer / contourner / déclencher / crocheter / forcer (KN37) | fusionnée (PR #268) ; contenu à relire par le PM |
| **6a — Rencontres et bestiaire** | tirage de la rencontre (D6 puis D20) et de l'Overseer du Domaine (D10), fiche de créature adaptée au niveau, table d'actions, catalogues de règles (types de dégâts, localisations, types et traits de créature) (KN38) ; issue X15 (#262) | écrite, vérifiée, non fusionnée ; une seule PR pour la tranche 6 |
| **6b — Suivi de combat** | initiative et surprise, attaque opposée, localisation, dégâts et armure, actions des monstres, mouvements défensifs (KN39) | écrite, vérifiée, non fusionnée ; une seule PR pour la tranche 6 |
| **6c — Overseers, sbires, effets des actions** | les 53 fiches du bestiaire (43 créatures, 10 Overseers), les 5 sbires de Maîtrise (alliés dans le combat) et les effets que le texte des actions décrit : dégâts dus, directs, moitié, durées sur le survivant et sur les créatures, soins, Santé temporaire, invocations (KN38, KN39) | écrite, vérifiée, non fusionnée ; une seule PR pour la tranche 6 |
| **7 — Inventaire, équipement, butin** | issue X16 (#263), une seule PR : (a) inventaire, emplacements, capacité (KN40), catalogue d'objets, armes et armures dans le combat, Intégrité ; (b) butin, gemmes, fragments, potions, marchand ; (c) objets magiques, reliques, attunement | écrite, vérifiée, non fusionnée ; une seule PR pour la tranche 7 (a : inventaire, catalogue, équipement dans le combat, kit de départ, KN40-KN41 ; b : butin, gemmes, marchand, fragments et potions utilisables, KN42-KN43 ; c : objets magiques générés, harmonisés et appliqués, Reliques, contenants et revente, KN44) ; contenu à relire par le PM |
| **U13a — Fiche en trois colonnes** | survivant, donjon et pièce, barre d'état collante (KN28, KN49) ; issue U13 (#264) | écrite |
| **U13c — Revue de la fiche** | cartes repliables, compacité, couleurs, repos, dés d'entrée, repères (KN51) | écrite |
| **Folie automatique** | « Les ténèbres approchent » et « Mémoire défaillante » appliqués aux pertes de Santé mentale et aux gains d'XP, Armure d'effet, Outils de voleur (KN52) | mergée (#293) |
| **Aptitudes d'attaque** | aptitudes cochées dans l'attaque : bonus, dés typés, critique, défense interdite, seconde attaque, toutes les cibles, marque (KN53) | mergée (#294) |
| **Restes d'aptitudes** | arme à terre, maximum par niveau, projection de l'esprit (KN55) | mergée (#296) |
| **Retours de séance — lot A** | jets appliqués d'eux-mêmes, influence de l'Overseer et type de « Résistant », jauge d'Épuisement (KN56) | écrite |
| **Mouvements défensifs, maladresses et passifs** | mouvements défensifs et maladresses du survivant et des créatures, réaction à l'Esquive, retrait d'Armure, passifs, gravure, dés typés (KN54) | mergée (#295) |
| **U13b — Pièces persistantes** | actions sur une pièce passée : fouille, piège, fuite et reprise du combat ; issue X34 (#290) ; KN50 | écrite |

`CLAUDE.md` (section Architecture) et `docs/persistence.md` ont été mis à jour avec la tranche 0.

## Questions ouvertes

- **Dépôt public et accord de Blackoath** : l'accord couvre l'usage personnel ; pour un dépôt public, voir « Accord de
  l'éditeur » (le contenu reste hors du dépôt, KN27).
- **Interprétations à confirmer** (voir la section suivante).
- **Serveur de dev** : une fois, le navigateur a reçu une version périmée du fichier de traduction. Cause non établie :
  un essai a montré qu'une écriture par le chemin réseau Windows est vue, alors qu'un `sed -i` depuis WSL ne l'a pas
  été en 5 s. Redémarrer le serveur après avoir modifié un fichier de traduction.
- **Composants communs** (fiche, pistes) : à factoriser si un troisième système arrive.
- **Valeurs de création** : faites par l'assistant de création (KN29).
- **Amélioration des compétences** (p. 62) : les cases sont déjà stockées ; l'aide au jet d'amélioration au camp
  relèverait de la tranche 2b.
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

---

## Journal

### 2026-10-13 — Tranche 7, lot c : objets magiques
- Contenu écrit hors dépôt (`magicItems` : six tables de propriétés, 50 peculiarités), validé par le schéma au chargement ; à
  relire par le PM avant tout chargement en production.
- Vérifié dans le navigateur, sur un survivant de test : cinq objets magiques tirés au butin (type affiché), harmonisation de deux
  d'entre eux au camp (rareté et propriétés tirées, Cristaux décomptés), Résistance magique 20 → 30 une fois la ceinture
  harmonisée portée. Reliques tirées au butin précieux et dans la table des contenants ; une fiole consommée fait passer l'Éther
  maximum de 9 à 12 et disparaît. Non vérifié à l'écran : les boutons d'usage limité, la compétence à choisir, l'amulette tirée
  au butin, la revente, et la Pierre de Borestia en situation (couverts par les tests du moteur).

### 2026-10-13 — Tranche 7, étape 4c : kit de départ en inventaire
- Vérifié dans le navigateur : l'étape Équipement de la création tire l'armure (« Grand bouclier ») et propose les armes du
  catalogue ; un POST de création avec une Dague en main la range en `mainHand` et laisse le texte des armes vide.
  Non vérifié à l'écran : une création complète de bout en bout par l'assistant.

### 2026-10-13 — Tranche 7, étape 4b : fragments et potions
- Sources relues dans le livre (p. 214-215, 221, 126) avant d'écrire les 20 fragments, les 20 potions et la table de
  vieillissement ; contenu français hors dépôt (`loot`, `potionAging`), à relire par le PM avant tout chargement en production.
- Vérifié dans le navigateur, sur un survivant de test : tirage d'une potion (identité masquée sur la carte Butin), identification
  par test de Médecine (nom, description et vieillissement révélés), potion bue sans identification (vieillissement « tourné au
  poison » : test d'Endurance ouvert), fragment employé (effet de 5 salles posé puis décompté à l'entrée d'une salle : 5 → 4).
  Non vérifié à l'écran : l'application de Empoisonné (1) après un test d'Endurance raté (couverte par les tests du moteur).

### 2026-10-13 — Tranche 7, étape 4a : butin et marchand
- Pilotes en français relus et approuvés par le PM avant l'écriture ; la lecture « une arme ou une armure magique tirée dans le
  butin ordinaire s'obtient par la procédure des objets magiques » est confirmée.
- Vérifié dans le navigateur, sur un survivant de test : un tirage en chaîne (Butin D6 puis Objets ordinaires D100) donne « 2 ×
  Composants rituels », ajouté aux provisions ; vendre le bouclier rend 20 ₵ (la moitié de son prix). Rien n'est chargé en production.

### 2026-10-11 — Tranche 6c (suite) : effets des actions et sbires alliés
- Retour du PM sur ce qui restait en texte : les dégâts directs, la Santé temporaire des créatures, le test de Corps, les effets
  à durée et les sbires alliés « se font quand même ». Quatre étapes, chacune commitée, sans migration (`status.custom` et
  `run` sont des colonnes JSON dont les champs ajoutés sont optionnels).
- Source relue avant de coder : « Enemies and NPCs always pick the highest die rolled » (les dés d'un effet de créature étaient
  additionnés à tort) ; « Athletics/Body checks » (le test de Corps) ; les règles des sbires (p. 92-93).
- Vérifié dans le navigateur, sur un survivant de test supprimé ensuite : une action dont les dégâts sont dus malgré un test
  réussi ; la Santé temporaire d'une créature (+1 après 2 dégâts infligés) ; une aura de 1 dégât sur 2 rounds (Robustesse
  23 → 21, effet disparu au troisième round) ; Résistant à tout avec Désavantage contre soi, puis la riposte (2 dégâts de
  foudre subis) ; deux sbires ajoutés depuis leur aptitude, l'attaque d'un sbire, D4 adversaires invoqués, une créature qui
  attaque un sbire (1 dégât inévitable).
- Suite complète verte (192 fichiers, 2334 tests), tsc 14 serveur / 128 app comme avant.
- **Non vérifié** dans le navigateur : les durées en dés des effets sur la créature, l'usage unique, le sort d'un sbire.
- Sur retour du PM, les serviteurs d'un Overseer (D4, une attaque chacun, puis disparition) et les doubles d'un autre (deux
  par action, quatre au plus, sous un effet d'arrivée) sont des adversaires invoqués ; vérifié dans le navigateur (4 serviteurs
  invoqués, l'un joue puis ne peut plus agir ; 2 doubles arrivent sous leur effet). La disparition au tour suivant n'est vérifiée
  que par les tests unitaires.
- Le schéma des dés passe dans `diceSchema.ts` pour éviter un cycle d'import entre l'état de combat et `dice.ts`.

### 2026-10-11 — Tranche 6c : fiches du bestiaire, Overseers et sbires
- Décision KN38 complétée ; aucune migration. Les 53 fiches (43 créatures, 10 Overseers) et les 5 sbires sont écrits hors
  dépôt : chiffres, étiquettes, Armure, traits et adaptation lus par un script sur le livre et recoupés avec les pilotes ;
  textes d'action en français, avec leurs dégâts, tests et conséquences quand le texte les donne.
- Vérifié : les 58 fiches passent le schéma réel (chargement `kn:content` sur la base locale) ; dans le navigateur, une fiche
  de sbire sous deux aptitudes d'invocation d'un survivant de test (supprimé ensuite).
- Tests : un sbire accepté par le schéma des fiches, une aptitude qui désigne son sbire. Suite complète verte.
- **Non vérifié** dans le navigateur : l'engagement d'une créature des lots 3 à 5, et les Overseers au-delà du pilote.
- Texte français à relire par le PM avant tout chargement en production.

### 2026-10-11 — Tranche 6b : suivi de combat
- Décision KN39 ; aucune migration. Moteur pur testé (jet opposé, critiques, égalités, dégâts, Armure, types de dégâts,
  vulnérabilités, état du combat) : 44 tests.
- Vérifié sur une base neuve avec les trois fiches pilotes : engagement depuis une fiche (Santé 12 au niveau 1) ; Initiative
  (un double au-dessus de la cible est un échec critique, qui perd contre un simple échec) ; attaque parée avec mouvement défensif ;
  échec des deux côtés (1 dégât inévitable, appliqué 12 → 11) ; touche au bras gauche (D6 → 3, +1 tranchant, 4 dégâts, 11 → 7) ;
  tour de la créature : action magique ratée (Robustesse 23 → 21) puis action physique qui touche au torse (21 → 18) ; défenses
  du round comptées.
- Retours du PM appliqués : texte « sa Santé » ou « leur Santé » selon le nombre de créatures, défilement vers la carte de
  combat à l'engagement, format de la réserve de dégâts en sous-titre et erreur sous le champ, effets des actions (une Entrave
  ratée donne l'état Entravé, journalisé), fin du combat qui rend D4 Robustesse (10 → 13) et retire la carte « Fin de combat ».
- **Non vérifié** dans le navigateur : l'engagement contre l'Overseer, la surprise, le point faible visé, la saisie manuelle
  des dés, le défilement animé (volet masqué, vérifié par l'appel à `scrollIntoView`) et le rendu visuel.

### 2026-10-11 — Tranche 6a : rencontres et bestiaire
- Décision KN38 ; aucune migration. Trois pilotes privés à relire (deux créatures, un Overseer), plus les tables de tirage
  complètes (40 créatures, 10 Overseers), dont les clés servent aux futures fiches.
- Vérifié sur une base neuve : l'Overseer du Domaine et trois créatures posés dans l'entrée (dont une sans fiche) s'affichent ;
  la Santé suit le niveau (12 au niveau 1 pour 8 + 4 par niveau) ; « Tirer une créature » ajoute un tirage (limite de 4) ;
  « Tirer l'action » met une ligne en avant.
- **Non vérifié** dans le navigateur : la saisie manuelle des dés (volet masqué, le clavier ne répond pas) et le rendu visuel.

### 2026-10-11 — Tranche 5d : tests en ligne, conséquences, actions d'obstacle
- Décision KN37. Retours du PM : un bouton pour tester la Fouille, les effets automatisables des événements (un piège,
  par exemple), les actions possibles sur une porte ou un contenant ; puis les tests directement dans le bloc de l'entrée,
  sans changer de bloc. Aucune migration.
- Contenu privé annoté (hors dépôt) : 42 événements avec résultats, les 10 pièges (compétence d'évitement et dégâts), le premier
  résultat de la fouille. Un événement 1-10 installe un piège de la pièce.
- Vérifié dans le navigateur, base locale : événement 38 (Test raté : Santé mentale 11 → 10 ; Esquive ratée : Robustesse
  23 → 18 ; la réussite devient inactive) ; porte piégée (désamorcer à difficulté Exigeant, un échec déclenche ; test
  d'évitement Esquive +20 ; « Subi » : Robustesse 18 → 9, piège réglé) ; forcer (+20 après un échec, test de Tension D4
  enregistré) ; crocheter (difficulté retenue, Crochet brisé 2 → 1) ; piège de la pièce (événement 5, Perception ratée :
  déclenché aussitôt). Tests en ligne : Fouille (cible 10), évitement d'un piège (cible 60 avec +20, « Subi » mis en avant
  après un raté), événement 38 (deux tests, branche correspondante mise en avant, échec critique affiché dans le bloc).
- **Non vérifié** dans le navigateur : le tirage d'Obscurité Grandissante et le gain temporaire appliqués par une branche
  (couverts par les tests des fonctions pures) ; le rendu visuel (volet masqué).

### 2026-10-11 — Tranche 5c : verrous, pièges et fouille approfondie
- Contenu privé `traps` (D10, 10 pièges avec leur compétence d'évitement) ; code : constantes de seuils (`exploration.ts`),
  obstacles et tests de Tension supplémentaires dans l'entrée (`run.ts`), composant `KnObstacleBlock`. Aucune migration.
- Tests : 19 de plus (seuils, ordre des étapes d'un obstacle, fouille approfondie, bornes, déclenchement du vacarme).
- Vérifié sur la base locale : porte n° 1 d'une salle (Perception réussie, piège 9 → repéré, type 5 → Acrobatie « +20, piège
  repéré », verrou 14 → verrouillé) ; fouille approfondie (Épuisement 0 → 2, Dé de Tension D8 → 7, contenant ajouté, contenu
  6 → butin) ; vacarme saisi « 1-2 » (D8 → D6).
- **Non vérifié** dans le navigateur : l'affichage visuel (volet masqué, capture impossible) et le cas d'un test de Tension
  supplémentaire qui se déclenche (couvert par les tests des fonctions pures).

### 2026-10-11 — Tranche 5b : table des événements
- Contenu privé `events` (D100, 1-10 piège, 11-20 Butin, 21-30 Marchand, 31-100 événements propres) rédigé hors du dépôt,
  chargé en base locale : le schéma accepte la table (plages 1 à 100 sans trou) et l'événement déjà tiré (82) affiche son texte.
- Aucun changement de code.

### 2026-10-11 — Tranche 5a : exploration, tables et jets de la pièce
- Décision KN36 ; aucune migration (champs optionnels dans la colonne JSON `run`). Contenu privé : 20 descriptions de couloirs
  (D20), 100 de salles (D100), table de fouille (D20), hors du dépôt.
- Vérifié sur la base locale, contenu chargé sauf les événements : « Nouvelle entrée (forme au D100) » (95 → salle) ; tirage de
  description, de rencontre (1 : pas de combat), d'événement (apparaît après l'absence de combat, texte « non chargé » faute de
  table), de porte (1 : présente) et de fouille (4 : D4 Fournitures) enregistrés dans la visite ; « Appliquer le résultat »
  proposé ; une fois appliqué, les Fournitures d'Artisanat passent de 0 à 4 et la visite est marquée appliquée.
- Suite de la tranche : 5b les événements, 5c verrous, pièges et Overseer.

### 2026-10-11 — Tranche 4f-4 : activités de camp des traits
- Décision KN35 ; migration `0142` (composants rituels). Le test de contrat des migrations rejoue la chaîne depuis une base
  vierge : il passe, avec un nouveau test de la 0142 sur des provisions existantes.
- Vérifié sur une base vierge, survivant de niveau 6 avec deux Maîtrises et une amulette débloquée à 3 paliers : le panneau du
  camp montre les deux activités de trait avec leurs coûts ; test de Camp D20 −3 (+2 d'une aptitude de l'amulette, −1, −4) ;
  Épuisement des activités +2 ; 3 composants fabriqués pour 3 Fournitures (6 → 3) ; Ration consommée ; Santé mentale 4 → 8
  (D4 du camp et D4 de l'activité, détaillés dans le compte rendu).
- **Non vérifié** dans le navigateur : le cas d'un camp raté ou sans Ration pour ces activités, et l'activité à quantité
  refusée faute de Fournitures (couverts par les tests des fonctions pures).

### 2026-10-11 — Tranche 4f-3 : points temporaires, Blessures, fréquences, effets sur soi
- Règles précisées par le PM puis vérifiées dans le livre (voir la tranche 4e) ; le PM demande de garder la notion du
  livre, « dépensé », pour le temporaire. Décision KN34, sans migration.
- Vérifié sur une base vierge, survivant de niveau 6 : « Utiliser » le soin de Blessures d'une aptitude de 4 Éther et 2
  Épuisement (Éther 20 → 16, Épuisement 2, Robustesse 10 → 11 sur un D4) ; une aptitude « par combat » utilisée puis bloquée,
  libérée par « Combat terminé » ; « Combat remporté » : +50 XP et +1 Robustesse temporaire par le trait d'une Maîtrise ;
  3 de Robustesse temporaire, 5 dégâts subis : le temporaire passe à 0 et la Robustesse perd 2 ; 5 Blessures soignées :
  Robustesse +5. **Non vérifié** dans le navigateur : l'effacement du temporaire et des usages par une pause ou un camp, la remise
  à zéro « par pièce » à l'entrée dans une pièce (couvertes par les tests des fonctions pures).
- Le contrôle anti-fuite avant commit compare désormais le diff, lignes rejointes, à tous les noms du contenu privé : il a
  trouvé un nom d'aptitude coupé en deux lignes dans cette doc, présent depuis la tranche 4c et corrigé ici (il reste dans
  un commit non poussé de la branche).

### 2026-10-11 — Tranche 4f-1 et 4f-2 : coûts, aptitudes Maintenues, effets chiffrés
- Demande du PM : appliquer les effets chiffrés des Maîtrises et pouvoir utiliser une aptitude d'un bouton, avec son coût.
  Décision KN33. Pas de migration : `status.sustained` est optionnel.
- Vérifié sur une base vierge avec un survivant de niveau 5 : « Utiliser » déduit 4 Éther (20 → 16) ; « Maintenir » une
  aptitude de 5 Éther ramène l'Éther maximum effectif de 20 à 15 et l'Éther actuel de 16 à 15 ; une aptitude passive de
  −5 de Santé mentale maximale fait passer la Santé mentale maximale effective de 14 à 9 ; une aptitude passive n'a pas de bouton. Le contenu annoté passe le
  schéma réel au chargement. **Non vérifié** dans le navigateur : la lumière d'une aptitude (couverte par les tests du moteur),
  le blocage du bouton quand l'Éther manque.
- Constat : le tableau des coûts a été relevé dans les textes de coût rédigés, et les chiffres recoupés avec le livre au lot
  précédent ; seuls les coûts en Épuisement et en Santé sont nouveaux, et se lisent dans le livre à la même ligne que l'Éther.

### 2026-10-11 — Tranche 4e : les amulettes
- Demande du PM, puis règles précisées par lui et **vérifiées dans le livre** (couche de texte du PDF) : p. 13 et 86
  (« recover X Wounds » soigne d'abord toute la Robustesse, puis la Santé), p. 81 (les dégâts retirent d'abord de la
  Robustesse, puis de la Santé), p. 13 (le *Temporary* dure jusqu'à être dépensé ou jusqu'à un repos, et dépasse le maximum ;
  on le rencontre pour la Robustesse, la Santé mentale et l'Éther des joueurs, et pour la Santé de créatures), p. 125, 127, 206, 222, 224 pour les amulettes.
  Le livre dit « dépensé » : les points temporaires s'épuisent donc d'abord quand on subit des dégâts, ce que le PM
  confirme ; on garde cette notion.
- Une première version (une entrée marquée dans `mastery_picks`, commit `6ccca4a`) a été remplacée : elle ne savait pas
  représenter plusieurs amulettes possédées. Décision KN32 ; migration `0141` (`amulets`), `shared/ker-nethalas/amulets.ts`,
  panneau `KnAmuletsPanel`.
- Vérifié sur une base vierge : tirage au D20 (portée d'office la première, la seconde reste dans le sac), « Porter » d'une
  autre amulette, ligne « Amulette portée » de l'équipement, sauvegarde côté serveur. **Non vérifié** dans le navigateur :
  amulette dont la Maîtrise est déjà apprise, déblocage de paliers de l'amulette (couverts par les tests des fonctions pures).
- Le PM veut aussi les effets chiffrés des Maîtrises (Robustesse temporaire après un combat, +10 Endurance, activité de camp
  de l'Émissaire) et un bouton d'utilisation des aptitudes avec leur coût : plan 4f. Constats pour la 4f : le livre dit
  que « Maintenu » retranche le coût de l'Éther maximum tant que l'aptitude est active (p. 21), ce qui est un modificateur de
  maximum de jauge, déjà géré par `status.custom` ; le modèle n'a aucun point temporaire (à créer).

### 2026-10-11 — Tranche 4d : les 18 autres Maîtrises
- Le livre compte **20 Maîtrises** (pages 22 à 61, deux pages chacune), et non 21 : il en reste 18 après les deux pilotes.
  Rédigées en quatre lots de quatre ou cinq, dans `~/ker-nethalas-content/masteries.json`, hors du dépôt. Les noms
  viennent des images des pages ; les noms d'aptitudes suivent la VF quand elle concorde avec Gravebound v1.2 (KN16), le
  livre sinon (les paliers 4 et 5 de plusieurs Maîtrises diffèrent de la VF).
- **Le glyphe « ⅃ » est le symbole du niveau du personnage** (défini page 12) : l'extraction `pdftotext` le perd, et
  plusieurs aptitudes l'emploient (un nombre de points égal au niveau, « jusqu'à ⅃/2 adversaires »). Je l'avais pris pour
  une valeur manquante du livre avant de le chercher dans la couche de texte du PDF, qui le conserve (PyMuPDF `get_text`,
  caractère U+2143) ; cette couche de texte donne aussi les ligatures « fi » et « fl » sous forme de « 7 », à nettoyer.
- Recoupement automatique : pour chaque aptitude des 20 Maîtrises, les nombres et dés du texte français sont comparés à
  ceux de la page du livre. Aucun nombre français n'est absent du livre ; les écarts restants viennent des ligatures et du
  texte d'en-tête qui suit le palier 5 dans la couche de texte, et sont expliqués un par un.
- Choix de vocabulaire à valider : « Restauré » (la créature récupère des Blessures égales aux dégâts reçus d'un type,
  défini page 82, comme Immunisé et Résistant) ; « Sbire » (Minion) ; « Composants rituels » (le livre écrit aussi
  « Ingrédients » dans une aptitude : même objet) ; « Nécrophage » pour le *Wight* d'une Maîtrise de nécromancie, la VF disant
  « spectre » et appelant aussi « Spectre » une Maîtrise entière. Les créatures appelées (squelette, nécrophage,
  élémentaires, compagnon arcanique) renvoient à la page de leurs caractéristiques dans le livre : elles viendront avec le
  bestiaire (tranche 6).
- Chargé par `npm run kn:content` sur la base locale : les 20 Maîtrises passent le schéma réel.
- **Non fait** : l'amulette et les effets chiffrés (proposition au PM), l'avantage au passage de niveau (page 62 : un choix
  parmi huit, plus 1 point d'Aptitude), l'amélioration de compétence par les doubles : voir le plan.

### 2026-10-10 — Objectifs personnels (suite de la tranche 4c)
- Demande du PM : choisir les objectifs dans une liste plutôt que les saisir, pouvoir mettre le progrès à jour à la main et
  récupérer la récompense par un bouton ; la mise à jour automatique (combat, dégâts) viendra plus tard. Décision KN31 ;
  migration `0140` (`goal_picks`).
- Tableau relevé sur les pages 64 à 67 du livre rendues en image (PyMuPDF) : le texte extrait décale les récompenses
  de trois lignes de la page 66. Contenu rédigé dans `~/ker-nethalas-content/personalGoals.json`, avec
  l'effet des Atouts (page des Atouts) dans la récompense qui les donne. Le livre v1.2 appelle encore « Air » un objectif qui compte des
  dégâts de **Force** ; sur retour du PM (le type Air a disparu des versions récentes), il est nommé « Force ». Les
  cibles chiffrées viennent du livre anglais v1.2, pas de la VF, dont plusieurs nombres diffèrent (jusqu'à 1 000
  adversaires contre 100 pour un objectif, 10 000 pièces contre 5 000 pour un autre).
- Retour du PM sur le rendu : les étapes de l'assistant avaient une largeur maximale, qui laissait un grand vide à droite
  des listes (Maîtrises, objectifs) ; elle est retirée de toutes les étapes, comme dans le créateur D&D. L'écran de
  récapitulatif garde la sienne.
- Vérifié sur une base vierge : le contenu rédigé passe le schéma et se charge par le script ; l'étape « Objectifs »
  (39 cartes, 2 au plus, les autres grisées, un seul « recommandé en premier ») ; sur la fiche, prise d'un objectif, bouton
  de récompense inactif à 0/1 puis actif après +1, passage dans « Récompenses récupérées », état relu côté serveur ; le
  serveur refuse une création avec un objectif, deux identiques, un inconnu ou aucun quand le contenu est chargé.
- **Non vérifié** : « Annuler » et « Retirer » dans le navigateur (couverts par les tests des fonctions pures) ; le rendu
  sur téléphone ; le **texte français des 39 objectifs**, à relire par le PM.

### 2026-10-10 — Tranche 4c : Maîtrises, pilote de deux
- Les tranches 4a et 4b sont committées puis réunies sur une seule branche, `feat/ker-nethalas-tranche-4` ; le PM veut
  **une seule PR à la fin de la tranche 4**. Le journal des migrations passe à 0136, 0137, puis 0138.
- Lecture de « Character Progression » et des deux premières Maîtrises sur les pages du livre rendues en image
  (PyMuPDF, hors du dépôt). Contenu rédigé en français dans `~/ker-nethalas-content/masteries.json` : Faucheur abyssal et
  Arcaniste, avec leur trait, leurs cinq aptitudes et leurs six lieux d'entraînement. Décision KN30 ; migration `0138`
  (`mastery_picks`).
- Interface : étape « Maîtrises » de l'assistant, section « Maîtrises » de la fiche. Composable `useKnContent`.
- Vérifié sur une base vierge : le contenu rédigé passe la validation du schéma réel et se charge par le script ; les
  étapes se débloquent (une seule Maîtrise ne suffit pas, deux oui), tirage du lieu d'entraînement, création puis fiche
  (palier 1 visible, palier 2 grisé et masqué) ; points d'Aptitude (0 au niveau 1, 2 au niveau 3), déblocage du palier 2 puis
  3, reprise d'un palier, sauvegarde serveur ; choix de deux Maîtrises sur la fiche d'un survivant créé sans ; le serveur
  refuse une création sans Maîtrise, avec une seule, en double, inconnue ou à trois quand le contenu est chargé.
- **Non vérifié** : le choix des Maîtrises par la liste déroulante de la fiche (j'ai appelé le même gestionnaire par
  l'état du composant) ; le rendu sur téléphone ; le **texte français des deux Maîtrises**, à relire par le PM.
- **Retours du PM sur le rendu** : (1) le tirage d'entraînement ne montrait rien et ajoutait une ligne à l'apparence à
  chaque clic → résultat affiché à l'étape, remplacé à chaque tirage, champ `training` à part (migration `0139`) ;
  (2) les effets des paliers n'étaient pas visibles à l'étape de choix → texte de tous les paliers, sur la fiche aussi
  (grisé tant qu'ils sont verrouillés) ; (3) étape « Compétences » : consigne en double, +60 et +40 proposés hors armes →
  une seule consigne, boutons par ligne grisés selon les enveloppes restantes et les armes ; (4) récapitulatif en écran
  après « Terminer », comme D&D, puis mis en cartes par section (jauges, compétences, résistances, Maîtrises, équipement,
  entraînement, objectifs) ; lignes séparées à l'étape des compétences pour mieux associer chaque compétence à ses
  boutons. Vérifié dans le navigateur : boutons (armes seules, épuisement d'une enveloppe, reprise),
  tirages (remplacement, effacement si la Maîtrise est retirée), écran de récapitulatif avec retour, création et champ
  « Entraînement » relu côté serveur.

### 2026-10-08 — Tranche 4b : création du survivant
- Lecture du chapitre « Create Your Survivor » (jauges, compétences, résistances, Maîtrises, objectifs, équipement de
  départ). Décision KN29 ; migration `0137` (`appearance`, `coins`). Cette tranche ne dépend pas de la 4a : elle a été
  écrite dans une branche à part, depuis `main`, puis réunie avec la 4a (le PM veut une seule PR à la fin de la tranche 4).
- Moteur `creation.ts`, schéma partagé par l'assistant et le serveur, `knBuildCreatedSheet`. Interface : `/ker-nethalas/new`
  (sept composants d'étapes, un aperçu), index qui y mène, apparence sur la fiche, pièces dans l'équipement.
- Vérifié sur une base vierge dans le navigateur : étapes qui se débloquent (nom, jauges dans leurs bornes, enveloppes
  partielles signalées puis complètes, Résistance, objectif, équipement à dés), récapitulatif, création puis fiche relue côté
  serveur ; 422 sur une enveloppe manquante, une Santé hors des dés, un +60 hors arme, l'ancienne forme (nom seul) et un
  nom vide.
- **Non vérifié** : le choix des enveloppes par les listes déroulantes elles-mêmes (je les ai posées par l'état du
  composant, les listes de Nuxt UI ne se laissent pas piloter sans fenêtre dessinée) ; l'affichage de l'assistant sur téléphone.

### 2026-10-07 — Tranche 4a : contenu du livre hors du dépôt
- Les tranches 0 à 3 sont fusionnées, déployées, et l'issue #242 est fermée avec un récapitulatif. Les références de pages
  sont retirées des commentaires de code (PR #257).
- Le PM annonce l'accord de Blackoath (usage personnel, formulation libre en français, pas d'illustrations reprises) et
  veut **toute la mécanique aléatoire** : descriptions de pièces et de couloirs, événements, fouille, rencontres,
  Maîtrises, Overseer et influence, inventaire et équipement. Il choisit de garder le contenu **hors du dépôt public** et de
  **ne pas séparer** la fiche de la partie (deux colonnes à l'écran à la place). Les issues X11 à X16 et U13 sont créées
  (#258 à #264). Décisions KN27 et KN28.
- Tranche 4a : table `kn_content` (migration `0136`), registre vide de schémas, routes d'administration et de lecture,
  script `kn:content`. Défaut trouvé par un test : un nom comme `constructor` passait la regex et touchait le prototype du
  registre ; la recherche se fait sur propriété propre.
- Vérifié de bout en bout sur une base vierge, avec un jeu de données factice enregistré temporairement dans le registre
  (jamais committé) : chargement, refus d'un nom inconnu et d'une donnée invalide sans écraser l'existant, 401 sans secret
  ou sans session, 404 sur un jeu absent, et la session seule ne suffit pas à l'administration.
- **Non vérifié** : le chargement vers la production (aucun jeu de données n'existe encore) ; le script sur une très
  grosse donnée, au-delà de la limite de 1,5 Mo, couvert seulement par un test.

### 2026-10-07 — Tranche 3 : aide au jet et référence des conditions
- PR #255 fusionnée (tranche 2b) et déployée (Workers Builds vert sur le commit de fusion, migration `0135` appliquée) ;
  issue #242 : 2b cochée.
- Lecture des règles du test de compétence (D100, difficulté, Avantage et Désavantage, critiques, effets par test,
  Maladresses). Décision KN26 ; pas de migration.
- Moteur `roll.ts` ; interface `KnRollSection` (carte de jet), boutons « Jet » dans `KnChecksSection`,
  `KnConditionsReference`. Vérifié sur une base vierge dans le navigateur : critique et échec critique avec leurs
  effets, Avantage (62 lu 26) et Désavantage (26 lu 62) lus sur la cible modifiée par la difficulté, échec critique d'arme
  avec Maladresse D10, jet automatique, liste des dix-sept conditions. Sur retour du PM (« les effets sont-ils
  appliqués ? »), bouton « Appliquer à la fiche » pour les effets chiffrés, vérifié : Santé et Épuisement d'une Endurance
  critique, 8 dégâts d'une Médecine ratée (Robustesse 5 → 0, Santé 9 → 6), dé de Lair D10 → D12, sauvegarde serveur.
- **Non vérifié** : l'Avantage et le Désavantage *venant de la fiche* dans la carte (lus sur le mode forcé dans mon
  essai ; le calcul du mode de la fiche est celui de la tranche 1, testé).

### 2026-10-07 — Tranche 2b : repos et provisions
- PR #254 fusionnée (tranche 2a), déployée : Workers Builds vert sur le commit de fusion. Issue #242 : 2a cochée, tranche 2
  coupée en 2a et 2b.
- Lecture des règles de repos (Reprendre son souffle, Établir le camp, activités, test de Camp, bénéfices) et des
  endroits qui y touchent (Épuisement, Pourriture, événements 15-16, 17-18 et 19-20 de l'Obscurité Grandissante).
  Décision KN25 ; migration `0135` (colonne `provisions`).
- Moteur `camp.ts` ; interface `KnRestSection` (souffle, provisions) et `KnCampPanel` (activités, aperçu des coûts,
  test, bénéfices, bilan). Vérifié sur une base vierge dans le navigateur : souffle (valeurs et sauvegarde), camp complet
  avec Ration et Fournitures décomptées, pénurie et incompatibilité de Dormir signalées.
- **Non vérifié** : l'interface d'un camp au test raté ou sans Ration (couverte par les tests du moteur).

### 2026-10-06 — Tranche 2a : cadrage
- PR #253 fusionnée (tranches 0 et 1). Issue #242 : tranches 0 et 1 cochées.
- Lecture des règles de la tranche 2 (salles, lumière, dés d'usage, Lair et Sortie, retour sur ses pas, repos). Décisions
  KN19 à KN22 ; la migration `0134` convertit `status.domain` en liste de Domaines.

### 2026-10-06 — Tranche 2a : réalisation
- Moteur : `shared/ker-nethalas/run.ts` (dés d'usage, entrée dans une salle, Domaines, tirage de l'Obscurité
  Grandissante, schéma du run) et `catalog/light.ts` (sans lumière = Aveuglé + rappel de Résolution). Migration `0134` :
  colonne `run`, `status.domain` reversé dans le premier Domaine.
- Interface : `KnRunSection` (Domaines, lumière, dés, actions guidées), `KnVisitBlock` (une entrée du chemin),
  `KnDomainEditor` rattaché au Domaine courant. Vérifié dans le navigateur sur une base vierge : entrée de salle
  (lumière −1, Éther rechargé), Dé de Tension jusqu'au déclenchement puis tirage, retour en zone explorée sans dé de
  Lair, nouveau Domaine, lumière à 0.
- Retour du PM sur la capture : le dé de la liste « À faire » s'affichait après son jet et le journal de texte ne
  permettait pas de retracer le chemin. Remplacés par des entrées enregistrées (KN24).
- Tests : suite complète verte (179 fichiers, 1971 tests), dont `knRun` (chaîne des dés, table couverte de 1 à 100,
  injection du tirage, chemin du Domaine) et la migration `0134` sur un survivant à l'ancienne forme.
- **Non vérifié** : le tirage 81-100 dans l'interface (couvert seulement par les tests du moteur) ; le rendu visuel, le
  navigateur n'étant pas affiché pendant la vérification.

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
