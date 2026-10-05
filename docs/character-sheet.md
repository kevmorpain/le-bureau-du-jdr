# Fiche de personnage — sections et données

Page : `app/pages/characters/[id]/index.vue`

La fiche charge le personnage via `GET /api/character_sheets/{id}` (include toutes les relations Drizzle sauf les sorts). Un deep watch avec debounce 1 s persiste les changements via `PUT /api/character_sheets/{id}`. Les sections qui font leurs propres fetches (inventaire, sorts) ont leurs propres composables.

---

## Mise en page

La page utilise un **dashboard 3 colonnes** (`dashboard-grid`) :

| Colonne gauche (240px) | Colonne centrale (flex) | Colonne droite (240px) |
|---|---|---|
| `AbilityScoresSection` | `QuickStatsSection` | `HitPointsSection` |
| `ProficienciesSection` | `CombatModeSection` *(combat only)* | `DeathSavingThrowSection` |
| | | `HitDiceSection` |
| | `FeaturesSection` | `DefensesSection` |
| | `MagicSection` | `StatusSection` |
| | `InventorySection` | `SpellSlotsSection` |
| | `IdentitySection` *(contient `BackgroundSection`)* | `ConcentrationSection` |
| | | `QuickNotesSection` |

La plupart des sections de la colonne centrale sont enveloppées dans `CollapsibleSection` (état persisté en localStorage via `storage-key`). En-tête fixe : `DashboardHeaderSection`.

---

## En-tête (`DashboardHeaderSection`)

Barre sticky sous la nav principale. Affiche :
- **Portrait** du personnage (`portraitUrl`) — seule surface où il est rendu sur la fiche, pour
  rester visible quelle que soit la section ouverte ; masqué s'il n'y a pas d'URL ou si l'image
  est injoignable (le retour à l'utilisateur se fait dans le slideover, au moment de la saisie)
- Nom du personnage + niveau total
- Description courte : espèce · historique · classe(s) avec **sous-classe** et niveaux
  (ex. « Nain des collines · Sage · Occultiste (Le Grand Ancien) 10 »)
- Conditions actives (badges cliquables pour les retirer)

**Boutons d'action :**
- **Repos court** / **Repos long** → `useRest` → `POST /api/character_sheets/{id}/rest`
  - Repos court : recharge les aptitudes `rechargeType: 'short_rest'`
  - Repos long : recharge tout + restaure les PV max + recharge les emplacements de sort
- **Mode Combat** : toggle local `combatMode`. À l'activation, lance automatiquement l'initiative. Affiche/masque `CombatModeSection`.

---

## Colonne gauche

### Caractéristiques (`AbilityScoresSection`)

Affiche les 6 scores (FOR/DEX/CON/INT/SAG/CHA) avec :
- Score de base (éditable) + bonus d'espèce (automatique depuis les effets)
- Modificateur calculé
- Jets de sauvegarde (maîtrise depuis `character_ability_scores`) + effets `saving_throw_bonus` (signés, une
  caractéristique ou `all`) des capacités, objets actifs et effets temporaires ; l'icône ✨ détaille les sources
- Compétences regroupées par caractéristique (maîtrise + expertise depuis `character_skills`)

**Source :** `character_ability_scores` pour les scores de base, effets d'espèce/classe pour les bonus, `character_skills` pour les maîtrises.
**Persistence :** `v-model` → deep watch → PUT.

**Calcul du score** (`shared/rules/abilityScores.ts`, appelé par `useCharacterAbilities`) :
1. **maximum** = 20 + Σ `ability_max_increase` (Champion primitif : +4 en FOR/CON) ;
2. **score naturel** = base + espèce + capacités + ASI/dons, **plafonné au maximum**. Le plafond borne ce que
   les sources ajoutent : une base saisie au-delà n'est jamais baissée ;
3. **objets actifs** (cf. Inventaire) : `ability_increase` ajoute sans dépasser son `max` propre (Pierre de
   Ioun : 20), ou à défaut le maximum du personnage ; puis `ability_score_set` relève le score à sa valeur
   s'il est inférieur (Gantelets de puissance d'ogre : 19).

