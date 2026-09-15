# Contexte de développement

Ce fichier centralise le contexte accumulé sur le projet pour les sessions Claude (Code et Cowork).

---

## Fiche personnage v2 — Dashboard 3 colonnes

La page `app/pages/characters/[id].vue` a été refondée en layout 3 colonnes. Ne pas revenir à l'ancien `UPageHeader`/`UPageBody`.

```
grid-template-columns: 240px 1fr 240px; gap: 12px; padding: 16px 20px
```

### Nouveaux composants

- `useDiceRoller.ts` — `roll(label, mod, sides?, count?)` partagé via `useState('dice-toasts')`
- `DiceRollerSection.vue` — toasts fixes bottom-right (Teleport to body)
- `CollapsibleSection.vue` — wrapper avec état localStorage
- `ActionTypeIcon.vue` — formes CSS (cercle/triangle/losange) + UTooltip
- `DashboardHeaderSection.vue` — header sticky `top-16` (sous UHeader), conditions actives, repos, toggle combat
- `QuickStatsSection.vue` — CA/Initiative/Vitesse/Perc/Maîtrise/Inspiration (defineModel)
- `StatCard.vue` — carte stat réutilisable en Tailwind pur (pas de scoped CSS)
- `DefensesSection.vue` — résistances/immunités/vulnérabilités extraites de StatusSection
- `SpellSlotsSection.vue` — dots violets par niveau, injecte `spellSlots` via provide/inject
- `ConcentrationSection.vue` — condition 'concentrating', nom du sort en localStorage
- `CombatModeSection.vue` — économie d'action + déplacement (+/-1,5m) + actions disponibles
- `QuickNotesSection.vue` — textarea, persisté en DB (colonne `character_sheets.notes`)
- `IdentitySection.vue` + `EditIdentitySlideover.vue` — identité & description (nom, alignement,
  apparence, histoire, alliés), colonnes texte de `character_sheets`. **Englobe `BackgroundSection`**
  (historique + traits de personnalité) : une seule section pour tout le descriptif, en bas de la
  colonne centrale. Le portrait, lui, n'est rendu que dans `DashboardHeaderSection`.

### Composants supprimés avec le dashboard v2

