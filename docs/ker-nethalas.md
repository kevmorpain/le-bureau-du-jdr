# Module Ker Nethalas

> **Statut** : tranches 0 à 3 fusionnées (PR #253 à #257, 2026-10-06 et 2026-10-07) ; issue #242 (X10) fermée. Suite : contenu du livre rédigé hors du dépôt (X11 à X16, U13). Tranche 4 en cours sur `feat/ker-nethalas-tranche-4` : 4a (chargement du contenu privé, X11), 4b (création du survivant, X12) et 4c (Maîtrises, pilote de deux, X13) écrites, non fusionnées ; une seule PR à la fin de la tranche 4. **Issues** : [#258 — X11](https://github.com/kevmorpain/le-bureau-du-jdr/issues/258), [#259 — X12](https://github.com/kevmorpain/le-bureau-du-jdr/issues/259), [#260 — X13](https://github.com/kevmorpain/le-bureau-du-jdr/issues/260).
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
- **Laissé de côté** : l'**amulette** (troisième Maîtrise, échange au camp), le **choix d'avantage à la montée de niveau**,
  l'application automatique des effets chiffrés des aptitudes (Éther dépensé, Santé mentale maximale d'une aptitude passive, immunités) : les aptitudes sont affichées, pas appliquées ; les 19 autres Maîtrises (tranche 4d).
- **Procédure de rédaction** : les noms d'aptitudes et de traits sont en petites capitales dans le livre, que
  l'extraction de texte perd ; les pages se rendent en image (PyMuPDF, installé hors du dépôt dans `~/tools/pymupdf`) et se
  relisent à l'écran. Les valeurs viennent du livre anglais, le vocabulaire de la VF, dont les chiffres diffèrent
  (le palier 3 du Faucheur abyssal n'y coûte pas la même Santé mentale que dans Gravebound).

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
| **4d — Maîtrises (suite)** | les 19 autres Maîtrises par lots, l'amulette, les effets chiffrés des aptitudes ; issue X13 (#260) | à faire |
| **5 — Boucle d'exploration** | forme et description des pièces et des couloirs, portes, événements, fouille, pièges, Overseer et son influence ; issue X14 (#261) | à faire |
| **6 — Rencontres et combat** | table des rencontres, bestiaire, suivi de combat ; issue X15 (#262) | à faire |
| **7 — Inventaire, équipement, butin** | objets, bonus appliqués en combat, butin, objets magiques, potions ; issue X16 (#263) | à faire |
| **U13 — Deux colonnes** | fiche en deux colonnes, survivant et partie (KN28) ; issue U13 (#264) | à faire |

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

---

## Journal

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
  après « Terminer », comme D&D. Vérifié dans le navigateur : boutons (armes seules, épuisement d'une enveloppe, reprise),
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
