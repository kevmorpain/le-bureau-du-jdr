<template>
  <KnCard storage-key="loot">
    <template #header>
      <KnCardHeader title="Butin">
        Le tirage suit les tables du livre, de l'une à l'autre. Chaque résultat s'ajoute par un bouton : à l'inventaire, ou aux
        provisions.
      </KnCardHeader>
    </template>

    <p
      v-if="!loot"
      class="text-sm text-muted"
    >
      Le contenu du butin n'est pas chargé : notez ce que le livre donne dans l'inventaire.
    </p>

    <div
      v-else
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="key in STARTS"
          :key
          size="sm"
          variant="soft"
          icon="i-heroicons:cube"
          @click="draw([key])"
        >
          {{ $t(`ker_nethalas.loot.tables.${key}`) }}
        </UButton>
      </div>

      <div
        v-if="creatureItems.length"
        class="flex flex-wrap items-end gap-2"
      >
        <UFormField label="Butin d'une créature">
          <KnAddPicker
            :items="creatureItems"
            placeholder="Choisir une créature"
            class="w-64"
            @pick="drawCreature(String($event))"
          />
        </UFormField>
      </div>

      <ul
        v-if="pending.length"
        class="space-y-2"
      >
        <li
          v-for="entry in pending"
          :key="entry.id"
          class="space-y-1 rounded-md bg-elevated p-3"
        >
          <p class="text-sm text-muted">
            {{ path(entry) }}
          </p>
          <p
            v-if="'missing' in entry.result"
            class="text-sm text-warning"
          >
            La table « {{ $t(`ker_nethalas.loot.tables.${entry.result.missing}`) }} » n'est pas chargée : notez le résultat du livre.
          </p>
          <p
            v-else
            class="font-medium"
          >
            {{ summary(entry.result) }}
          </p>
          <p
            v-if="entry.coins"
            class="text-sm"
          >
            Pièces des contenants : +{{ entry.coins }} ₵
          </p>
          <div class="flex gap-2">
            <UButton
              v-if="!('missing' in entry.result) && (entry.result.drop.kind !== 'nothing' || entry.coins)"
              size="xs"
              @click="take(entry)"
            >
              Ajouter
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              @click="discard(entry.id)"
            >
              Écarter
            </UButton>
          </div>
        </li>
      </ul>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knDrawAmulet } from '~~/shared/ker-nethalas/amulets'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import { knApplyLoot, knRollLoot, type KnLootContent, type KnLootResult, type KnLootTableKey } from '~~/shared/ker-nethalas/loot'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knHasActivePerk } from '~~/shared/ker-nethalas/goalEffects'
import { KN_LUCKY_FIND_DIE } from '~~/shared/ker-nethalas/perks'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  loot: KnLootContent | null
  catalog: KnCatalogItem[] | null
  bestiary: KnCreature[] | null
  masteries: KnMastery[] | null
  magic: KnMagicContent | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const toast = useToast()
const { record } = useKnGoalProgress(character)

const STARTS: KnLootTableKey[] = ['spoils', 'mundane', 'valuable', 'precious', 'resources', 'containers']

interface Pending {
  id: number
  result: KnLootResult | { missing: KnLootTableKey }
  // Atout des pièces de contenant : les pièces d'un contenant ouvert.
  coins?: number
}

const pending = ref<Pending[]>([])
let nextId = 1

function draw(starts: readonly KnLootTableKey[]) {
  if (!props.loot) return
  const lucky = knHasActivePerk(character.value, 'luckyFind')
  for (const start of starts) {
    const result = knRollLoot(props.loot, start, Math.random, props.magic)
    const container = lucky && !('missing' in result) && result.steps.some(step => step.table === 'containers')
    pending.value.push({ id: nextId++, result, ...(container ? { coins: knRollDie(KN_LUCKY_FIND_DIE) } : {}) })
  }
}

const creatureItems = computed<SelectItem[]>(() =>
  (props.bestiary ?? []).filter(creature => creature.loot?.length).map(creature => ({ label: creature.name, value: creature.key })),
)

function drawCreature(key: string) {
  const creature = props.bestiary?.find(candidate => candidate.key === key)
  if (creature?.loot) draw(creature.loot)
}

const tableLabel = (key: KnLootTableKey) => t(`ker_nethalas.loot.tables.${key}`)

// Une potion trouvée n'est pas identifiée : ni sa ligne de table ni son nom ne se montrent avant l'identification.
function path(entry: Pending) {
  if ('missing' in entry.result) return ''
  const steps = entry.result.drop.kind === 'potion' ? entry.result.steps.slice(0, -1) : entry.result.steps
  return steps.map(step => `${tableLabel(step.table)} (D${step.die} → ${step.roll})`).join(' › ')
}

function summary(result: KnLootResult) {
  if (result.loreBook) return `Livre de savoir : ${result.loreBook.title}`
  if (result.drop.kind === 'potion') return 'Une potion, à identifier'
  if (result.drop.kind === 'relic') return result.relic ? `Relique : ${result.relic.name}` : 'Une Relique (contenu non chargé : notez-la à la main)'
  if (result.drop.kind === 'magic' && result.magic) return `Objet magique : ${t(`ker_nethalas.inventory.magicTables.${result.magic.type}`)}${result.magic.baseRef ? ` (${props.catalog?.find(entry => entry.key === result.magic!.baseRef)?.name ?? result.magic.baseRef})` : ''}`
  const last = result.steps[result.steps.length - 1]!
  const label = last.title ?? last.text
  if (result.drop.kind === 'gem') return `${label} : ${result.value} ₵`
  if (result.drop.kind === 'item' && result.drop.count) return `${result.count} × ${label.replace(/^D\d+ /, '')}`
  return label
}

function take(entry: Pending) {
  if ('missing' in entry.result) return
  const c = character.value
  const { state, lines, amulet, xp } = knApplyLoot({ inventory: c.inventory, provisions: c.provisions }, entry.result, props.catalog ?? [])
  c.inventory = state.inventory
  c.provisions = state.provisions
  if (entry.coins) {
    c.coins = Math.min(KN_BOUNDS.coins.max, c.coins + entry.coins)
    lines.push(`+${entry.coins} ₵`)
    record({ kind: 'coins', amount: entry.coins })
  }
  if (entry.result.drop.kind === 'relic') record({ kind: 'relic' })
  if (entry.result.loreBook) record({ kind: 'loreBook' })
  if (amulet) lines.push(drawAmulet())
  if (xp) {
    c.xp = Math.min(KN_BOUNDS.xp.max, c.xp + xp)
    lines.push(`+${xp} XP`)
  }
  toast.add({ title: 'Butin ajouté', description: lines.join(', ') || 'Rien à ajouter', color: lines.length ? 'success' : 'neutral' })
  discard(entry.id)
}

// Une amulette n'est pas un objet : on tire la Maîtrise à laquelle elle donne accès (table des Maîtrises aléatoires).
function drawAmulet(): string {
  const drawn = props.masteries ? knDrawAmulet(character.value.amulets, character.value.masteryPicks, props.masteries.map(mastery => mastery.key)) : null
  if (!drawn) return 'amulette (Maîtrises non chargées : tirez-la dans la section Maîtrises)'
  character.value.amulets = drawn.amulets
  return `amulette : ${props.masteries!.find(mastery => mastery.key === drawn.key)?.name ?? drawn.key}`
}

function discard(id: number) {
  pending.value = pending.value.filter(entry => entry.id !== id)
}
</script>
