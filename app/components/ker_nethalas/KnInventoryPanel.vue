<template>
  <section class="space-y-3 @xl:col-span-2">
    <KnCardHeader title="Inventaire">
      Dix emplacements de sac au départ ; un Sac à dos porté en ajoute 20, chaque Pochette portée 5. Les emplacements rapides
      n'existent qu'avec une Ceinture portée. Les provisions, les pièces et les amulettes non portées comptent dans le sac.
    </KnCardHeader>

    <div class="flex flex-wrap items-center gap-2 text-sm">
      <UBadge
        :label="`Sac : ${encumbrance.used} / ${encumbrance.capacity}`"
        :color="encumbrance.over ? 'error' : 'neutral'"
        variant="subtle"
        size="md"
        :title="`Normaux ${encumbrance.normal}, lourds ${encumbrance.heavy}, légers ${encumbrance.light}, pièces et gemmes ${encumbrance.bulk}`"
      />
      <UBadge
        :label="quickSlots ? `Ceinture : ${quickUsed} / ${quickSlots}` : 'Ceinture : aucun emplacement rapide'"
        color="neutral"
        variant="subtle"
        size="md"
      />
      <UBadge
        :label="`Sur le corps : ${bodyUsed} / ${bodyMax}`"
        color="neutral"
        variant="subtle"
        size="md"
      />
      <span
        v-if="encumbrance.over"
        class="text-error"
      >Vous portez plus que votre sac ne le permet.</span>
    </div>
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium">Provisions</span>
        <span class="text-muted">{{ provisionsText }} · {{ provisionSlots }} emplacement{{ provisionSlots > 1 ? 's' : '' }}</span>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          :aria-expanded="provisionsOpen"
          @click="provisionsOpen = !provisionsOpen"
        >
          {{ provisionsOpen ? 'Fermer' : 'Modifier' }}
        </UButton>
      </div>
      <div
        v-if="provisionsOpen"
        class="grid grid-cols-2 gap-3 @sm:grid-cols-5"
      >
        <KnNumberField
          v-for="key in KN_PROVISION_KEYS"
          :key
          v-model="character.provisions[key]"
          :label="$t(`ker_nethalas.provisions.${key}`)"
          :min="KN_PROVISION_BOUNDS.min"
          :max="KN_PROVISION_BOUNDS.max"
        />
      </div>
    </div>

    <section
      v-for="group in groups"
      :key="group.key"
      class="space-y-2"
    >
      <h4 class="text-sm font-medium">
        {{ group.title }}
        <span class="font-normal text-muted">{{ group.count }}</span>
      </h4>
      <ul
        v-if="group.slots"
        class="grid gap-x-6 gap-y-1 text-sm @xl:grid-cols-2"
      >
        <li
          v-for="(slot, index) in group.slots"
          :key="index"
          class="flex items-baseline gap-2"
        >
          <span class="w-36 shrink-0 text-muted">{{ slot.label }}</span>
          <span :class="slot.item ? 'font-medium' : 'text-muted italic'">{{ slot.item?.name ?? 'vide' }}</span>
          <UBadge
            v-if="slot.item?.broken"
            label="Brisé"
            color="error"
            variant="subtle"
            size="md"
          />
        </li>
      </ul>
      <p
        v-if="group.key === 'worn'"
        class="flex flex-wrap gap-x-4 text-sm"
      >
        <span class="text-muted">Armure par zone</span>
        <span
          v-for="zone in KN_SURVIVOR_ARMOR_ZONES"
          :key="zone"
        ><span class="text-muted">{{ ZONE_LABELS[zone] }} :</span> <span class="font-semibold">{{ armorByZone[zone] }}</span></span>
      </p>
      <ul class="space-y-2">
        <li
          v-for="item in group.items"
          :key="item.id"
          class="flex flex-wrap items-center gap-3 rounded-md border border-default p-2"
        >
          <div class="min-w-40 flex-1">
            <p class="flex flex-wrap items-center gap-2 font-medium">
              {{ item.name }}
              <UBadge
                v-if="item.broken"
                label="Brisé"
                color="error"
                variant="subtle"
                size="md"
              />
              <UBadge
                v-if="item.magic && !isOpen(item.id)"
                :label="magicBadge(item)"
                :color="item.magic.identified ? 'primary' : 'neutral'"
                variant="subtle"
                size="md"
              />
              <UBadge
                v-if="item.integrity"
                :label="`Intégrité D${item.integrity.current} / D${item.integrity.max}`"
                :color="item.integrity.current < item.integrity.max ? 'warning' : 'neutral'"
                variant="subtle"
                size="md"
              />
            </p>
            <p class="text-xs text-muted">
              {{ $t(`ker_nethalas.inventory.kinds.${item.kind}`) }} · {{ $t(`ker_nethalas.inventory.weights.${item.weight}`).toLowerCase() }}
              <span v-if="item.slot"> · case {{ item.slot }}</span>
            </p>
            <p
              v-if="stats(item)"
              class="text-xs text-muted"
            >
              {{ stats(item) }}
            </p>
            <template v-if="isOpen(item.id)">
              <p
                v-if="agingText(item)"
                class="text-xs text-muted"
              >
                Vieillissement : {{ agingText(item) }}
              </p>

              <div
                v-if="item.magic"
                class="mt-1 space-y-1"
              >
                <UBadge
                  :label="magicBadge(item)"
                  :color="item.magic.identified ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="md"
                />
                <p
                  v-if="!item.magic.identified"
                  class="text-xs text-muted"
                >
                  Tant qu'il n'est pas harmonisé (activité Harmoniser du camp, 1 Cristal d'harmonisation), il se comporte comme son équivalent ordinaire.
                </p>
                <p
                  v-else-if="!knIsWorn(item)"
                  class="text-xs text-warning"
                >
                  Ses propriétés n'agissent que quand il est porté.
                </p>
                <ul
                  v-if="item.magic.properties.length"
                  class="space-y-1 text-xs"
                >
                  <li
                    v-for="(property, index) in item.magic.properties"
                    :key="index"
                    class="flex flex-wrap items-center gap-2"
                  >
                    <span>{{ property.text }}</span>
                    <USelect
                      v-if="property.choose"
                      :model-value="property.choice"
                      :items="skillItems"
                      placeholder="Choisir une compétence"
                      size="xs"
                      class="w-56"
                      :aria-label="`Compétence de ${item.name}`"
                      @update:model-value="setChoice(item.id, index, $event as KnSkillKey)"
                    />
                    <UButton
                      v-for="limited in usesOf(item, index)"
                      :key="limited.key"
                      size="xs"
                      variant="soft"
                      icon="i-heroicons:bolt"
                      :disabled="!knIsWorn(item) || knIsUsedUp(character.status, limited.key)"
                      :title="knIsUsedUp(character.status, limited.key) ? `Déjà utilisé : ${knUseLimitLabel[limited.limit]}` : knUseLimitLabel[limited.limit]"
                      @click="useMagic(limited)"
                    >
                      {{ limited.label }}
                    </UButton>
                  </li>
                </ul>
                <p
                  v-for="peculiarity in item.magic.peculiarities"
                  :key="peculiarity"
                  class="text-xs italic text-muted"
                >
                  {{ peculiarity }}
                </p>
              </div>
            </template>
          </div>
          <UButton
            v-if="knPermanentGains(item).length"
            size="xs"
            icon="i-heroicons:sparkles"
            :aria-label="`Consommer ${item.name}`"
            @click="consumePermanent(item)"
          >
            Consommer
          </UButton>
          <template v-if="item.consumable">
            <UButton
              v-if="item.consumable.identified === false"
              size="xs"
              variant="soft"
              icon="i-heroicons:magnifying-glass"
              :disabled="!canUse(item)"
              :aria-label="`Identifier ${item.name}`"
              @click="startIdentify(item)"
            >
              Identifier (Médecine)
            </UButton>
            <UButton
              size="xs"
              icon="i-heroicons:sparkles"
              :disabled="!canUse(item)"
              :title="canUse(item) ? undefined : 'Le contenu des butins n\'est pas chargé'"
              :aria-label="`${item.kind === 'potion' ? 'Boire' : 'Utiliser'} ${item.name}`"
              @click="use(item)"
            >
              {{ item.kind === 'potion' ? 'Boire' : 'Utiliser' }}
            </UButton>
          </template>
          <UButton
            :icon="isOpen(item.id) ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-expanded="isOpen(item.id)"
            :aria-label="`${isOpen(item.id) ? 'Replier' : 'Détails de'} ${item.name}`"
            @click="toggle(item.id)"
          />
          <template v-if="isOpen(item.id)">
            <KnNumberField
              v-if="item.place === 'bag' || item.place === 'quick'"
              :model-value="item.quantity"
              label="Quantité"
              :min="1"
              :max="9999"
              class="w-24"
              @update:model-value="setQuantity(item.id, $event)"
            />
            <UFormField label="Emplacement">
              <USelect
                :model-value="item.place"
                :items="placeItems(item)"
                class="w-60"
                :aria-label="`Emplacement de ${item.name}`"
                @update:model-value="move(item, $event as KnItemPlace)"
              />
            </UFormField>
            <template v-if="item.integrity">
              <UButton
                size="xs"
                variant="soft"
                icon="i-heroicons:cube"
                :aria-label="`Jet d'Intégrité de ${item.name}`"
                @click="rollIntegrity(item.id)"
              >
                Jet d'Intégrité
              </UButton>
              <UButton
                size="xs"
                variant="soft"
                icon="i-heroicons:wrench"
                :disabled="item.integrity.current >= item.integrity.max"
                :aria-label="`Réparer ${item.name}`"
                @click="repair(item.id)"
              >
                Réparer
              </UButton>
            </template>
            <UButton
              icon="i-heroicons:trash"
              color="error"
              variant="ghost"
              size="sm"
              :aria-label="`Retirer ${item.name}`"
              @click="remove(item.id)"
            />
          </template>
        </li>
      </ul>
    </section>
    <p
      v-if="!inventory.length"
      class="text-sm text-muted"
    >
      Aucun objet. Ajoutez ce que le survivant trouve ou achète.
    </p>

    <KnInlineCheck
      v-if="pendingCheck"
      :key="pendingCheck.id"
      :request="pendingCheck.request"
      @rolled="pendingCheck.done"
      @close="pendingCheck = null"
    />

    <UButton
      :icon="addOpen ? 'i-heroicons:chevron-up' : 'i-heroicons:plus'"
      color="neutral"
      variant="soft"
      size="sm"
      :aria-expanded="addOpen"
      @click="addOpen = !addOpen"
    >
      Ajouter un objet
    </UButton>

    <div
      v-if="addOpen && catalog"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField label="Du catalogue du livre">
        <KnAddPicker
          :items="catalogItems"
          placeholder="Choisir un objet"
          class="w-72"
          :disabled="inventory.length >= KN_MAX_ITEMS"
          @pick="addFromCatalog(String($event))"
        />
      </UFormField>
      <UCheckbox
        v-model="found"
        label="Trouvé en butin (Intégrité d'un cran en moins)"
      />
    </div>

    <form
      v-if="addOpen"
      class="flex flex-wrap items-end gap-3"
      @submit.prevent="add"
    >
      <UFormField label="Nouvel objet">
        <UInput
          v-model="draft.name"
          :maxlength="100"
          placeholder="Nom"
          class="w-56"
        />
      </UFormField>
      <UFormField label="Type">
        <USelect
          v-model="draft.kind"
          :items="kindItems"
          class="w-48"
          @update:model-value="draft.weight = knDefaultWeight(draft.kind)"
        />
      </UFormField>
      <UFormField label="Encombrement">
        <USelect
          v-model="draft.weight"
          :items="weightItems"
          class="w-44"
        />
      </UFormField>
      <KnNumberField
        v-model="draft.quantity"
        label="Quantité"
        :min="1"
        :max="9999"
        class="w-24"
      />
      <UButton
        type="submit"
        icon="i-heroicons:plus"
        :disabled="!draft.name.trim() || inventory.length >= KN_MAX_ITEMS"
      >
        Ajouter
      </UButton>
    </form>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_PROVISION_BOUNDS, KN_PROVISION_KEYS } from '~~/shared/ker-nethalas/camp'
