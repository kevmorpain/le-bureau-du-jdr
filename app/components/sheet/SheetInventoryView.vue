<template>
  <div
    class="inventory"
    :class="{ 'inventory--weighted': encumbranceVariant }"
  >
    <section class="inventory__main">
      <div class="inventory__summary">
        <DsBlock
          v-if="encumbranceVariant"
          :ribbon="$t('sheet.inventory.load')"
          class="inventory__load"
        >
          <div class="row">
            <span class="ds-number row__value">{{ formatWeightKg(encumbrance.weightG) }}</span>
            <span class="row__hint">{{ $t('sheet.inventory.load_of', { capacity: formatWeightKg(encumbrance.capacityG) }) }}</span>
          </div>
          <div
            class="load-bar"
            role="meter"
            :aria-valuenow="encumbrance.weightG"
            :aria-valuemax="encumbrance.capacityG"
            :aria-label="$t('sheet.inventory.load')"
          >
            <span
              class="load-bar__fill"
              :class="{ 'load-bar__fill--over': encumbrance.level !== 'none' }"
              :style="{ width: `${loadPercent}%` }"
            />
          </div>
          <p
            v-if="encumbrance.level !== 'none'"
            class="row__hint row__hint--bad"
          >
            {{ ENCUMBRANCE_LABELS[encumbrance.level] }}
          </p>
        </DsBlock>

        <DsBlock
          :ribbon="$t('sheet.inventory.purse')"
          class="inventory__purse"
        >
          <button
            type="button"
            class="coins"
            :aria-label="$t('sheet.inventory.manage_purse')"
            @click="isPurseOpen = true"
          >
            <span
              v-for="key in COIN_KEYS"
              :key="key"
              class="coin"
            >
              <span class="ds-number coin__value">{{ purse[key] }}</span>
              <span
                class="ds-label coin__label"
                :class="`coin__label--${key}`"
              >{{ $t(`sheet.inventory.coins.${key}`) }}</span>
            </span>
          </button>
        </DsBlock>

        <DsBlock
          :ribbon="$t('sheet.inventory.attuned')"
          class="inventory__attuned"
        >
          <div class="row">
            <DsCounter
              :model-value="attunedCount"
              :max="ATTUNEMENT_LIMIT"
              :aria-label="$t('sheet.inventory.attuned')"
              readonly
            />
            <span class="row__hint">{{ $t('ds.count_of', { value: attunedCount, max: ATTUNEMENT_LIMIT }) }}</span>
          </div>
        </DsBlock>
      </div>

      <div class="inventory__toolbar">
        <DsCategoryTabs
          v-model="category"
          :options="categoryOptions"
          :label="$t('sheet.inventory.categories_label')"
          class="inventory__tabs"
        />
        <DsLinkButton
          plus
          :label="$t('sheet.inventory.add')"
          @click="handleOpenAdd"
        />
      </div>

      <div
        class="list-head"
        aria-hidden="true"
      >
        <span class="list-head__name">{{ $t('sheet.inventory.columns.item') }}</span>
        <span class="list-head__qty">{{ $t('sheet.inventory.columns.quantity') }}</span>
        <span
          v-if="encumbranceVariant"
          class="list-head__weight"
        >{{ $t('sheet.inventory.columns.weight') }}</span>
        <span class="list-head__state">{{ $t('sheet.inventory.columns.state') }}</span>
      </div>

      <p
        v-if="!groups.length"
        class="inventory__empty"
      >
        {{ inventory.length ? $t('sheet.inventory.empty_filtered') : $t('sheet.inventory.empty') }}
      </p>

      <section
        v-for="group in groups"
        :key="group.key"
        class="group"
        :aria-label="$t(`sheet.inventory.groups.${group.key}`)"
      >
        <DsGroupTitle :label="$t(`sheet.inventory.groups.${group.key}`)" />
        <button
          v-for="entry in group.entries"
          :key="entry.id"
          type="button"
          class="item-row"
          :class="{ 'item-row--selected': entry.id === selectedId }"
          :aria-pressed="entry.id === selectedId"
          @click="handleSelect(entry.id)"
        >
          <DsIcon
            :name="entry.item?.itemType === 'weapon' ? 'weapon' : 'item'"
            :size="15"
            class="item-row__icon"
          />
          <span class="item-row__name">
            <b>{{ entry.item?.name }}</b>
            <small>{{ entry.item ? itemKindLabel(entry.item) : '' }}</small>
          </span>
          <span class="item-row__qty">{{ entry.quantity }}</span>
          <span
            v-if="encumbranceVariant"
            class="item-row__weight"
          >{{ entryWeightG(entry) ? formatWeightKg(entryWeightG(entry)) : '—' }}</span>
          <span class="item-row__state">
            <DsBadge
              :variant="inventoryStateOf(entry)"
              :label="$t(`sheet.inventory.states.${inventoryStateOf(entry)}`)"
            />
          </span>
        </button>
      </section>
    </section>

    <SheetPlayDrawer
      v-if="selectedEntry && selectedCard && selectedDetail"
      class="inventory__drawer"
      :card="selectedCard"
      :detail="selectedDetail"
      :actions="[]"
      @close="selectedId = null"
      @set-remaining="handleSetRemaining"
    >
      <DsGroupTitle :label="$t('sheet.inventory.management')" />
      <dl class="manage">
        <dt>{{ $t('sheet.inventory.columns.state') }}</dt>
        <dd>
          <DsBadge
            :variant="inventoryStateOf(selectedEntry)"
            :label="$t(`sheet.inventory.states.${inventoryStateOf(selectedEntry)}`)"
          />
        </dd>
        <dt>{{ $t('sheet.inventory.columns.quantity') }}</dt>
        <dd>
          <DsNumberField
            :model-value="selectedEntry.quantity"
            :label="$t('sheet.inventory.columns.quantity')"
            :min="1"
            :width="64"
            @update:model-value="handleQuantityChange"
          />
        </dd>
        <dt>{{ $t('sheet.inventory.storage') }}</dt>
        <dd>{{ $t(`sheet.inventory.groups.${inventoryGroupOf(selectedEntry)}`) }}</dd>
        <template v-if="encumbranceVariant">
          <dt>{{ $t('sheet.inventory.columns.weight') }}</dt>
          <dd>{{ entryWeightG(selectedEntry) ? formatWeightKg(entryWeightG(selectedEntry)) : '—' }}</dd>
        </template>
      </dl>
      <p
        v-if="isAttunementBlocked"
        class="manage__note"
      >
        {{ $t('sheet.inventory.attunement_full', { max: ATTUNEMENT_LIMIT }) }}
      </p>

      <template #actions>
        <DsButton
          v-for="action in selectedActions"
          :key="action.key"
          :label="action.label"
          :variant="action.variant"
          :disabled="action.isDisabled"
          block
          class="inventory__action"
          @click="handleAction(action.key)"
        />
      </template>
    </SheetPlayDrawer>

    <DsConfirmModal
      v-model:open="isRemoveOpen"
      :title="$t('sheet.inventory.remove.title')"
      :confirm-label="$t('sheet.inventory.remove.confirm')"
      @confirm="handleConfirmRemove"
    >
      <p>{{ $t('sheet.inventory.remove.body', { name: selectedEntry?.item?.name ?? '', n: selectedEntry?.quantity ?? 1 }, selectedEntry?.quantity ?? 1) }}</p>
    </DsConfirmModal>

    <ClientOnly>
      <SheetAddItemWindow
        v-model:open="isAddOpen"
        :character-sheet="characterSheet"
        :edit-item="editingItem"
      />
      <SheetPurseWindow
        v-model:open="isPurseOpen"
        v-model:character-sheet="characterSheet"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import type { SlotsByType } from '~/composables/character/useCharacterSpellcasting'
