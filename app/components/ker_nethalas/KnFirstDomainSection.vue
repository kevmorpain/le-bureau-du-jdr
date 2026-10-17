<template>
  <KnCard
    v-if="intro && !intro.left"
    storage-key="first-domain"
  >
    <template #header>
      <KnCardHeader title="Domaine d'introduction">
        La carte est déjà tracée : huit salles au contenu fixe, des portes toutes marquées (reste à voir si elles sont verrouillées
        ou piégées), sa propre table de rencontres, et un Dé de Tension à chaque salle. Le Repaire et la Sortie sont sur la carte.
        On ne peut plus y revenir une fois la sortie franchie.
        <template #extra>
          <span class="text-sm text-muted">
            {{ intro.taken.length }} contenu{{ intro.taken.length > 1 ? 's' : '' }} pris sur {{ KN_FIRST_DOMAIN_ROOMS }}
          </span>
        </template>
      </KnCardHeader>
    </template>

    <div class="space-y-4">
      <div
        v-if="!intro.awakened"
        class="space-y-2 rounded-md border border-warning p-3"
      >
        <p class="font-medium">
          Se réveiller parmi les cadavres
        </p>
        <p class="text-sm text-muted">
          Débuts difficiles : D6 dégâts, D4 Santé mentale perdue et +1 Épuisement, dont on se remet comme d'habitude.
        </p>
        <UButton
          color="warning"
          @click="awaken"
        >
          Appliquer les Débuts difficiles
        </UButton>
      </div>

      <p
        v-if="!rooms"
        class="text-sm text-muted"
      >
        Le contenu des salles n'est pas chargé : reportez-vous à la carte du livre (chapitre VII).
      </p>

      <ul
        v-else
        class="space-y-3"
      >
        <li
          v-for="room in rooms"
          :key="room.number"
          class="space-y-2 rounded-md border border-default p-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="flex-1 font-medium">
              {{ romans[room.number - 1] }} · {{ room.name }}
            </h3>
            <UBadge
              v-if="taken(room.number)"
              label="Contenu pris"
              color="success"
              variant="subtle"
              size="md"
            />
          </div>
          <p class="text-sm">
            {{ room.text }}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              size="sm"
              variant="outline"
              icon="i-heroicons:arrow-right-circle"
              @click="enterRoom(room)"
            >
              {{ visited(room.number) ? 'Y retourner' : 'Entrer dans la salle' }}
            </UButton>
            <span class="text-xs text-muted">{{ rulesText(room) }}</span>
          </div>

          <div
            v-if="room.grants"
            class="flex flex-wrap items-center gap-2"
          >
            <UButton
              size="sm"
              variant="soft"
              icon="i-heroicons:hand-raised"
              :disabled="taken(room.number)"
              @click="take(room)"
            >
              {{ taken(room.number) ? 'Contenu pris' : 'Prendre le contenu' }}
            </UButton>
            <span class="text-xs text-muted">{{ grantsText(room.grants) }}</span>
          </div>

          <div
            v-if="room.choir"
            class="space-y-3"
          >
            <div class="space-y-1 rounded-md bg-elevated p-2">
              <p class="text-sm font-medium">
                À chaque entrée : test de Résolution, sinon {{ diceText(room.choir.damage) }} dégâts psychiques
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  size="xs"
                  :variant="resolveOpen ? 'solid' : 'outline'"
                  icon="i-heroicons:cube"
                  @click="resolveOpen = !resolveOpen"
                >
                  Tester
                </UButton>
                <UButton
                  size="xs"
                  :variant="resolveSuggestion === true ? 'solid' : 'soft'"
                  @click="endResolve(room, true)"
                >
                  Réussi
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  :variant="resolveSuggestion === false ? 'solid' : 'outline'"
                  @click="endResolve(room, false)"
                >
                  Raté : {{ diceText(room.choir.damage) }} dégâts
                </UButton>
              </div>
              <KnInlineCheck
                v-if="resolveOpen"
                :request="{ id: 'resistance:resolve', difficulty: 'normal', note: 'Résister au chœur' }"
                @rolled="success => resolveSuggestion = success"
                @close="resolveOpen = false"
              />
            </div>

            <div class="space-y-1 rounded-md bg-elevated p-2">
              <p class="text-sm font-medium">
                Réduire le chœur au silence : test de Raison
              </p>
              <p class="text-xs text-muted">
                Une réussite apaise les voix et ouvre un tirage de butin ; un échec rend la situation insupportable : il faut quitter la salle.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  size="xs"
                  :variant="reasonOpen ? 'solid' : 'outline'"
                  icon="i-heroicons:cube"
                  @click="reasonOpen = !reasonOpen"
                >
                  Tester
                </UButton>
                <UButton
                  size="xs"
                  :variant="reasonSuggestion === true ? 'solid' : 'soft'"
                  :disabled="!loot"
                  @click="silence(room)"
                >
                  Réussi : tirer le butin
                </UButton>
              </div>
              <KnInlineCheck
                v-if="reasonOpen"
                :request="{ id: 'skill:reason', difficulty: 'normal', note: 'Faire taire le chœur' }"
                @rolled="success => reasonSuggestion = success"
                @close="reasonOpen = false"
              />
            </div>
          </div>

          <div
            v-if="room.exit"
            class="flex flex-wrap items-center gap-2"
          >
            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons:arrow-down-circle"
              @click="leave"
            >
              Passer au Domaine suivant
            </UButton>
            <span class="text-xs text-muted">La chute est trop haute pour remonter : le Domaine d'introduction se ferme derrière vous.</span>
          </div>
        </li>
      </ul>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnDice } from '~~/shared/ker-nethalas/diceSchema'