import {
  KN_AGING_DIE,
  KN_POTION_POISON,
  knAgingAt,
  knIdentifyPotion,
  knPlanConsumable,
  knSpendConsumable,
  type KnPotionAging,
} from '~~/shared/ker-nethalas/consumables'
import { knDiceLabel, knRollDice } from '~~/shared/ker-nethalas/dice'
import { KN_SURVIVOR_ARMOR_ZONES, type KnSurvivorArmorZone } from '~~/shared/ker-nethalas/combat'
import { knArmorByZone, knRepairItem, knRollIntegrity } from '~~/shared/ker-nethalas/equipment'
import { knItemFromCatalog, type KnCatalogItem } from '~~/shared/ker-nethalas/items'
import { knConsumableEntry, type KnLootContent } from '~~/shared/ker-nethalas/loot'
import { knIsWorn, knMagicCarryBonus, knMagicIdentifiesPotions, knMagicUses, knPermanentGains, type KnMagicUse } from '~~/shared/ker-nethalas/magicEffects'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import { knIsUsedUp, knMarkUsed, knUseLimitLabel } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import type { KnRollRequest } from '~~/shared/ker-nethalas/roll'
import { knRollDie } from '~~/shared/ker-nethalas/run'
import { KN_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import { knCheckId } from '~~/shared/ker-nethalas/tables'
import {
  KN_BACKPACK_SLOTS,
  KN_ITEM_KINDS,
  KN_BODY_PLACES,
  KN_ITEM_WEIGHTS,
  KN_MAX_ITEMS,
  KN_POUCH_SLOTS,
  knBodySlotCount,
  knBodySlotMax,
  knBodySlots,
  knDefaultWeight,
  knEncumbrance,
  knNewItem,
  knNextItemId,
  knPlaceItem,
  knPlacesFor,
  knQuickSlotCount,
  knRemoveItem,
  type KnItem,
  type KnItemKind,
  type KnItemPlace,
  type KnItemWeight,
} from '~~/shared/ker-nethalas/inventory'

const props = defineProps<{
  catalog: KnCatalogItem[] | null
  loot: KnLootContent | null
  aging: KnPotionAging | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const toast = useToast()

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)

const inventory = computed(() => character.value.inventory)

const opened = ref<string[]>([])
const isOpen = (id: string) => opened.value.includes(id)
const toggle = (id: string) => {
  opened.value = isOpen(id) ? opened.value.filter(entry => entry !== id) : [...opened.value, id]
}

const provisionsOpen = ref(false)
const addOpen = ref(false)

const provisionsText = computed(() => {
  const held = KN_PROVISION_KEYS.filter(key => character.value.provisions[key] > 0)
  return held.length ? held.map(key => `${character.value.provisions[key]} ${t(`ker_nethalas.provisions.${key}`).toLowerCase()}`).join(', ') : 'aucune'
})

const amuletsCarried = computed(() => character.value.amulets.owned.length - (character.value.amulets.equipped === null ? 0 : 1))
const provisionsCount = computed(() => Object.values(character.value.provisions).reduce((sum, count) => sum + count, 0))

const encumbrance = computed(() => knEncumbrance(inventory.value, { provisions: provisionsCount.value, coins: character.value.coins, amulets: amuletsCarried.value }, knMagicCarryBonus(inventory.value)))
const provisionSlots = computed(() => Math.ceil(provisionsCount.value / 10))
const quickSlots = computed(() => knQuickSlotCount(inventory.value))
const quickUsed = computed(() => inventory.value.filter(item => item.place === 'quick').length)
const bodyUsed = computed(() => knBodySlotCount(inventory.value, character.value.amulets.equipped !== null))
const bodyMax = computed(() => knBodySlotMax(inventory.value))

const ZONE_LABELS: Record<KnSurvivorArmorZone, string> = { head: 'Tête', torso: 'Torse', arms: 'Bras', legs: 'Jambes' }

const armorByZone = computed(() => knArmorByZone(inventory.value))

interface InventoryGroup {
  key: string
  title: string
  count: string
  items: KnItem[]
  slots?: { label: string, item?: KnItem }[]
}

const inPlace = (place: KnItemPlace) => inventory.value.filter(item => item.place === place)

// Le sac à dos et les pochettes portés ne contiennent rien en propre : ils rejoignent le sac, dont ils augmentent la capacité.
const groups = computed<InventoryGroup[]>(() => {
  const bodyPlaces = KN_BODY_PLACES.filter(place => place !== 'backpack' && place !== 'pouch')
  const belt = inPlace('quick')
  const bag = inPlace('bag')
  const backpack = inPlace('backpack')
  const pouches = inPlace('pouch')
  const containers = [...backpack, ...pouches]
  const capacityNote = [
    backpack.length ? `sac à dos +${KN_BACKPACK_SLOTS}` : '',
    pouches.length ? `${pouches.length > 1 ? `${pouches.length} pochettes` : 'pochette'} +${KN_POUCH_SLOTS * pouches.length}` : '',
  ].filter(Boolean).join(', ')
  return [
    {
      key: 'worn',
      title: 'Sur le corps',
      count: `${bodyUsed.value} / ${bodyMax.value}`,
      items: bodyPlaces.flatMap(inPlace),
      slots: knBodySlots(inventory.value).map(slot => ({ label: t(slot.kind ? `ker_nethalas.inventory.kinds.${slot.kind}` : `ker_nethalas.inventory.places.${slot.place}`), item: slot.item })),
    },
    ...(quickSlots.value
      ? [{
          key: 'quick',
          title: 'Ceinture',
          count: `${quickUsed.value} / ${quickSlots.value}`,
          items: belt.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
          slots: Array.from({ length: quickSlots.value }, (_, index) => ({ label: `Case ${index + 1}`, item: belt.find(item => item.slot === index + 1) })),
        }]
      : []),
    ...(bag.length || containers.length ? [{ key: 'bag', title: 'Sac', count: `${encumbrance.value.used} / ${encumbrance.value.capacity}${capacityNote ? ` (${capacityNote})` : ''}`, items: [...containers, ...bag] }] : []),
  ]
})

const kindItems = KN_ITEM_KINDS.map(kind => ({ label: t(`ker_nethalas.inventory.kinds.${kind}`), value: kind }))
const weightItems = KN_ITEM_WEIGHTS.map(weight => ({ label: t(`ker_nethalas.inventory.weights.${weight}`), value: weight }))

// Un endroit où l'objet ne peut pas aller est grisé, avec la raison.
const placeItems = (item: KnItem): SelectItem[] =>
  knPlacesFor(item.kind).map((place) => {
    const label = t(`ker_nethalas.inventory.places.${place}`)
    const result = place === item.place ? undefined : knPlaceItem(inventory.value, item.id, place)
    if (result && 'error' in result) return { label: `${label} — ${t(`ker_nethalas.inventory.unavailable.${result.error}`)}`, value: place, disabled: true }
    return { label, value: place }
  })

const draft = reactive<{ name: string, kind: KnItemKind, weight: KnItemWeight, quantity: number }>({ name: '', kind: 'gear', weight: 'normal', quantity: 1 })

function add() {
  const name = draft.name.trim()
  if (!name) return
  character.value.inventory = [...inventory.value, knNewItem({ name, kind: draft.kind, weight: draft.weight, quantity: draft.quantity }, knNextItemId(inventory.value))]
  draft.name = ''
  draft.quantity = 1
}

const found = ref(false)

const catalogItems = computed<SelectItem[]>(() =>
  (props.catalog ?? []).map(entry => ({ label: `${entry.name} — ${t(`ker_nethalas.inventory.kinds.${entry.kind}`).toLowerCase()}, ${entry.value} ₵`, value: entry.key })),
)

// Une provision du catalogue (Torche, Ration…) s'ajoute aux provisions, pas à l'inventaire.
function addFromCatalog(key: string) {
  const entry = props.catalog?.find(candidate => candidate.key === key)
  if (!entry) return
  if (entry.provision) {
    character.value.provisions = { ...character.value.provisions, [entry.provision]: character.value.provisions[entry.provision] + 1 }
    toast.add({ title: `${entry.name} ajouté aux provisions`, color: 'success' })
    return
  }
  character.value.inventory = [...inventory.value, knItemFromCatalog(entry, knNextItemId(inventory.value), { found: found.value })]
}

function move(item: KnItem, place: KnItemPlace) {
  if (place === item.place) return
  const result = knPlaceItem(inventory.value, item.id, place)
  if ('error' in result) {
    toast.add({ title: t(`ker_nethalas.inventory.errors.${result.error}`), color: 'warning' })
    return
  }
  character.value.inventory = result.items
}

// Ce que l'objet apporte : arme (compétence, Vitesse, Traits), protection et Intégrité, parade, malus.
function stats(item: KnItem): string {
  const parts = [
    ...(item.weapon ? [`${t(`ker_nethalas.skills.${item.weapon.skill}`)}, Vitesse ${item.weapon.speed}`, ...item.weapon.traits.map(trait => t(`ker_nethalas.inventory.traits.${trait}`))] : []),
    ...(item.protection ? [`Armure ${item.protection}`] : []),
    ...(item.parry ? [`Parade +${item.parry}`] : []),
    ...(item.maneuverability ? [`Agilité −${item.maneuverability}`] : []),
    ...(item.perception ? [`Perception −${item.perception}`] : []),
    ...(item.note ? [item.note] : []),
  ]
  return parts.join(' · ')
}

function rollIntegrity(id: string) {
  const rolled = knRollIntegrity(inventory.value, id)
  if (!rolled.result) return
  character.value.inventory = rolled.items
  const { name, die, roll, outcome, to } = rolled.result
  toast.add({
    title: `Intégrité de ${name}`,
    description: `D${die} → ${roll}${outcome === 'held' ? ' : tient' : outcome === 'down' ? ` : passe au D${to}` : ' : perdu'}`,
    color: outcome === 'held' ? 'neutral' : 'warning',
  })
}

function repair(id: string) {
  character.value.inventory = knRepairItem(inventory.value, id)
}

function setQuantity(id: string, quantity: number) {
  character.value.inventory = inventory.value.map(item => item.id === id ? { ...item, quantity } : item)
}

function remove(id: string) {
  character.value.inventory = knRemoveItem(inventory.value, id)
}

const skillItems = KN_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key }))