import type { InventoryEntry, InventoryItem } from '~/composables/character/useCharacterInventory'
import { useInventoryActions } from '~/composables/character/useInventoryActions'
import { useInventoryDetails } from '~/composables/character/useInventoryDetails'
import { usePurse } from '~/composables/character/usePurse'
import { useSpellCasting } from '~/composables/character/useSpellCasting'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_GROUPS,
  entryWeightG,
  inventoryCategoryOf,
  inventoryGroupOf,
  inventoryStateOf,
  isConsumable,
  isMagicEntry,
  itemKindLabel,
  type InventoryCategory,
} from '~/utils/inventoryView'
import { ATTUNEMENT_LIMIT, canAttune } from '~~/shared/rules/attunement'
import { COIN_KEYS } from '~~/shared/rules/currency'
import { ENCUMBRANCE_LABELS, formatWeightKg } from '~~/shared/rules/encumbrance'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()
const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!
const sheet = useCharacterSheet(characterSheet)
const { inventory, encumbrance, encumbranceVariant, attunedCount, toggleAttuned, removeItem, updateInventoryEntry, toggleEquipped, equippedWeaponStats } = sheet
const spellCasting = useSpellCasting(characterSheet, { ...sheet, spellSlots })
const { getCard, getInventoryDetail } = useInventoryDetails({ ...sheet, spellSlots, spellCasting, equippedWeaponStats })
const { toggleEquippedEntry, setQuantity, setCharges } = useInventoryActions({ inventory, updateInventoryEntry, toggleEquipped })
const { purse } = usePurse(characterSheet)