Le layout 3 colonnes a remplacé neuf sections « une stat par carte » par `QuickStatsSection` et
`DashboardHeaderSection`, mais les fichiers étaient restés dans l'arbre sans plus aucune référence :
`ArmorClassSection`, `CharacterNameSection`, `ClassesSection`, `InitiativeSection`,
`InspirationSection`, `LevelSection`, `PassivePerceptionSection`, `ProficiencyBonusSection`,
`SpeedSection` (+ l'asset `app/assets/ac_background.svg`, utilisé par le seul `ArmorClassSection`).
Supprimés — ne pas les recréer : ajouter la stat à `QuickStatsSection`.

### Patterns clés

- `roll` instancié dans `[id].vue` via `useDiceRoller()`, passé en prop optionnel
- `spellSlots` créé une seule fois dans `[id].vue`, partagé via `provide('spellSlots', spellSlots)` — `MagicSection` et `SpellSlotsSection` l'injectent (sinon deux instances indépendantes)
- Activation combat → `roll('Initiative', initiativeBonus.value)` auto
- `DeathSavingThrowSection` émet `@recover` pour que `[id].vue` mette à jour `currentHp`
- Check concentration : dans `HitPointsSection` lors de dégâts reçus si condition 'concentrating' active

### Conventions UI dots (emplacements, épuisement, capacités)

- Plein = utilisé/actif, vide = disponible
- Style : `bg-{color}/60 border-{color} hover:bg-{color}/80`
- Emplacements de sort : `n <= max - current` = plein ; toggle : `i <= used ? max - (i-1) : max - i`
- Épuisement : `n <= exhaustionLevel` = plein

### Corrections importantes

- `defenseEntries` : clés préfixées `dmg:` (ex. `dmg:fire`, `dmg:all`) — `HitPointsSection.activeDefense` cherche `dmg:${damageType}` puis fallback `dmg:all`
- `hitDie` retourne déjà le format `dX` (ex. `d8`) — ne pas ajouter de `d` devant
- Caractéristique d'incantation : lecture seule (dépend de la classe), plus de dropdown

### Personnage de test

**Ambroise** — personnage utilisé pour tester la fiche (seed `character_sheets.ts`).
- Espèce : Nain des collines
- Classe : Occultiste niveau 10, sous-classe Grand Ancien, Pacte du Grimoire
- Stats : FOR 12 / DEX 14 / CON 13 / INT 13 / SAG 15 / CHA 9
- Maîtrises JS : Sagesse + Charisme
- Dé de vie : d8

---

## Réactivité — useFetch shallowRef

`useFetch` retourne `data` comme `shallowRef`. Les mutations profondes ne déclenchent pas la réactivité.

```typescript
// ❌ Ne fonctionne pas
data.value[idx].isPrepared = true

// ✅ Fonctionne
data.value = data.value.map(item =>
  item.id === id ? { ...item, isPrepared: true } : item
)
```

---

## Décisions d'architecture serveur

- **PUT** (pas PATCH) pour l'auto-save fiche — PATCH n'apporte rien avec des sous-tableaux
- Auto-save : debounce 500ms + PUT `/api/character_sheets/:id`
- `character_spell_slots.slotType` : `'spellcasting' | 'pact_magic'` pour supporter la Magie de Pacte occultiste. **Particularité Pact Magic** : tous les emplacements de pacte sont toujours du même niveau, et ce niveau augmente avec le niveau d'occultiste (1→1, 3→2, 5→3, 7→4, 9+→5). Le handler `level-up.post.ts` DELETE explicitement les anciens `pact_magic` slots aux autres niveaux avant l'upsert, sinon ils s'accumulent.
- `defenseEntries` dans `useCharacterConditions` — clés `dmg:*` et `cond:*` et `jds:*`

## Manifestations occultes (Eldritch Invocations)

- Modélisées comme `features` avec `featureType: 'eldritch_invocation'` (et non une table dédiée), liées à la classe Occultiste via `classId`. Catalogue de 33 entrées (PHB 2014 + TCoE).
- Colonne `features.prerequisites` (JSON) : `{ requiredPactBoon?, requiredSpellName?, requiredInvocationName? }`.
- `character_spells.source` étendu avec `'invocation'` — les `spell_grant` des invocations sont matérialisés en `character_spells` à l'apprentissage, supprimés au remplacement.
- Persistance partagée : [server/utils/invocations.ts](../server/utils/invocations.ts) (`applyInvocationChanges`) utilisé par création + level-up.
- 3 nouveaux types d'effets : `eldritch_blast_modifier` (agonizing/repelling/range_extended), `pact_weapon_modifier` (extra_attack/lifedrinker), `sight_modifier` (magical_darkness_120/invisible_in_dim_light/true_sight_disguise/read_all_writing).
- UI : composant partagé [InvocationPicker.vue](../app/components/warlock/InvocationPicker.vue) utilisé dans `StepClass.vue` (création) et `LevelUpStepFeatures.vue` (level-up, avec flow de remplacement).

---

## PWA — reprise après changement d'application

**Symptôme** : sur tablette, en PWA installée, passer sur Chrome/Discord puis revenir au Bureau du JDR ramène à l'accueil au lieu de la fiche consultée.

**Cause** : ce n'est pas un bug de routing. Une PWA en mode standalone est un processus ordinaire ; quand la mémoire manque, l'OS le tue en arrière-plan. Au retour, il n'y a plus de page à réveiller : le système relance l'app **à froid** sur le `start_url` du manifeste, c'est-à-dire `/`. Aucune API web ne permet d'empêcher cette éviction (`start_url` est statique, la Page Lifecycle API notifie mais ne retient rien).

**Correctif** : mémoriser la dernière route et y revenir soi-même.

| Fichier | Rôle |
|---|---|
| [app/utils/lastRoute.ts](../app/utils/lastRoute.ts) | Logique pure + accès localStorage (clé `bjdr:last-route`), TTL 24 h |
| [app/plugins/last-route.client.ts](../app/plugins/last-route.client.ts) | `router.afterEach` + `visibilitychange` → écrit la route |
| [app/middleware/restore-route.global.ts](../app/middleware/restore-route.global.ts) | Au démarrage à froid sur `/`, redirige vers la route mémorisée |

Garde-fous :
- **PWA installée uniquement** (`display-mode: standalone` / `navigator.standalone`) — dans un onglet, le navigateur restaure déjà la page, et on éviterait de polluer la mémoire partagée entre les deux contextes (même origine).
- **Premier rendu uniquement** (`useNuxtApp().isHydrating`) — un clic sur le logo ne doit jamais être détourné.
- **Aller à l'accueil efface la mémoire** (`routeMemoryAction('/') === 'clear'`), sinon le démarrage suivant ramènerait sur la fiche qu'on venait de quitter. `/login` et `/auth/*` sont transitoires : ni écrits, ni effaçants.
- Cible restreinte aux chemins internes (`//host` rejeté) et périmée au-delà de 24 h.

L'ordre alphabétique des middlewares globaux place `auth.global.ts` avant `restore-route.global.ts` : une route restaurée qui exige une session repasse par la garde d'auth.

---

## Montée en puissance des sorts — une seule résolution (U10)

**Symptôme** : un Projectile magique lancé avec un emplacement de niveau 3 **affichait** `3d4+3`
pendant que le bouton de lancement **jetait** `5d4+5`. L'affiché contredisait le jeté.

**Cause** : la règle « prendre le palier le plus haut atteint dans la table » était réécrite
**quatre fois**, avec quatre comportements :

| Emplacement | Comportement d'origine |
|---|---|
| `MagicSection.rollSpellEffect` | `getSpellDieAt` — appliquait le niveau d'emplacement **choisi** (correct) |
| `DamageSection` / `HealSection` | `slotLevel = ref(spell.level)`, jamais modifié → figé au niveau de base |
| `CharacterSpellRow` | `getClosestDie` — niveau de base, `spell.level || 1` |
| `SpellCardBuilder` | `closestLevelDie` — idem, mais avec un repli sur le **premier** palier |

Trois d'entre eux ne lisaient donc **que la première ligne** de `damage_at_slot_level`.

**Correctif** : un module pur, [`shared/rules/spellScaling.ts`](../shared/rules/spellScaling.ts),
seule source de la résolution — les quatre appelants le consomment. Deux axes y sont explicitement
séparés : `characterLevel` (progressions `*_at_character_level`, les tours de magie) et `slotLevel`
(`*_at_slot_level`, la montée en puissance).

| Fichier | Rôle |
|---|---|
| [shared/rules/spellScaling.ts](../shared/rules/spellScaling.ts) | `resolveAtLevel`, `resolveDamageDie`, `resolveHealDie`, `resolveAttackCount`, `parseDiceNotation`, `diceRange`, `upcastRows` |
| [app/components/spells/UpcastSection.vue](../app/components/spells/UpcastSection.vue) | Encart « Aux niveaux supérieurs » dans `SpellCard` |
| [app/components/character_sheet/CastSpellModal.vue](../app/components/character_sheet/CastSpellModal.vue) | Annonce le résultat de **chaque** emplacement proposé |
| [app/components/character_sheet/RollDamageModal.vue](../app/components/character_sheet/RollDamageModal.vue) | Choix du niveau pour le jet de dégâts, sans dépense d'emplacement |
| [test/unit/spellScaling.test.ts](../test/unit/spellScaling.test.ts) | La règle, en isolation |
| [test/nuxt/spellScalingDisplay.test.ts](../test/nuxt/spellScalingDisplay.test.ts) | Le rendu (premier test de composant du repo — `mountSuspended`) |

À retenir :
- `upcastRows` ne liste que les niveaux où la valeur **change** (Arme spirituelle : 4, 6, 8 — pas 3,
  5, 7, 9), sinon l'encart déroule neuf lignes identiques.
- `parseDiceNotation` accepte le bonus fixe porté par la table (`1d4+4`, `10d6+40`) et la valeur
  plate (`5` d'Aide). Une valeur plate n'est **pas** jetée : il n'y a pas de dé.
- Le seed contract de `test/unit/spellSeedData.test.ts` garde l'invariant qui rend la résolution
  sûre : une table par niveau d'emplacement **commence au niveau du sort**, et chaque valeur est une
  notation exploitable.
- Un sort d'**attaque** jette ses dégâts en deux gestes (« Lancer » pour toucher, puis « Dégâts ») :
  le bouton Dégâts ouvre `RollDamageModal`, qui redemande le niveau — présélectionné sur
  `MagicSection.lastCastLevel` (mémoire de session par `spellId`, non persistée) et affiché sur le
  bouton (« Dégâts (niv. 3) »). Deux modales plutôt qu'un mode : celle-ci **ne dépense aucun
  emplacement** et propose les niveaux **même épuisés** — celui qu'on vient de dépenser est
  justement celui auquel il faut jeter. Sans montée en puissance, pas de modale : on jette.
- `useSpellEffectPreview` porte le libellé « ce que donne le niveau N » (« 5d4+5 force ») pour les
  deux modales : le même choix doit se lire pareil des deux côtés.
- Monter un composant Nuxt UI en isolation demande de bouchonner `UTooltip` (il attend le contexte
  de `<UApp>`).