const magicBadge = (item: KnItem) => item.magic?.identified
  ? t(`ker_nethalas.inventory.rarities.${item.magic.rarity ?? 'uncommon'}`)
  : `Magique (${t(`ker_nethalas.inventory.magicTables.${item.magic!.table}`)}), non harmonisé`

const usesOf = (item: KnItem, index: number) => knMagicUses(inventory.value).filter(use => use.itemId === item.id && use.key === `${item.id}:${index + 1}`)

function setChoice(id: string, index: number, skill: KnSkillKey) {
  character.value.inventory = inventory.value.map(item => item.id === id && item.magic
    ? { ...item, magic: { ...item.magic, properties: item.magic.properties.map((property, i) => i === index ? { ...property, choice: skill } : property) } }
    : item)
}

// Consommer un objet qui augmente à jamais une jauge ou une Résistance : le maximum monte, et la valeur actuelle avec lui.
function consumePermanent(item: KnItem) {
  const c = character.value
  const lines: string[] = []
  for (const gain of knPermanentGains(item)) {
    if (gain.k === 'permanent') {
      const rolled = knRollDice(gain.dice).total
      c[`${gain.vital}Max`] = Math.min(KN_BOUNDS.vital.max, c[`${gain.vital}Max`] + rolled)
      c[`${gain.vital}Current`] = Math.min(KN_BOUNDS.vital.max, c[`${gain.vital}Current`] + rolled)
      lines.push(`+${rolled} ${t(`ker_nethalas.vitals.${gain.vital}`).toLowerCase()} maximum`)
    } else {
      c.resistances[gain.resistance] = Math.min(KN_BOUNDS.resistance.max, c.resistances[gain.resistance] + gain.amount)
      lines.push(`+${gain.amount} ${t(`ker_nethalas.resistances.${gain.resistance}`)}`)
    }
  }
  c.inventory = knRemoveItem(inventory.value, item.id)
  toast.add({ title: `${item.name} consommé`, description: lines.join(', '), color: 'success' })
}