La décomposition au survol du modificateur affiche les lignes « Plafond » (points perdus) et « Objets & effets ».
Les effets temporaires de la fiche (cf. colonne droite) suivent la même règle que les objets actifs (étape 3).

### Maîtrises (`ProficienciesSection`)

Maîtrises d'armes, d'armures, de langues et d'outils.

**Source :** Calculé depuis `allEffects` (effets d'espèce + classe + inventaire) + `character_proficiency_overrides` (ajouts/retraits manuels).
Les effets de classe (`classEffects`, dérivés par le GET) sont les maîtrises **de départ** de la classe
principale et le **sous-ensemble du multiclassage** des autres classes (porteurs `proficiency_grant` /
`multiclass_proficiency_grant`, seedés depuis `shared/rules/classProficiencies.ts`), lus par `deriveClassGrants`.
Les maîtrises **choisies** sur un point de choix (langue, outil ou compétence d'espèce, de lignée, d'historique ou
de classe, remplacement d'une maîtrise en double) arrivent dérivées dans `choiceEffects` (`deriveChoiceProficiencies`).
Libellés (jetons d'armure et de catégorie d'arme) : `proficiencyEffectLabel` et les tables de `shared/utils/item.ts` ;
langues : `languageLabel` (`shared/rules/languages.ts`, libellés AideDD), qui affiche tel quel un ancien ajout
manuel stocké par son libellé.
**API overrides :** `GET/PUT/DELETE /api/character_sheets/{id}/proficiency-overrides`

---

## Colonne centrale

### Statistiques (`QuickStatsSection`)

Bandeau horizontal compact avec 6 StatCards :
- **CA** : computed depuis armure équipée (ou, sans armure de corps, la meilleure CA sans armure : `10 + DEX` ou un effet `unarmored_defense` — Barbare, Moine, Résistance draconique, `shared/rules/armorClass.ts`) + modificateur DEX + bouclier + `magicBonus` de l'armure/du bouclier + le style de combat **Défense** (+1 avec une armure de corps) + les effets `armor_class_bonus` (signés) des capacités, des objets actifs et des effets temporaires actifs (`shared/rules/effectBonuses.ts`). Le détail au survol nomme chaque source (« + Anneau de protection +1 »)
- **Initiative** : modificateur DEX + effets `initiative_bonus` (dons, objets actifs, effets temporaires) (clic → lancer le dé)
- **Vitesse** : vitesse de base de l'espèce (ou de la lignée) + effets `speed_bonus` (Déplacement rapide / sans armure, don Mobile, objets) − 3 m si l'armure lourde exige plus de Force que le personnage n'en a (sauf effet `equipment_penalty` du Nain), puis conditions (entrave, paralysie, épuisement…) ; en mètres, le détail et les cases au survol (`shared/rules/speed.ts`). Les vitesses de vol, de nage, d'escalade et de creusement (`flying_speed`, `swimming_speed`, `climbing_speed`, `burrowing_speed`) s'affichent dessous, sans s'additionner ni subir les bonus
- **Perception passive** : 10 + modificateur Perception
- **Maîtrise** : bonus de maîtrise purement computed depuis le niveau total
- **Inspiration** : toggle `character_sheets.inspiration` (v-model → deep watch)

**Persistence :** Inspiration via deep watch → PUT. Tout le reste est computed, non stocké.

### Mode Combat (`CombatModeSection`) *(affiché uniquement si `combatMode` actif)*

Section de gestion du tour de combat :
- **Économie d'action** : boutons Action / Bonus / Réaction (toggle barré/disponible), reset à chaque nouveau tour
- **Déplacement** : jauge de progression, boutons +1,5m / −1,5m / reset, affichage mètres restants
- **Actions disponibles** : armes équipées (boutons Attaque + Dégâts), aptitudes de classe avec type d'action, sorts préparés
- **Attaques par action** : badge « N attaques par action Attaquer » (effet `extra_attack`, maximum entre classes)
- **Dés supplémentaires** : un bouton par arme concernée (Attaque sournoise 3d6 sur une arme à finesse ou à distance, Châtiment divin amélioré 1d8 en mêlée), jetés à part
- **Rage** : le bouton « Activer » dépense une utilisation ; le bonus de dégâts s'ajoute aux armes de mêlée maniées avec la Force (suspendu en armure lourde)
- **Châtiment divin** : un bouton par niveau d'emplacement disponible (dés selon le niveau, case mort-vivant / fiélon), l'emplacement est dépensé au jet

État local (non persisté), remis à zéro via "Nouveau tour".

> Les stats détaillées des armes (attaque, dégâts, propriétés, warnings, toggle "à 2 mains" pour versatile, bouton main secondaire pour les armes légères) sont affichées dans `InventorySection` (onglet Armes). `CombatModeSection` reprend les boutons d'action en compact pour le tour en cours.

### Ressources de classe (`ClassResourcesSection`) *(affichée si le personnage porte une réserve)*

Une carte par réserve (`resourceGroups`) : ki, points de sorcellerie, Rage, Inspiration bardique, Conduit divin,
Forme sauvage, Imposition des mains. Réserve par paquets (`meta.pool`) : « restant / maximum », quantité, Dépenser /
Regagner ; sinon pastilles. Badge de recharge (court dès le niveau 5 pour l'Inspiration bardique), dé de la réserve, DD de
ki. Rage : bouton Activer / Mettre fin. Points de sorcellerie : coûts de la Métamagie choisie (niveau du sort pour le
Sort jumeau), conversion emplacement → points, création d'un emplacement (niveau 5 au plus, disparaît au repos long).
Forme sauvage : FP maximum, vol, nage, durée.

**Source :** `resourceGroups` et `classTraits` (`useCharacterSheet`), dérivés par `shared/rules/classResources.ts`
([`rules-engine.md`](./rules-engine.md#ressources-de-classe)).
**Persistence :** `PUT /api/character_sheets/{id}/features` (`currentUses`, `active`), file hors-ligne, valeurs absolues ;
emplacements créés via `PUT …/spell-slots` (`created`). Les capacités qui portent une réserve n'affichent plus de compteur dans « Capacités ».

### Capacités (`FeaturesSection`)

Liste **toutes** les aptitudes du personnage — traits d'espèce, aptitudes de classe et de
sous-classe, dons, manifestations occultes — avec compteur d'utilisations, filtre par origine
(badge coloré par type) et ajout d'un don (`AddFeatSlideover`). Badge dans le titre = nombre
d'aptitudes encore disponibles (utilisations restantes).

**Source :** `allCharacterFeatures` (`useCharacterSheet`), assemblé depuis
`character_sheets.features` + `species.speciesFeatures` (chargés dans le GET principal).
**Persistence des utilisations :** `PUT /api/character_sheets/{id}/features` (via deep watch).

**Tables à lancer :** une capacité qui renvoie à une table (`features.roll_table_id` — Pic de magie
sauvage, Marée du chaos, Chaos contrôlé) affiche un bouton « Table ». Il ouvre `RollTableSlideover`, qui
charge la table via `GET /api/catalog/roll-tables/{id}` (cache edge + service worker, donc consultable
hors-ligne une fois ouverte). `RollTablePanel` lance le dé et surligne les deux derniers jets (Chaos
contrôlé fait lancer deux fois puis choisir) ; ces jets ne sont pas persistés.

### Magie (`MagicSection`)

Section unifiée : stats d'incantation + liste des sorts.

#### Stats d'incantation
- Caractéristique d'incantation (celle de la sous-classe, sinon de la classe ; en multiclasse lanceur, une liste « Lance comme » choisit la classe affichée)
- DD de sauvegarde : 8 + bonus de maîtrise + modificateur
- Bonus d'attaque avec un sort : bonus de maîtrise + modificateur
- Sorts préparés : « n / limite » pour un lanceur qui prépare (Clerc, Druide, Magicien : mod + niveau ; Paladin : mod + niveau/2). Non bloquant :
  un dépassement est signalé. Les sorts mineurs, les sorts toujours préparés et ceux d'une autre source n'y comptent pas.

#### Liste des sorts
Sorts groupés par niveau. Chaque ligne affiche : nom, temps d'incantation, portée, durée, DC (si applicable), concentration, rituel, composantes V/S/M, dégâts/soins calculés avec le vrai modificateur du personnage.

Cliquer une ligne l'ouvre en accordéon (`UCollapsible`, composant `SpellDetails`, le même corps que `SpellCard`) : composante matérielle, encart de faits (`SpellFacts` : type d'attaque et bonus, JdS et DD, zone, composante chiffrée ou consommée, concentration, rituel), dégâts, soins, montée en puissance et description. La description est en Markdown léger (paragraphes, puces, gras), rendu par `LightMarkdown` sans `v-html` ([D24](./decisions.md#d24)). Un sort peut renvoyer à une table à lancer (`spells.roll_table_id`, même mécanisme que les capacités : Confusion, Espièglerie de nathair) : `SpellRollTable` la charge à l'ouverture et l'affiche sous la description avec `RollTablePanel` en variante intégrée (bouton de jet, ou saisie du résultat quand les jets sont désactivés). Le contenu de l'accordéon porte aussi « Lancer » (y compris pour un sort non préparé) et, quand la classe lanceuse en a la capacité, « Lancer en rituel » (`canCastAsRitual`).

Chaque sort est calculé avec la caractéristique de SA classe (`character_spells.class_id`) ; un sort sans classe retombe sur la classe active.
Les sorts de domaine (Clerc), de serment (Paladin) et de cercle (Druide, selon le terrain choisi) s'ajoutent à la liste, marqués
« Toujours préparé » : ils sont dérivés de la sous-classe et du niveau, jamais stockés, et n'ont ni case « Préparé » ni bouton de retrait.

**API :** `GET /api/character_sheets/{id}/spells` (fetch séparé — **non inclus** dans le GET principal) : sorts stockés + sorts toujours préparés (`alwaysPrepared`).

**Filtres :** "Préparés seulement" / "Disponibles seulement" (état local, non persisté).

**Avertissement somatique :** si la condition `incapacitated` est active, les sorts avec composante S sont grisés.

#### Actions
| Action | API |
|---|---|
| Ajouter un sort | `PUT /api/character_sheets/{id}/spells` |
| Supprimer un sort | `DELETE /api/character_sheets/{id}/spells` |
| Toggle "Préparé" | `PUT /api/character_sheets/{id}/spells` (optimiste, revert on error) |
| Lancer (consommer emplacement) | Décrémente `spellSlots` localement → sync DB via debounce |

Badge dans le titre = nombre de sorts préparés.

### Inventaire (`InventorySection`)

Liste tous les objets du personnage avec quantité, état équipé, bonus magique, notes. Intègre `CurrencySection` (pièces pp/po/pe/pa/pc, source : `character_sheets.*`, persistence : deep watch → PUT).

**API :** `GET /api/character_sheets/{id}/inventory` (fetch séparé, indépendant du deep watch).
**Ajout :** `AddItemSlideover` → `POST /api/character_sheets/{id}/inventory`
**Équiper/déséquiper :** `PUT /api/character_sheets/{id}/inventory/{entryId}`
**Supprimer :** `DELETE /api/character_sheets/{id}/inventory/{entryId}`

Les effets des objets **actifs** — équipés, et **liés** quand l'objet exige un lien (`requiresAttunement`) — (`item_effects` → `effects`, exposés par le GET inventaire) sont injectés dans `allEffects` et dans le calcul des caractéristiques ; ils modifient résistances/immunités/vulnérabilités, DD/attaque de sort, scores de caractéristique, CA, jets de sauvegarde, initiative et scores passifs. ⚠️ L'éditeur d'objet propose encore des types que la fiche ne lit pas depuis un objet (vitesse, vision dans le noir, maîtrises d'arme/armure, PV par niveau, dégâts supplémentaires). La limite de 3 objets liés reste un avertissement non bloquant (cf. O1, [#158](https://github.com/kevmorpain/le-bureau-du-jdr/issues/158)).

### Identité (`IdentitySection`)

**Tout le descriptif du personnage dans une seule section collapsible**, en bas de la colonne
centrale, dans cet ordre :

1. **Identité** — nom, badge d'alignement, nom du joueur, bouton d'édition
2. **Apparence** — âge, taille, poids, yeux, cheveux, peau, divinité + catégorie de taille de l'espèce
3. **Historique** + **Personnalité** — rendus par `BackgroundSection` (cf. plus bas)
4. **Histoire** puis **Alliés & organisations** — affichés seulement s'ils sont renseignés

Le **portrait n'est pas rendu ici** : il vit dans l'en-tête de la fiche. Il s'ajoute depuis le
slideover d'identité, de deux façons au choix — **téléverser** une image (réduite dans le navigateur,
stockée dans R2, cf. [persistence.md](persistence.md) §3) ou **coller un lien** externe. L'URL n'est
retenue que si elle est en `http(s)` ou relative au site.

**Source :** colonnes texte de `character_sheets` (`age`, `height`, `weight`, `eyes`, `hair`, `skin`,
`deity`, `backstory`, `allies`, `portraitUrl`, `name`, `alignment`) via `useCharacterIdentity`. Le
**nom du joueur** n'a pas de colonne : c'est `owner.name`, chargé par le GET depuis `users` (réduit à
`{ id, name }`). La **catégorie de taille** vient de `character_species.size`
(`shared/rules/creatureSize.ts`), l'**alignement** de `shared/rules/alignments.ts`.
**Persistence :** `sheetTextField` → deep watch → PUT (cf. [persistence.md](persistence.md)).
**Édition :** `EditIdentitySlideover` (crayon en haut) — auto-save, pas de bouton « Enregistrer ».
Le **renommage** du personnage se fait là (un nom vide n'est jamais persisté :
`updateCharacterSheetSchema` l'interdit).

Ces champs sont aussi saisissables à la création (étape Description, bloc « Apparence & histoire »).

#### Historique & personnalité (`BackgroundSection`)

Monté **dans** `IdentitySection` — l'historique et les traits qu'il inspire décrivent le personnage
au même titre que son apparence, et la fiche officielle les regroupe pareillement. Il garde son
**propre bouton d'édition** (`EditBackgroundSection`) : ce slideover touche aux maîtrises (resync
serveur via `PUT /api/character_sheets/{id}/background`), contrairement à celui de l'identité qui
n'écrit que des colonnes texte.

Affiche l'historique sélectionné (nom, maîtrises de compétences, description, capacité via accordion)
puis les quatre champs libres de personnalité (traits, idéaux, liens, défauts — éditables en place,
via `useCharacterBackground`). La description couvre aussi les historiques personnalisés, dont le
texte saisi dans `EditBackgroundSection` n'était jusqu'ici jamais réaffiché.

Les traits d'**espèce** (Vision dans le noir, Résistance draconique…) ne sont **pas** ici : ils sont
listés avec les autres aptitudes dans `FeaturesSection`, badgés « espèce ».

**Source :** `character_sheets.background` + champs libres dans `useCharacterBackground`.

---

## Colonne droite

### PV (`HitPointsSection`)

PV actuels / PV max / PV temporaires. Le maximum affiché est **dérivé** (`fullMaxHp` : `hpBase` + (mod CON + bonus par niveau) × niveau) ; l'épuisement 4 le divise par deux (`effectiveMaxHp`, plafond des soins). Soins et dégâts passent par `shared/rules/damage.ts` : les PV temporaires absorbent d'abord, des dégâts à 0 PV valent un échec aux jets contre la mort (deux sur un coup critique, case affichée à 0 PV), les dégâts restants qui atteignent le maximum tuent sur le coup, un soin remet les jets à zéro. Tomber à 0 PV rompt la concentration ; sinon un jet de Constitution est proposé (DD = max(10, ½ dégâts)).
**Source :** `character_sheets.{currentHp, hpBase, temporaryHp}` (voir [D19](decisions.md#d19)).
**Persistence :** deep watch. « Édition directe » du maximum : on saisit le total affiché, la fiche stocke `hpBase`.

### Jets de mort (`DeathSavingThrowSection`)

Jets de sauvegarde contre la mort (succès/échecs), visibles à 0 PV ou si le personnage est mort (trois échecs, mort instantanée, ou épuisement de niveau 6). 20 naturel : 1 PV et jets remis à zéro ; 1 naturel : deux échecs ; trois succès : stable. Le repos long et le soin par dés de vie les remettent à zéro.
**Source :** `character_sheets.{deathSaveSuccesses, deathSaveFailures}` (lus et écrits par `useCharacterVitals`).

### Dés de vie (`HitDiceSection`)

Dés de vie restants par classe, utilisation pendant un repos court.
**Source :** `character_sheets.currentHitDie` (JSON, `[{ die: '10', count }]` — les côtés, pas « 1d10 »).
**Persistence :** deep watch → PUT (la clé doit figurer dans `updateCharacterSheetSchema`). Le repos long
rend la moitié des dés (`recoverHitDice`, `shared/rules/hitDice.ts`, partagé client/serveur).

### Résistances & Défenses (`DefensesSection`)

Résistances, immunités, vulnérabilités calculées depuis `allEffects`. Visible uniquement si au moins une entrée. Affiche aussi le sélecteur d'ascendance draconique si la feature `hasDraconicAncestry` est active.

**Source :** `allEffects` (effets d'espèce + classe + inventaire).

### Conditions (`StatusSection`)

Conditions actives et niveau d'épuisement. Toggle de chaque condition. *(L'alignement est
affiché et modifié dans la section Identité, pas ici.)*
**Source :** conditions via `useStorage()` (localStorage).

### Effets temporaires (`TemporaryEffectsSection`)

Bénédiction, malédiction, sort reçu : effets nommés saisis par le joueur, chacun activable/désactivable
(interrupteur) sans être supprimé. Ils passent par le **même canal que les objets actifs**
(`activeEffectSources`) : CA, JS, scores, résistances, DD/attaque de sort, initiative. L'éditeur est
`MagicEffectEditor`, restreint aux types que la fiche applique (`TEMPORARY_EFFECT_TYPES`). Une
**description** libre, facultative, porte ce que la fiche ne sait pas chiffrer (« ne peut répondre que par
oui ou par non », la Bénédiction du sort qui est un d4) ; une entrée peut n'avoir qu'elle.

Affichage : une pastille par effet (`effectLabel`), **rouge** pour un malus (montant négatif ou
vulnérabilité, `isEffectMalus` — même règle pour les pastilles d'objets de l'inventaire), grise et ligne
estompée quand l'effet est désactivé.

**Source :** `character_sheets.temporary_effects` (JSON `{ id, name, description?, active, effects }[]`).
**Persistence :** mutation en place → deep watch → PUT ; validé par `temporaryEffectsSchema`
(`shared/utils/temporary_effects.ts`), le même schéma que la modale applique avant d'écrire — une entrée
invalide ferait sinon échouer toute la sauvegarde de la fiche. Pas de durée ni d'expiration (cf. U6).

### Emplacements de sort (`SpellSlotsSection`)

Bulles interactives par niveau de sort. Visible uniquement si le personnage a des emplacements.

**Source :** `inject('spellSlots')` — injecté depuis `[id].vue` via `provide('spellSlots', spellSlots)`.
Affiche aussi DD de sauvegarde et bonus d'attaque de sort.
**Sync DB :** debounce 500 ms via `useCharacterSpellcasting`.

### Concentration (`ConcentrationSection`)

Toujours affichée. Se concentrer sur un sort du catalogue (pastilles des sorts à concentration de la fiche) ou sur **autre chose** (libellé libre : effet de monstre, sort hors catalogue, homebrew) ; rompre. La concentration s'arrête d'elle-même à 0 PV, quand un état rend incapable d'agir (`incapacitating` dans `conditionMechanics`) et au lancement d'un autre sort à concentration (message qui nomme celui qu'on perd).

**Source :** `character_sheets.{concentratingSpellId, concentratingOn}`.

### Notes de session (`QuickNotesSection`)

Zone de texte libre pour notes rapides (PNJ rencontrés, rappels…), liée au personnage.
**Source :** colonne `notes` sur `character_sheets` (computed get/set via `useCharacterSheet`, auto-save par le deep watch de `[id].vue`).

---

## Patterns clés

**Auto-save :** Le deep watch sur `characterSheet` (debounce 1 s) persiste via `PUT /api/character_sheets/{id}`. Ne couvre **pas** l'inventaire, les sorts ni les emplacements — ces domaines ont leurs propres endpoints et composables.

**`spellSlots` (provide/inject) :** `[id].vue` fournit `spellSlots` via `provide('spellSlots', spellSlots)`. `SpellSlotsSection` l'injecte pour afficher et modifier les emplacements sans passer par tout l'arbre de props.

**`spellContext` (provide/inject) :** `MagicSection` fournit `{ characterLevel, spellcastingModifier }` via `provide('spellContext', ...)`. `DamageSection` et `HealSection` l'injectent pour éviter d'instancier tout l'arbre `useCharacterSheet` depuis un composant leaf.

**Montée en puissance des sorts :** la résolution « quelle valeur à quel niveau » (tables `damage_at_*`, `heal_at_*`, `count_at_*`) vit dans le module pur [`shared/rules/spellScaling.ts`](../shared/rules/spellScaling.ts) — source unique du **jet** (`rollSpellEffect`) comme de l'**affichage** (`CharacterSpellRow`, `DamageSection`, `HealSection`, `SpellCardBuilder`). Les sections affichent le niveau de **base** ; la progression complète est rendue par `UpcastSection` (encart « Aux niveaux supérieurs » de `SpellCard`) et, au moment de choisir un niveau, par les deux modales qui annoncent le résultat de chacun : `CastSpellModal` (l'emplacement qu'on dépense) et `RollDamageModal` (le niveau auquel on jette les dégâts d'un sort d'attaque, sans rien dépenser). Leur libellé commun vient de `useSpellEffectPreview`.

**`useFetch` et réactivité :** `useFetch` retourne un `shallowRef`. Pour déclencher la réactivité sur une mise à jour d'élément dans un tableau, toujours réassigner `data.value` entier (ex. `.map(...)`) — ne pas muter un élément en place.

**Fetch null-guard :** Tous les `useFetch` dans les composables de personnage retournent `null` comme URL si `characterId` est `undefined`, pour éviter des requêtes parasites quand `useCharacterSheet()` est appelé sans argument (ex. depuis la page spellbook).

**`CollapsibleSection` :** Enveloppe les sections de la colonne centrale. L'état ouvert/fermé est persisté en localStorage via `storage-key`.

---

## Ce qui est dans la DB mais pas encore dans l'UI

| Champ | Table | Statut |
|---|---|---|
| Points d'expérience | — | Pas dans le schéma (la montée de niveau est manuelle) |

Y étaient et n'y sont plus : `alignment`, `character_species.size`, `backgrounds.description` et la
sous-classe, tous branchés sur l'UI (section Identité, en-tête, historique).
