# Design system de la fiche en jeu

Le design system de la refonte de la fiche (épopée U14) : quel composant prendre, et quand. Les visuels font foi
sur la planche « Fondations à jour » du canevas de maquettes (privé au PM) ; les valeurs vivent dans
[`app/assets/css/ds.css`](../app/assets/css/ds.css) ; ce document dit l'usage et ne recopie ni l'un ni l'autre.
Les consignes marquées *(à valider)* ne viennent pas de la planche : ce sont des propositions en attente de
décision du PM.

## Où est quoi

| Quoi | Où |
|---|---|
| Jetons (couleurs, polices, découpes) et formes biseautées | `app/assets/css/ds.css` |
| Composants | `app/components/ds/`, préfixe `Ds` |
| Textes | `i18n/locales/fr.json`, section `ds` |
| Tests | `test/nuxt/ds*.test.ts` |

Les jetons sont préfixés `ds-` pour que l'ancienne fiche garde les couleurs Nuxt UI jusqu'à la bascule (U26).

## Conventions

- **Style des composants en CSS scopé**, qui lit les jetons (`var(--color-ds-gold)`, `var(--ds-cut-input)`).
  Tailwind reste pour la mise en page des pages qui assemblent les composants (`gap-*`, grilles, et les utilitaires
  `bg-ds-*`, `text-ds-*`, `font-bodoni` générés par `@theme`), et pour le paramètre `:ui` de Nuxt UI, qui l'exige.
- **Aucun texte en dur** : tout passe par `$t('ds.…')`. Les libellés métier (nom d'un sort, d'un état) viennent
  de l'appelant.
- **Props déstructurées** (`const { label, variant = 'primary' } = defineProps<…>()`), pas de `withDefaults`.
- **Un seul point de rupture, en CSS** : sous 768 px de large (téléphone en portrait), la page passe en mise en page
  compacte. Le choix se fait par media query et pas en JavaScript, pour que le rendu serveur soit déjà le bon.
- **Thèmes de fond** (Prune, Sapin) : attribut `data-ds-theme` sur `<html>`. Un thème ne change que le fond, les
  panneaux, les filets et les encres ; l'or et les couleurs de sens restent fixes.

## Formes

Un bord biseauté se fait **en deux couches** : `.ds-bevel` porte la couleur du bord, son enfant direct `.ds-fill`
le fond, découpé un peu plus petit. La découpe intérieure se calcule seule à partir de `--ds-cut` et `--ds-edge`.
Jamais un `box-shadow` inset ni une `border` sur un élément découpé : la découpe rognerait le trait sur les
biseaux. Conséquence : un composant à bord seul a besoin d'un fond plein, celui de la surface où il est posé
(prop `surface` de `DsBadge`).

| Classe de forme | Pour |
|---|---|
| `ds-shape-stepped` | la pièce maîtresse d'une zone (une seule par zone) |
| `ds-shape-octagon` | fenêtre, tiroir |
| `ds-shape-corner` | champs, boutons de coin, puces, barre segmentée, étiquettes |
| `ds-shape-card` | carte de liste (sort, capacité, arme, objet) |
| `ds-shape-point` | bouton d'action |
| `ds-shape-hex`, `ds-shape-shield` | dé de vie, CA |

Les tailles de découpe sont des jetons nommés par usage : `--ds-cut-tag`, `-input`, `-control`, `-step`, `-panel`,
`-card`, `-button`. Jamais d'arrondi mêlé aux biseaux.

## Règles d'usage

- **Seul l'éditable a un cadre.** Un résultat affiché est du texte ; un champ à remplir a son cadre doré.
- **L'or est réservé** à ce qui est actif, sélectionné, précieux ou modifiable.
- **Choix exclusif → barre segmentée ; choix multiple → puces.** Les cases espacées servent aux compteurs,
  jamais aux choix.
- **Des cases plutôt que des chiffres** pour les ressources ; **une barre plutôt qu'un calcul** pour un aperçu
  de PV.
- **Tout jet de dés se saisit aussi à la main** : à côté d'un jet lancé par l'appli, un lien bascule en saisie.
- **Tout ce qui est destructif se confirme**, dans une fenêtre qui rappelle ce qui sera perdu.
- **Jamais de mot tronqué** ni d'abréviation maison : si la place manque, la colonne s'élargit ou le texte passe
  à la ligne.
- **Bodoni pour les titres et les chiffres, Atkinson pour le reste.** Les signes fins (+, −) ne se mettent pas
  en Bodoni.

## Quel composant prendre

### Structure

| Composant | Quand | Pas quand |
|---|---|---|
| `DsFrame` | boîte biseautée générique : gradins (pièce maîtresse), biseau complet, coin | un bloc courant de la fiche → `DsBlock` |
| `DsBlock` | bloc courant à double bordure, avec ruban de section (`ribbon`) | une pièce maîtresse → `DsFrame shape="stepped"` |
| `DsGroupTitle` | titre de groupe à l'intérieur d'un bloc ou d'une fenêtre | titre de section d'un bloc → `ribbon` de `DsBlock` |
| `DsCard` | élément de liste qu'on sélectionne (`as="button"`, `selected`) | contenu non sélectionnable → texte sur panneau |
| `DsShield` | la CA, et elle seule | — |
| `DsStatBase` | une valeur secondaire (initiative) | une valeur éditable → champ |