// Un usage limité : il se marque (et se remet à zéro avec sa fréquence) ; un soin du porteur s'applique, celui d'une cible se jette.
function useMagic(use: KnMagicUse) {
  character.value.status = knMarkUsed(character.value.status, use.key, use.limit)
  if (use.heal && use.self) {
    applyEffects([{ kind: 'woundsHeal', dice: use.heal }], use.label)
  } else if (use.heal) {
    const rolled = knRollDice(use.heal)
    toast.add({ title: use.label, description: `${knDiceLabel(use.heal)} → ${rolled.total} Blessures à soigner`, color: 'info', duration: 15000 })
  } else {
    toast.add({ title: use.label, description: `${use.itemName} : ${knUseLimitLabel[use.limit]}`, color: 'info' })
  }
}

const pendingCheck = ref<{ id: number, request: KnRollRequest, done: (success: boolean) => void } | null>(null)
let checkSeq = 0

const isUnknownPotion = (item: KnItem) => item.kind === 'potion' && item.consumable?.identified === false

const canUse = (item: KnItem) => !!knConsumableEntry(props.loot, item) && (item.kind !== 'potion' || !!props.aging)

const agingOf = (item: KnItem) => props.aging && item.consumable?.aging ? knAgingAt(props.aging, item.consumable.aging) : undefined

