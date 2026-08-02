# Audit de complétude des parcours — bugs 2014 non tracés

> Registre **parallèle** à la roadmap ([`dnd-5.5.md`](./dnd-5.5.md)). La Phase 1 est un refactor
> **iso-comportement** (contrat d'équivalence, [D12](./decisions.md#d12)/[D13](./decisions.md#d13)) :
> elle **préserve** le comportement 2014 existant, **bugs compris**. Les tests d'équivalence
> affirment « identique à avant » — ils **reconduisent donc silencieusement** tout bug préexistant.
> Les audits déjà faits (aidedd, [`architecture-audit.md`](./architecture-audit.md)) portaient sur
> la **fidélité des données/nommage**, pas sur la **complétude des parcours** (création à haut
> niveau, level-up multi-paliers). Ce fichier trace cette classe d'angle mort et les bugs qu'elle
> recèle. **Ces correctifs ne relèvent NI de la Phase 1 (iso-comportement) NI de la Phase 2
> (contenu 5.5)** : ce sont des chantiers de correction 2014 à part entière.

## Classe de risque

« Choix qui se **répètent par palier de niveau**, où la CRÉATION à un niveau élevé doit
configurer **plusieurs** instances (ou refléter les instances déjà appliquées), mais le flux a
été écrit en supposant une seule instance / le palier exact. » Invisible aux tests d'équivalence
(qui figent le comportement) **et** aux audits de contenu (qui vérifient les données). Seul un
test **fonctionnel** les révèle.

## Bugs identifiés

### B1 — Arcanums mystiques non cumulatifs (Occultiste) · front + serveur
- **Symptôme** : créer un occultiste à un niveau ≠ 11/13/15/17 (12, 14, 15–20…) n'affiche aucun
  sélecteur d'arcanum ; à un niveau de palier, un seul arcanum, jamais les précédents (à 13, pas
  d'accès à l'arcanum niv. 6 débloqué à 11). La fiche, elle, supporte les 4 (`arcanum_6/7/8/9`).
- **Racine front** : `BuilderState.arcaneMysteriumSpellId: number | null` (**singulier**) + un seul
  sélecteur affiché pour l'arcanum du niveau EXACT (`app/composables/useCharacterBuilder.ts`,
  `app/components/character_builder/StepSpells.vue`).
- **Racine serveur** : `server/utils/characterCreate.ts` n'accepte qu'un `arcaneMysteriumSpellId`
  et mappe la source via `ARCANUM_LEVEL_TO_SOURCE[<niveau du perso>]` → `undefined` hors
  11/13/15/17 (rien stocké). Idem `characterLevelUp.ts`.
- **Fix** : state → multi (Record/array par niveau d'arcanum) ; UI builder → **boucle sur les
  points de choix `spell` DUS** (déjà exposés par `resolveChoices` depuis le lot 6b) ; submit →
  tableau ; serveur → accepter/valider/écrire N arcanums, source mappée par le niveau de
  l'**arcanum** (pas du perso). Le level-up reste 1-par-montée (naturel).
- Découvert : vérif visuelle du lot 6b (2026-08-02). **NON régressé par 6b** (préservé à l'identique).

### B2 — Base d'ASI non cumulative entre paliers (création) · front (affichage)
- **Symptôme** : avec ≥2 paliers d'ASI à la création (ex. niv. 4 et 8), chaque palier affiche la
  base de CRÉATION comme « avant », sans refléter les ASI des paliers précédents. Ex. CHA 15,
  +2 au niv. 4 (affiche 15→17), puis niv. 8 affiche encore « 15 » au lieu de 17.
- **Racine** : `app/components/character_builder/StepAsi.vue` `baseScore(ab)` (l.214) renvoie
  `abilities[ab] + raceBonuses[ab]` (base de création), utilisé comme « avant » de **chaque**
  palier. Le cap à 20 (`finalAfterAsi`, l.232) est, lui, cumulatif-correct → **le score final est
  bon** ; seul l'**affichage intermédiaire** par palier est trompeur.
- **Fix** : chaque palier affiche le **total final** — `base (+ASI des autres paliers) +ce palier → total`
  — la contribution du palier courant restant distincte (`otherAsiBonus()` + `finalAfterAsi()`).
- Découvert : signalé par l'utilisateur (2026-08-02). **✅ RÉSOLU**.

### B3 — Coup agonisant : mod de CHA recalculé sans le bonus d'espèce · front (calcul)
- **Symptôme** : Décharge occulte avec Coup agonisant applique **+CHA de base+ASI** aux dégâts, en
  omettant le bonus d'**espèce**. Ex. niv. 12, CHA 20 (via espèce +2) : to-hit **+9** et DD **17**
  (corrects, mod +5) mais dégâts par rayon **+4** au lieu de +5.
- **Racine** : `app/components/character_sheet/MagicSection.vue` `charismaModifier` (l.721) reconstruit
  le mod à la main = `floor((baseAbilityScores.cha + Σ ASI − 10) / 2)` → **omet les bonus d'espèce et
  d'effets**. Le to-hit/DD, eux, utilisent le mod **canonique** `abilityModifiers['cha']`.
- **Fix** : utiliser le mod canonique (`abilityModifiers.cha`). **✅ RÉSOLU.**
- Découvert : vérif visuelle 6b (2026-08-02, utilisateur).

### Note (design, hors parcours) — pas de jet d20 « pour toucher » pour les sorts
Lancer un sort (`MagicSection.rollSpellEffect`) ne jette que **dégâts / soins** ; **aucun jet
d20 + bonus d'attaque** n'existe pour les attaques de sort (le « Bonus d'attaque » de l'en-tête est
un affichage). Manque de *feature* plus large que la classe « complétude de parcours » — à trancher
à part.

## Suspects à vérifier (audit non encore fait)
- Level-up en **multiclasse** (flux de choix, résolution d'IDs de classe).
- Invocations **échangeables** (`replaceable`) au level-up.
- Choix accordés par une **sous-classe** à plusieurs niveaux.
- Complétude des **sorts / cantrips connus** à la création d'un caster de haut niveau.

## Protocole d'audit proposé (~30 min)
Pour **chaque** classe : créer un perso **niveau 20**, dérouler le wizard, cocher que **chaque**
choix par palier (ASI, dons, sous-classe, invocations, arcanums, style de combat, expertise,
métamagie, manœuvres, sorts connus) est **configurable** ET **affiché cumulativement**. Puis un
**level-up** de chaque type (palier de sous-classe, ASI, invocation, arcanum, multiclasse).