const entries = computed(() => (inventory.value ?? []).filter((entry): entry is InventoryEntry & { item: InventoryItem } => !!entry.item))

const category = ref<InventoryCategory | 'all'>('all')
const categoryOptions = computed(() => [
  { value: 'all' as const, label: t('sheet.inventory.categories.all'), count: entries.value.length },
  ...INVENTORY_CATEGORIES.map(key => ({
    value: key,
    label: t(`sheet.inventory.categories.${key}`),
    count: entries.value.filter(entry => inventoryCategoryOf(entry) === key).length,
  })),
])

const groups = computed(() => {
  const visible = entries.value
    .filter(entry => category.value === 'all' || inventoryCategoryOf(entry) === category.value)
    .sort((a, b) => a.item.name.localeCompare(b.item.name, 'fr'))
  return INVENTORY_GROUPS
    .map(key => ({ key, entries: visible.filter(entry => inventoryGroupOf(entry) === key) }))
    .filter(group => group.entries.length)
})

const loadPercent = computed(() => Math.min(100, (encumbrance.value.weightG / Math.max(1, encumbrance.value.capacityG)) * 100))

const selectedId = ref<number | null>(null)
const selectedEntry = computed(() => entries.value.find(entry => entry.id === selectedId.value) ?? null)
const selectedCard = computed(() => (selectedEntry.value ? getCard(selectedEntry.value) : null))
const selectedDetail = computed(() => (selectedEntry.value && selectedCard.value ? getInventoryDetail(selectedEntry.value, selectedCard.value) : null))

const handleSelect = (id: number) => {
  selectedId.value = selectedId.value === id ? null : id
}

const isAttunementBlocked = computed(() =>
  !!selectedEntry.value?.item.requiresAttunement && !selectedEntry.value.attuned && !canAttune(attunedCount.value))

type InventoryActionKey = 'equip' | 'attune' | 'use' | 'edit' | 'remove'

const canEquip = (entry: InventoryEntry & { item: InventoryItem }) =>
  entry.item.itemType === 'weapon' || entry.item.itemType === 'armor' || isMagicEntry(entry)

const selectedActions = computed(() => {
  const entry = selectedEntry.value
  if (!entry) return []
  const actions: { key: InventoryActionKey, label: string, variant: 'primary' | 'secondary', isDisabled: boolean }[] = []
  if (isConsumable(entry.item)) actions.push({ key: 'use', label: t('sheet.inventory.actions.use'), variant: 'primary', isDisabled: false })
  if (canEquip(entry)) actions.push({ key: 'equip', label: t(entry.equipped ? 'sheet.inventory.actions.stow' : 'sheet.inventory.actions.equip'), variant: actions.length ? 'secondary' : 'primary', isDisabled: false })
  if (entry.item.requiresAttunement) {
    actions.push({ key: 'attune', label: t(entry.attuned ? 'sheet.inventory.actions.unattune' : 'sheet.inventory.actions.attune'), variant: 'secondary', isDisabled: isAttunementBlocked.value })
  }
  if (entry.item.isCustom) actions.push({ key: 'edit', label: t('sheet.inventory.actions.edit'), variant: 'secondary', isDisabled: false })
  actions.push({ key: 'remove', label: t('sheet.inventory.actions.remove'), variant: 'secondary', isDisabled: false })
  return actions
})

const isRemoveOpen = ref(false)
const isAddOpen = ref(false)
const isPurseOpen = ref(false)
const editingItem = ref<InventoryItem | null>(null)

const handleOpenAdd = () => {
  editingItem.value = null
  isAddOpen.value = true
}

watch(isAddOpen, (isOpen) => {
  if (!isOpen) editingItem.value = null
})