const agingText = (item: KnItem) => agingOf(item)?.text

// Identifier une potion la révèle et tire son vieillissement, une fois pour toutes.
function reveal(item: KnItem): KnItem | undefined {
  const entry = knConsumableEntry(props.loot, item)
  return entry ? knIdentifyPotion(item, entry, knRollDie(KN_AGING_DIE)) : undefined
}

function replace(item: KnItem) {
  character.value.inventory = inventory.value.map(candidate => candidate.id === item.id ? item : candidate)
}

// Une pierre de Borestia identifie les potions sans test de Médecine.
function identifyNow(item: KnItem) {
  const known = reveal(item)
  if (!known) return
  replace(known)
  toast.add({ title: known.name, description: agingOf(known)?.text, color: 'success' })
}

function startIdentify(item: KnItem) {
  if (knMagicIdentifiesPotions(inventory.value)) {
    identifyNow(item)
    return
  }
  pendingCheck.value = {
    id: ++checkSeq,
    request: { id: knCheckId('medicine'), note: `Identifier : ${item.name}` },
    done: (success) => {
      const current = inventory.value.find(candidate => candidate.id === item.id)
      if (!current || !isUnknownPotion(current)) return
      if (!success) {
        toast.add({ title: 'Identification manquée', description: 'Il ne reste qu\'à la boire pour voir.', color: 'warning' })
        return
      }
      const known = reveal(current)
      if (!known) return
      replace(known)
      toast.add({ title: known.name, description: agingOf(known)?.text, color: 'success' })
    },
  }
}

