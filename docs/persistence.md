# Persistence des données

## Matrice : DB vs localStorage vs computed

| Donnée | Stockage | Raison |
|---|---|---|
| `exhaustionLevel` | DB (`character_sheets`) | Persistance cross-session |
| `dragonbornAncestry` | DB (`character_sheets`) | Persistance cross-session |
| `spellcastingAbility` | DB (`character_classes`) | Dérivé de la classe, voir [architecture.md](architecture.md) |
| `spellSlots` | DB (`character_spell_slots`) | Persistance cross-session |
| `armorClass` | localStorage | Dépend du futur système d'équipement |
| `activeConditions` | localStorage | État d'encounter, remis à zéro entre sessions |
| `deathSavingThrows` | localStorage | État d'encounter, remis à zéro entre sessions |
| Modificateurs de caractéristique | computed | Dérivés des scores, jamais stockés |
| Bonus de maîtrise | computed | Dérivé du niveau, jamais stocké |
| DD de sort, modificateur d'attaque | computed | Dérivés, jamais stockés |

---

## Patterns de persistence

### 1. Colonnes sur `character_sheets` — computed get/set

Pour les données simples liées à un personnage :

```ts
const exhaustionLevel = computed({
  get: () => characterSheet?.value?.exhaustionLevel ?? 0,
  set: (v: number) => { if (characterSheet?.value) characterSheet.value.exhaustionLevel = v },
})
```

Le deep watch dans `app/pages/characters/[id].vue` (debounce 1000ms) appelle `PUT /api/character_sheets/{id}` et persiste automatiquement toute mutation sur `characterSheet.value`.

Pour exposer un nouveau champ via ce pattern :
1. Ajouter la colonne dans `server/db/schema/character_sheets.ts`
2. Ajouter le champ dans `updateCharacterSheetSchema` (`shared/utils/character_sheet.ts`)
3. Remplacer le `useStorage` par un `computed({ get, set })` dans le composable

### 2. Tables dédiées — watcher dédié

Pour les données avec leur propre table (ex. `character_spell_slots`) :

```ts
// Init depuis DB via watchEffect
watchEffect(() => {
  const dbSlots = characterSheet?.value?.spellSlots ?? []
  for (const slot of dbSlots) {
    spellSlots.value[slot.slotLevel] = { max: slot.total, current: slot.total - slot.used }
  }
})

// Sync vers DB via watcher dédié (debounce 500ms)
let syncTimeout: ReturnType<typeof setTimeout> | null = null
watch(spellSlots, () => {
  if (!characterSheet?.value?.id) return
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    await $fetch(`/api/character_sheets/${characterSheet!.value!.id}/spell-slots`, {
      method: 'PUT',
      body: [ ... ],
    })
  }, 500)
}, { deep: true })
```

Ne pas utiliser le deep watch de `[id].vue` pour ces données — elles ont leur propre endpoint.

### 3. `useStorage` (localStorage) — intentionnel

Réservé aux données d'encounter ou liées à une session :

```ts
const activeConditions = useStorage<ConditionKey[]>(storageKey('activeConditions'), [])
```

La clé est scopée par personnage via `characterStorageKey(characterSheet?.value?.id, suffix)` (`app/utils/storage.ts`).

---

## Auto-save dans `[id].vue`

```ts
watch(characterSheet, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(updateCharacterSheet, 1000)
}, { deep: true })
```

Toute mutation sur `characterSheet.value` (y compris les sous-objets) déclenche un PUT après 1 seconde d'inactivité. C'est le mécanisme central de persistance pour les données de la table `character_sheets` et ses relations directes (`classes`, etc.).
