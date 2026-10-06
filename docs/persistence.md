# Persistence des données

## Matrice : DB vs localStorage vs computed

| Donnée | Stockage | Raison |
|---|---|---|
| `exhaustionLevel` | DB (`character_sheets`) | Persistance cross-session ; réduit de 1 par le repos long (si le personnage a mangé et bu) |
| `hpBase` (part « dés » des PV max) | DB (`character_sheets`) | Le maximum est dérivé à la lecture (CON × niveau, bonus par niveau, épuisement) : [D19](decisions.md#d19) |
| `deathSaveSuccesses`, `deathSaveFailures` | DB (`character_sheets`) | Suivent le personnage d'un appareil à l'autre ; remis à zéro par les soins et le repos long (`shared/rules/damage.ts`) |
| `concentratingSpellId`, `concentratingOn` | DB (`character_sheets`) | Sort du catalogue (clé étrangère) ou libellé libre, jamais les deux |
| `dragonbornAncestry` | DB (`character_sheets`) | Persistance cross-session |
| `spellcastingAbility` | DB (`character_classes`) | Dérivé de la classe, voir [architecture.md](architecture.md) |
| `spellSlots` | DB (`character_spell_slots`) | Persistance cross-session |
| `currentHitDie` (dés de vie restants) | DB (`character_sheets`, JSON) | Persistance cross-session ; rendus par le repos long (`shared/rules/hitDice.ts`) |
| `notes` (notes de session) | DB (`character_sheets`) | Persistance cross-device, cross-session |
| `temporaryEffects` (bénédictions, malédictions…) | DB (`character_sheets`, JSON) | Peut durer plusieurs séances : cross-device, contrairement aux états d'encounter |
| Identité & description (`age`, `height`, `weight`, `eyes`, `hair`, `skin`, `deity`, `backstory`, `allies`, `portraitUrl`) | DB (`character_sheets`) | Description du personnage, saisie à la création ou sur la fiche |
| Fichier du portrait | **R2** (bucket `le-bureau-du-jdr-media`, binding `BLOB`) | Binaire : la fiche n'en garde que l'URL |
| `preferences` (fiche) | DB (`character_sheets`, JSON nullable) | Réglage propre à la fiche ; clé absente = hérite du compte ([D18](decisions.md#d18), [D23](decisions.md#d23)) |
| `preferences` (compte) | DB (`users`, JSON nullable) | Défauts du joueur, via `/api/account/preferences` |
| `activeConditions` | localStorage | État d'encounter, remis à zéro entre sessions |
| `conditionRounds` | localStorage | Rounds restants des états à durée, décomptés au « Nouveau tour » |
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
2. Ajouter le champ dans `updateCharacterSheetSchema` (`shared/utils/character_sheet.ts`).
   ⚠️ **Oubli silencieux** : Zod retire les clés inconnues, donc le PUT répond 200 (toast « Fiche
   sauvegardée ») sans rien écrire — c'est ce qui laissait les dés de vie à fond après rechargement.
   Une colonne nullable doit y être `.nullable().optional()` : le client renvoie la fiche brute, un
   simple `.optional()` ferait 422 à chaque auto-save des fiches où elle vaut `NULL`.
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

### 3. Fichiers — R2 (binding `BLOB`)

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

**Dev vs prod** : aucune différence de code. `useBinding('BLOB')` lit le même binding R2 en
prod et en dev, où l'émulation `cloudflare-dev` de Nitro le fournit (Miniflare, état dans
`.wrangler/state/v3/r2`).

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
const { status, schedule, flush } = useAutoSave(updateCharacterSheet, { delay: 2000, maxWait: 10_000 })
watch(characterSheet, schedule, { deep: true })
```

Toute mutation sur `characterSheet.value` (y compris les sous-objets) déclenche un PUT après 2 secondes d'inactivité (au plus 10 s en saisie continue). C'est le mécanisme central de persistance pour les données de la table `character_sheets` et ses relations directes (`classes`, etc.).

`useAutoSave` n'a qu'un PUT en vol à la fois (une modif arrivée pendant l'envoi en relance un autre après coup) et vide la sauvegarde en attente quand l'onglet est masqué ou la page quittée. Son `status` (`idle` / `saving` / `saved` / `error`) est fourni à `SyncStatus`, le badge de l'en-tête.

## Version de la fiche et garde-fou anti-écrasement

`character_sheets.updated_at` sert de version : une op mise en file hors-ligne est estampillée de la dernière version connue (`baseVersion`), et le rejeu déclare un conflit si la version du serveur est différente.

Pour que le client reconnaisse ses propres écritures, **toute écriture de `updated_at` passe par `stampSheetVersion(event)`** (`server/utils/touchCharacter.ts`), qui annonce la valeur dans l'en-tête de réponse `x-sheet-updated-at`. Chaque handler d'écriture de `server/api/character_sheets/[id]/` appelle `touchCharacterSheet(event, id)` (ou `stampSheetVersion` quand il écrit lui-même la colonne), sauf `index.delete` : la fiche disparaît, il n'y a plus de version à annoncer.

Côté client, le plugin `app/plugins/sheet-version.client.ts` enveloppe `$fetch` et fait avancer la version de référence (`setBaseVersion`) à chaque réponse d'une route `/api/character_sheets/<id>/…` qui porte l'en-tête : envoi direct, rejeu de file et `$fetch` direct sont couverts sans que l'appelant ait à y penser. Sans cela, une écriture directe faisait passer la version serveur devant celle du client et le rejeu suivant levait un faux conflit.

`test/unit/sheetVersion.test.ts` garde le contrat : aucune écriture d'`updatedAt` hors de l'utilitaire (`server/api` et `server/utils`), et aucun handler d'écriture de la fiche qui ne l'annonce pas. `test/nuxt/offlineVersionTracking.test.ts` rejoue le scénario de bout en bout avec de vrais en-têtes.

La pose de la version est une écriture de plus après la mutation, hors du `db.batch` des handlers à base injectée (`rest`, `level-up`) : un échec entre les deux laisserait la mutation faite sans version avancée.
