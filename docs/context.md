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
- `QuickNotesSection.vue` — textarea localStorage

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
- `character_spell_slots.slotType` : `'spellcasting' | 'pact_magic'` pour supporter la Magie de Pacte occultiste
- `defenseEntries` dans `useCharacterConditions` — clés `dmg:*` et `cond:*` et `jds:*`