### Actions

| Composant | Quand | Pas quand |
|---|---|---|
| `DsButton` | l'action principale d'une zone ou d'une fenêtre (`primary`), une action secondaire (`secondary`), une destruction (`danger`, toujours derrière `DsConfirmModal`) | une action annexe → `DsLinkButton` |
| `DsLinkButton` | action légère : « Ajouter un objet » (`plus`), « Saisir les jets à la main », « Annuler » | l'action qu'on attend de l'utilisateur → `DsButton` |
| `DsCornerButton` | fermer, mettre en favori (`toggle`) ; toujours un `label` | une action avec un libellé visible → `DsLinkButton` |

Le pied d'une fenêtre aligne à droite : action légère, puis action principale.

### Choix et saisie

| Composant | Quand | Pas quand |
|---|---|---|
| `DsSegmented` | un choix exclusif : mode, onglet de fenêtre, Oui / Non ; le slot `option` ajoute une étiquette (coût A / B / R) devant le libellé | plusieurs choix possibles → `DsChips` |
| `DsChips` | plusieurs choix cochés ou non : états, conditions | un seul choix → `DsSegmented` |
| `DsCheckbox` | une option isolée à cocher | une liste d'options → `DsChips` |
| `DsCategoryTabs` | filtrer une liste par catégorie, avec compteur et icône de catégorie (`icon`) | changer de mode dans une fenêtre → `DsSegmented` |
| `DsNumberField` | saisir un nombre, dont un jet saisi à la main | un compte de ressource → `DsCounter` |
| `DsSelectField` | choisir dans une liste longue (type de dégâts) | trois options ou moins → `DsSegmented` *(à valider)* |
| `DsTextField` | texte libre court (nom d'un effet), recherche (`icon="search"`) ; `width="full"` occupe la ligne | un texte de plusieurs lignes → `DsTextArea` |
| `DsTextArea` | texte libre de plusieurs lignes (histoire, traits de personnalité) | une ligne suffit → `DsTextField` |

### Ressources

| Composant | Quand | Pas quand |
|---|---|---|
| `DsCounter` | emplacements, utilisations, charges, épuisement, inspiration ; `regained` et `possible` pour un aperçu (repos) | — |
| `DsDiamond` | un losange seul, dans un composant qui gère son propre état | une ressource → `DsCounter` |
| `DsHitDie` | les dés de vie au repos court : à dépenser, choisi avec son jet, dépensé | — |
| `DsDeathSaves` | les jets contre la mort | — |
| `DsHpBar` | les PV, et tout aperçu de PV (`preview`) : dégâts, soins, repos | — |
| `DsConcentration` | la bande de concentration, seule pièce claire de la fiche ; `is-inline` la tient sur une ligne (en-tête du téléphone) | — |

### Étiquettes et icônes

| Composant | Quand |
|---|---|
| `DsCostTag` | le coût d'une action : A, B, R |
| `DsBadge` | rareté, niveau, lien (`default`) ; état d'un objet (`equipped`, `attuned`, `stowed`) ; `new` pour ce qui n'existe pas encore dans l'appli |
| `DsIcon` | catégorie (sort, capacité, arme, objet), concentration, rituel, favori, onglets de navigation ; faits d'une carte (portée, attaque, sauvegarde) et loupe de recherche, à la couleur du texte. L'étoile est réservée aux favoris, le rituel a sa bougie. |

### Fenêtres et retours

| Composant | Quand | Pas quand |
|---|---|---|
| `DsModal` | une tâche qui se termine (repos, dégâts) ou une gestion (états : un seul bouton « Terminé ») | consulter un détail en gardant la fiche visible → `DsDrawer` *(à valider)* |
| `DsDrawer` | le détail d'un élément (sort, objet), à côté de la fiche *(à valider)* | le détail d'une carte de la vue En jeu, posé dans la page à côté de la grille (maquette « Tour 7 ») → `SheetPlayDrawer` |
| `DsSheet` | une feuille qui monte du bas sur téléphone : le rail déplié, le menu « Plus » | une tâche qui se termine → `DsModal` |
| `DsConfirmModal` | toute action destructive ; le corps dit ce qui sera perdu | — |
| `DsRollToast` | le résultat d'un jet (`DiceRoll`) | — |
| `DsSaveIndicator` | l'état de la sauvegarde, sous « Personnages » dans la tranche, et dans l'en-tête sur téléphone ; seuls endroits où le voir. Au toucher, la page ouvre le détail et l'action utile (Envoyer maintenant, Réessayer, Résoudre). | — |
| `DsNavItem` | un onglet de la tranche de navigation, ou de la barre d'onglets du téléphone | — |

Une fenêtre a son titre et sa fermeture, une barre de modes (slot `modes`), un corps qui défile et un pied fixe
(slot `footer`). Elle ne se ferme pas à chaque ajout : on ajoute et on retire au même endroit.