// Employer un fragment ou boire une potion : ses effets s'appliquent à la fiche, et un exemplaire s'en va. Une potion bue
// sans être identifiée se révèle à ce moment, vieillissement compris.
function use(item: KnItem) {
  const entry = knConsumableEntry(props.loot, item)
  if (!entry) return
  const known = isUnknownPotion(item) ? reveal(item) : item
  if (!known) return
  const plan = knPlanConsumable(entry, item.kind === 'potion' ? agingOf(known) : undefined)
  character.value.inventory = knSpendConsumable(inventory.value.map(candidate => candidate.id === known.id ? known : candidate), known.id)

  const title = `${item.kind === 'potion' ? 'Potion bue' : 'Fragment utilisé'} : ${entry.title ?? known.name}`
  applyEffects(plan.effects, title, plan.scale ? { scale: plan.scale } : {})
  toast.add({ title, description: [entry.text, plan.aging?.text].filter(Boolean).join(' — '), color: 'info', duration: 15000 })
  if (plan.roll) {
    const rolled = knRollDice(plan.roll.dice)
    toast.add({ title: plan.roll.label, description: `${knDiceLabel(plan.roll.dice)} → ${rolled.total}`, color: 'info', duration: 15000 })
  }
  if (plan.enduranceCheck) {
    pendingCheck.value = {
      id: ++checkSeq,
      request: { id: knCheckId('endurance'), note: `${title} : la potion a tourné au poison` },
      done: (success) => {
        if (!success) applyEffects(KN_POTION_POISON, 'Empoisonné par la potion')
      },
    }
  }
}
</script>
