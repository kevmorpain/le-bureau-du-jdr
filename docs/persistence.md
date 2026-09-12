# Persistence des données

## Matrice : DB vs localStorage vs computed

| Donnée | Stockage | Raison |
|---|---|---|
| `exhaustionLevel` | DB (`character_sheets`) | Persistance cross-session |
| `dragonbornAncestry` | DB (`character_sheets`) | Persistance cross-session |
| `spellcastingAbility` | DB (`character_classes`) | Dérivé de la classe, voir [architecture.md](architecture.md) |
| `spellSlots` | DB (`character_spell_slots`) | Persistance cross-session |
| `notes` (notes de session) | DB (`character_sheets`) | Persistance cross-device, cross-session |
| Identité & description (`age`, `height`, `weight`, `eyes`, `hair`, `skin`, `deity`, `backstory`, `allies`, `portraitUrl`) | DB (`character_sheets`) | Description du personnage, saisie à la création ou sur la fiche |
| Fichier du portrait | **R2** (bucket `le-bureau-du-jdr-media`, via `hub:blob`) | Binaire : la fiche n'en garde que l'URL |
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

Pour les colonnes **texte**, ne pas réécrire ce computed à la main : utiliser la fabrique
`sheetTextField` (`app/composables/character/sheetField.ts`), qui porte le pattern une seule fois.

```ts
const backstory = sheetTextField(characterSheet, 'backstory')
// garde optionnel : une valeur transformée, ou `null` pour refuser l'écriture
const name = sheetTextField(characterSheet, 'name', v => v.trim() ? v : null)
```

⚠️ La fabrique mute la fiche **en place** (`sheet[key] = v`) au lieu de la remplacer
(`characterSheet.value = { ...characterSheet.value, [key]: v }`). C'est volontaire : les sections
qui reçoivent la fiche par `toRef(props, 'characterSheet')` (props en lecture seule, ex.
`QuickNotesSection`) verraient une réassignation de `.value` silencieusement perdue. Le deep watch
de `[id].vue` se déclenche dans les deux cas.

Pour exposer un nouveau champ via ce pattern :
1. Ajouter la colonne dans `server/db/schema/character_sheets.ts` + une migration
2. Ajouter le champ dans `updateCharacterSheetSchema` (`shared/utils/character_sheet.ts`)
3. Exposer un `sheetTextField(...)` depuis le composable de domaine
4. Si le champ est saisissable à la création : l'ajouter aussi à `createCharacterSchema` et à
   l'insert de `server/utils/characterCreate.ts` (sinon il n'existe que sur la fiche)

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

### 3. Fichiers — R2 (`hub:blob`)

Le seul binaire de l'app aujourd'hui : le **portrait** de personnage.

| | |
|---|---|
| Clé R2 | `portraits/<sheetId>/<uuid>.<ext>` |
| URL servie | `/api/portraits/<sheetId>/<uuid>.<ext>` (same-origin → cachable par le service worker) |
| Écriture | `POST /api/character_sheets/{id}/portrait` (multipart, ≤ 2 Mo, png/jpeg/webp) |
| Lecture | `GET /api/portraits/**` — **publique**, cache immuable |
| Purge | remplacement (ancien objet supprimé) et suppression de fiche (purge par préfixe) |

La forme des clés vit dans `server/utils/portraits.ts` — un seul endroit, parce que trois
surfaces en dépendent (upload, service, purge) et qu'un désaccord entre elles coûterait
soit des objets orphelins facturés à vie, soit la suppression du portrait d'autrui.
Fonctions pures testées dans `test/unit/portraits.test.ts`.

**Pourquoi la lecture est publique** : la clé porte un uuid, n'est jamais listée, et l'URL
change à chaque remplacement — d'où le `Cache-Control: immutable` et le portrait
disponible hors-ligne. Aucune énumération n'est exposée.

**Dev vs prod** (`nuxt.config.ts`) : `hub.hosting` vaut toujours « cloudflare » (preset
nitro), donc le driver R2 serait choisi même en dev, où aucun binding n'existe. Le bloc
`$development` bascule sur le driver `fs` (`.data/blob`), à l'image de la base.

⚠️ Un envoi de fichier **ne passe pas par la file de synchro hors-ligne** (elle rejoue du
JSON, pas du binaire) : téléverser exige le réseau, coller une URL non.

### 4. `useStorage` (localStorage) — intentionnel

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