import {
  KN_HARD_BEGINNINGS,
  knApplyRoomItems,
  knAwaken,
  knGrantLight,
  knIntroState,
  knLeaveFirstDomain,
  knTakeRoom,
  type KnFirstDomainRoom,
  type KnRoomGrants,
} from '~~/shared/ker-nethalas/firstDomain'
import { KN_FIRST_DOMAIN_ROOMS } from '~~/shared/ker-nethalas/introState'
import { knCurrentDomain } from '~~/shared/ker-nethalas/run'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import { knApplyLoot, knRollLoot, type KnLootContent, type KnLootTableKey } from '~~/shared/ker-nethalas/loot'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  resolved: KnResolvedSheet
  rooms: KnFirstDomainRoom[] | null
  catalog: KnCatalogItem[] | null
  loot: KnLootContent | null
  magic: KnMagicContent | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()
const { t, te } = useI18n()
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

const { enter } = useKnVisitEntry(character, () => props.resolved)

const intro = computed(() => knIntroState(character.value.run))
const taken = (number: number) => intro.value?.taken.includes(number) ?? false

const visited = (number: number) => knCurrentDomain(character.value.run).visits.some(visit => visit.introRoom === number)

// Ce que le livre dit de la salle : on y teste la rencontre de combat comme ailleurs, sauf mention contraire.
const rulesText = (room: KnFirstDomainRoom) => room.noEncounter
  ? 'Ni rencontre de combat ni événement.'
  : room.noEvent
    ? 'Rencontre de combat à tester ; pas d\'événement, même sans adversaire.'
    : 'Rencontre de combat et événement comme dans une salle ordinaire.'

function enterRoom(room: KnFirstDomainRoom) {
  enter(visited(room.number) ? 'revisit' : 'room', undefined, {
    room: room.number,
    ...(room.noEncounter ? { noEncounter: true } : {}),
    ...(room.noEvent ? { noEvent: true } : {}),
  })
}

const resolveOpen = ref(false)
const reasonOpen = ref(false)
const resolveSuggestion = ref<boolean | null>(null)
const reasonSuggestion = ref<boolean | null>(null)

const diceText = (dice: KnDice) => `${dice.count > 0 ? `${dice.count > 1 ? dice.count : ''}D${dice.sides}` : ''}${dice.bonus ? `${dice.count > 0 && dice.bonus > 0 ? '+' : ''}${dice.bonus}` : ''}` || '0'

function grantsText(grants: KnRoomGrants) {
  const parts = [
    grants.light ? `lumière pour ${grants.light} salles` : '',
    ...(grants.items ?? []).map(item => `${item.count ? diceText(item.count) : '1'} × ${props.catalog?.find(entry => entry.key === item.ref)?.name ?? item.ref}`),
    ...(grants.effects ?? []).map(effect => effect.kind === 'provision' ? `${effect.dice.bonus || diceText(effect.dice)} × ${t(`ker_nethalas.provisions.${effect.key}`).toLowerCase()}` : effect.kind),
    ...(grants.loot ?? []).map(table => te(`ker_nethalas.loot.draws.${table}`) ? t(`ker_nethalas.loot.draws.${table}`) : `un tirage « ${t(`ker_nethalas.loot.tables.${table}`).toLowerCase()} »`),
  ]
  return parts.filter(Boolean).join(' · ')
}

function awaken() {
  applyEffects([...KN_HARD_BEGINNINGS], 'Débuts difficiles')
  character.value.run = knAwaken(character.value.run)
}

function drawLoot(table: KnLootTableKey, lines: string[]) {
  if (!props.loot) {
    lines.push(`tirage « ${table} » à faire dans la section Butin`)
    return
  }
  const result = knRollLoot(props.loot, table, Math.random, props.magic)
  if ('missing' in result) {
    lines.push(`table « ${result.missing} » non chargée`)
    return
  }
  const c = character.value
  const applied = knApplyLoot({ inventory: c.inventory, provisions: c.provisions }, result, props.catalog ?? [])
  c.inventory = applied.state.inventory
  c.provisions = applied.state.provisions
  lines.push(...(applied.lines.length ? applied.lines : [result.steps.at(-1)?.text ?? table]))
}

function take(room: KnFirstDomainRoom) {
  const { grants } = room
  if (!grants || taken(room.number)) return
  const c = character.value
  const lines: string[] = []

  if (grants.light) {
    c.run = knGrantLight(c.run, grants.light)
    lines.push(`lumière pour ${grants.light} salles`)
  }
  if (grants.items?.length) {
    const applied = knApplyRoomItems({ inventory: c.inventory, provisions: c.provisions }, grants.items, props.catalog ?? [])
    c.inventory = applied.state.inventory
    c.provisions = applied.state.provisions
    lines.push(...applied.lines)
  }
  for (const table of grants.loot ?? []) drawLoot(table, lines)
  if (grants.effects?.length) applyEffects(grants.effects, `${romans[room.number - 1]} · ${room.name}`)

  c.run = knTakeRoom(c.run, room.number)
  if (lines.length) toast.add({ title: `${romans[room.number - 1]} · ${room.name}`, description: lines.join(', '), color: 'success' })
}

function endResolve(room: KnFirstDomainRoom, success: boolean) {
  if (!room.choir) return
  if (!success) applyEffects([{ kind: 'damage', dice: room.choir.damage }], 'Le chœur')
  resolveOpen.value = false
  resolveSuggestion.value = null
}

function silence(room: KnFirstDomainRoom) {
  if (!room.choir) return
  const lines: string[] = []
  drawLoot(room.choir.loot, lines)
  toast.add({ title: 'Le chœur se tait', description: lines.join(', '), color: 'success' })
  reasonOpen.value = false
  reasonSuggestion.value = null
}

function leave() {
  character.value.run = knLeaveFirstDomain(character.value.run)
}
</script>