const handleAction = async (key: InventoryActionKey) => {
  const entry = selectedEntry.value
  if (!entry) return
  if (key === 'equip') await toggleEquippedEntry(entry)
  else if (key === 'attune') await toggleAttuned(entry.id)
  else if (key === 'edit') {
    editingItem.value = entry.item
    isAddOpen.value = true
  } else if (key === 'remove') isRemoveOpen.value = true
  // Using the last one removes the entry: that is a deletion, so it is confirmed.
  else if (key === 'use') {
    if (entry.quantity > 1) await setQuantity(entry, entry.quantity - 1)
    else isRemoveOpen.value = true
  }
}

const handleConfirmRemove = async () => {
  if (!selectedEntry.value) return
  const id = selectedEntry.value.id
  selectedId.value = null
  await removeItem(id)
}

const handleQuantityChange = (quantity: number | null) => {
  if (selectedEntry.value && quantity && quantity >= 1) void setQuantity(selectedEntry.value, quantity)
}

const handleSetRemaining = (remaining: number) => {
  const entry = selectedEntry.value
  if (entry) void setCharges(entry, (entry.item.maxUses ?? 0) - remaining)
}
</script>

<style scoped>
.inventory {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
}

.inventory__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.inventory__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.inventory__load { flex: 1.3 1 180px; }
.inventory__purse { flex: 1.6 1 220px; }
.inventory__attuned { flex: 1 1 150px; }

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.row__value { font-size: 18px; }

.row__hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.row__hint--bad { color: var(--color-ds-bad); }

.load-bar {
  height: 8px;
  background: var(--color-ds-panel-raised);
}

.load-bar__fill {
  display: block;
  height: 100%;
  background: var(--color-ds-gold);
  transition: width 0.3s ease;
}

.load-bar__fill--over { background: var(--color-ds-bad); }

.coins {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
  width: 100%;
}

.coin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 0;
  background: var(--color-ds-panel-raised);
}

.coins:hover .coin { box-shadow: inset 0 0 0 1px var(--color-ds-gold-dim); }

.coin__value { font-size: 15px; }
.coin__label { font-size: 9.5px; }
.coin__label--pp { color: var(--color-coin-pp); }
.coin__label--po { color: var(--color-coin-po); }
.coin__label--pe { color: var(--color-coin-pe); }
.coin__label--pa { color: var(--color-coin-pa); }
.coin__label--pc { color: var(--color-coin-pc); }

.inventory__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
}

.inventory__tabs {
  flex: 1;
  min-width: 0;
}

.list-head,
.item-row {
  display: grid;
  align-items: center;
  gap: 8px;
}

.item-row { grid-template-columns: 22px minmax(0, 1fr) 40px 84px; }
.list-head { grid-template-columns: minmax(0, 1fr) 40px 84px; }
.inventory--weighted .item-row { grid-template-columns: 22px minmax(0, 1fr) 40px 60px 84px; }
.inventory--weighted .list-head { grid-template-columns: minmax(0, 1fr) 40px 60px 84px; }

.list-head {
  padding: 0 8px 4px 38px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ds-faint);
  border-bottom: 1px solid var(--color-ds-line);
}

.list-head__qty,
.list-head__weight,
.list-head__state { text-align: right; }

.inventory__empty {
  padding: 12px 4px;
  font-size: 13px;
  color: var(--color-ds-mute);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-row {
  padding: 7px 8px;
  text-align: left;
  color: var(--color-ds-ink);
  border-bottom: 1px solid var(--color-ds-line);
}

.item-row:hover { background: var(--color-ds-panel); }

.item-row--selected {
  background: var(--color-ds-panel-raised);
  box-shadow: inset 3px 0 0 var(--color-ds-gold);
}

.item-row__icon { color: var(--color-ds-mute); }

.item-row__name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-row__name b { font-size: 13px; }

.item-row__name small {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.item-row__qty,
.item-row__weight {
  font-size: 12.5px;
  text-align: right;
  color: var(--color-ds-mute);
}

.item-row__state {
  display: flex;
  justify-content: flex-end;
}

.manage {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 6px 12px;
  padding: 8px 10px;
  font-size: 12px;
  background: var(--color-ds-panel-raised);
}

.manage dt {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.manage__note {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.inventory__action { width: 240px; }

/* The whole page scrolls here, not the list: the drawer stays in view, its body scrolls inside. */
.inventory__drawer {
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100dvh - 24px);
}
</style>
