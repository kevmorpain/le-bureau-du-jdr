# Bugs de parcours 2014 — B1–B16

> Index des bugs de parcours (label `bug` du projet
> [Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2)) : le comportement existe mais
> il est **faux**. Ce qui est **absent** relève de
> [`fonctionnalites-manquantes.md`](./fonctionnalites-manquantes.md). Symptômes, racines et
> correctifs détaillés avant nettoyage :
> [version `4cc089c`](https://github.com/kevmorpain/le-bureau-du-jdr/blob/4cc089c102ae2316f8eee79069036894519a41b9/docs/audit-completude.md).

## Classe de risque

« Choix qui se **répètent par palier de niveau**, où la CRÉATION à un niveau élevé doit
configurer **plusieurs** instances (ou refléter les instances déjà appliquées), mais le flux a
été écrit en supposant une seule instance / le palier exact. » Invisible aux tests d'équivalence
(qui figent le comportement) **et** aux audits de contenu (qui vérifient les données). Seul un
test **fonctionnel** les révèle.

Variante rencontrée de B3 à B10 : une valeur de règle **recalculée à la main** dans un composant
(mod de carac., maîtrises) au lieu d'être lue dans la couche de la fiche — chaque copie oublie une
source (espèce, dons, effets). Avant d'écrire un calcul de règle, chercher qui le fait déjà.

## Protocole d'audit (~30 min)

Pour **chaque** classe : créer un perso **niveau 20**, dérouler le wizard, cocher que **chaque**
choix par palier (ASI, dons, sous-classe, invocations, arcanums, style de combat, expertise,
métamagie, manœuvres, sorts connus) est **configurable** ET **affiché cumulativement**. Puis un
**level-up** de chaque type (palier de sous-classe, ASI, invocation, arcanum, multiclasse).

## Index

| Code | Suivi | Bug |
|---|---|---|
| **B1** | ✅ | Arcanums mystiques de l'Occultiste non cumulatifs à la création |
| **B2** | ✅ | Builder : base d'ASI non cumulative entre paliers (affichage) |
| **B3** | ✅ | Coup agonisant : mod de CHA recalculé sans le bonus d'espèce |
| **B4** | ✅ | Bonus de caractéristique des dons ignorés par le builder |
| **B5** | ✅ | Pas de jet pour toucher sur les sorts d'attaque |
| **B6** | ✅ | Aperçu des emplacements du level-up limité à une classe |
| **B7** | ✅ | Désavantage « arme lourde + petite taille » jamais déclenché (codes de taille) |
| **B8** | ✅ | Bonus d'espèce au choix (Fadette) perdus à la création |
| **B9** | ✅ | Picker d'expertise du level-up vide : compétences dérivées ignorées |
| **B10** | ✅ | Caractéristiques du level-up sans bonus d'espèce ni de don |
| **B11** | ✅ [#111](https://github.com/kevmorpain/le-bureau-du-jdr/issues/111) [#112](https://github.com/kevmorpain/le-bureau-du-jdr/issues/112) [#113](https://github.com/kevmorpain/le-bureau-du-jdr/issues/113) [#114](https://github.com/kevmorpain/le-bureau-du-jdr/issues/114) | Multiclasser vers un lanceur ne proposait aucun sort ; sorts connus/préparés classe par classe (`shared/rules/spellsKnown.ts`) |
| **B12** | ✅ [#104](https://github.com/kevmorpain/le-bureau-du-jdr/issues/104) | Multiclasse : maîtrises de départ accordées en entier |
| **B13** | ✅ [#105](https://github.com/kevmorpain/le-bureau-du-jdr/issues/105) | PV max figés quand le mod de CON change ([D19](./decisions.md#d19)) |
| **B14** | ✅ [#109](https://github.com/kevmorpain/le-bureau-du-jdr/issues/109) | Prérequis de multiclassage : seule la nouvelle classe était vérifiée (non bloquants, décision PM) |
| **B15** | ✅ [#110](https://github.com/kevmorpain/le-bureau-du-jdr/issues/110) | Maîtrises d'outils de classe jamais accordées |
| **B16** | ✅ [#203](https://github.com/kevmorpain/le-bureau-du-jdr/issues/203) | Repos : PV remis au maximum stocké, sans Robuste ni épuisement |

Correctifs de parcours hors numérotation : PR #95, #96, #98, #100, #101, #102. Fiches prod
abîmées avant #102 : [#116](https://github.com/kevmorpain/le-bureau-du-jdr/issues/116).
