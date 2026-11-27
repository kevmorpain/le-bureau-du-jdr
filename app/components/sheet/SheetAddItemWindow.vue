<template>
  <DsModal
    v-model:open="open"
    :title="isEdit ? $t('sheet.add_item.edit_title') : $t('sheet.add_item.title')"
    :description="$t('sheet.add_item.description')"
    width="lg"
  >
    <template
      v-if="!isEdit"
      #modes
    >
      <DsSegmented
        v-model="tab"
        :options="tabOptions"
        :label="$t('sheet.add_item.mode')"
      />
    </template>

    <template v-if="tab === 'search' && !isEdit">
      <DsTextField
        v-model="query"
        :label="$t('sheet.add_item.search')"
        :placeholder="$t('sheet.add_item.search')"
        icon="search"
        width="full"
      />
      <DsSegmented
        v-model="typeFilter"
        :options="typeOptions"
        :label="$t('sheet.add_item.type_filter')"
      />
      <div class="catalog">
        <ul
          class="catalog__list"
          :aria-busy="isSearching"
        >
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="result"
            :class="{ 'result--focused': item.id === focusedId }"
          >
            <DsCheckbox
              :model-value="isSelected(item.id)"
              class="result__box"
              @update:model-value="handleToggle(item)"
            >
              <span class="sr-only">{{ $t('sheet.add_item.select', { name: item.name }) }}</span>
            </DsCheckbox>
            <button
              type="button"
              class="result__body"
              @click="focusedId = item.id"
            >
              <span class="result__name">{{ item.name }}</span>
              <span class="result__kind">{{ itemKindLabel(item) }}</span>
            </button>
          </li>
          <li
            v-if="!isSearching && !filteredItems.length"
            class="hint"
          >
            {{ $t('sheet.add_item.no_result') }}
          </li>
        </ul>
        <div
          v-if="focusedItem"
          class="catalog__preview"
        >
          <p class="ds-label">
            {{ $t(`sheet.inventory.types.${focusedItem.itemType}`) }} · {{ itemKindLabel(focusedItem) }}
          </p>
          <p class="preview__name">
            {{ focusedItem.name }}
          </p>
          <dl
            v-if="focusedFacts.length"
            class="preview__facts"
          >
            <div
              v-for="fact in focusedFacts"
              :key="fact.label"
            >
              <dt class="ds-label">
                {{ fact.label }}
              </dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
          <LightMarkdown
            v-if="focusedItem.description"
            :source="focusedItem.description"
            class="preview__description"
          />
        </div>
      </div>

      <template v-if="selection.length">
        <DsGroupTitle :label="$t('sheet.add_item.selection', selection.length)" />
        <div
          v-for="entry in selection"
          :key="entry.item.id"
          class="picked"
        >
          <span class="picked__name">{{ entry.item.name }}</span>
          <DsNumberField
            v-model="entry.quantity"
            :label="$t('sheet.add_item.quantity_of', { name: entry.item.name })"
            :min="1"
            :width="60"
          />
          <template v-if="entry.item.itemType === 'weapon' || entry.item.itemType === 'armor'">
            <DsSegmented
              v-model="entry.magicBonus"
              :options="MAGIC_BONUS_OPTIONS"
              :label="$t('sheet.add_item.magic_bonus_of', { name: entry.item.name })"
            />
            <DsCheckbox
              v-model="entry.equipped"
              :label="$t('sheet.add_item.equipped')"
            />
          </template>
          <DsCornerButton
            :label="$t('sheet.add_item.unselect', { name: entry.item.name })"
            class="picked__remove"
            @click="deselect(entry.item.id)"
          />
        </div>
      </template>
    </template>

    <form
      v-else
      class="create"
      @submit.prevent="handleSubmit"
    >
      <div class="fields">
        <label class="labelled labelled--grow">
          <span class="ds-label">{{ $t('sheet.add_item.fields.name') }}</span>
          <DsTextField
            v-model="form.name"
            :label="$t('sheet.add_item.fields.name')"
            width="full"
          />
        </label>
        <label
          v-if="!isEdit"
          class="labelled"
        >
          <span class="ds-label">{{ $t('sheet.add_item.fields.quantity') }}</span>
          <DsNumberField
            v-model="form.quantity"
            :label="$t('sheet.add_item.fields.quantity')"
            :min="1"
          />
        </label>
      </div>

      <div class="labelled">
        <span class="ds-label">{{ $t('sheet.add_item.fields.type') }}</span>
        <DsSegmented
          v-model="form.itemType"
          :options="createTypeOptions"
          :label="$t('sheet.add_item.fields.type')"
        />
      </div>

      <div
        v-if="form.itemType === 'weapon'"
        class="fields"
      >
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.damage_dice') }}</span>
          <DsTextField
            v-model="form.weaponProps.damage_dice"
            :label="$t('sheet.add_item.fields.damage_dice')"
            :width="90"
          />
        </label>
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.damage_type') }}</span>
          <DsSelectField
            v-model="form.weaponProps.damage_type"
            :options="DAMAGE_TYPE_OPTIONS"
            :label="$t('sheet.add_item.fields.damage_type')"
            :width="160"
          />
        </label>
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.weapon_category') }}</span>
          <DsSelectField
            v-model="form.weaponProps.weapon_category"
            :options="WEAPON_CATEGORY_OPTIONS"
            :label="$t('sheet.add_item.fields.weapon_category')"
            :width="230"
          />
        </label>
      </div>

      <div
        v-else-if="form.itemType === 'armor'"
        class="fields"
      >
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.armor_type') }}</span>
          <DsSelectField
            v-model="form.armorProps.armor_type"
            :options="ARMOR_TYPE_OPTIONS"
            :label="$t('sheet.add_item.fields.armor_type')"
            :width="200"
          />
        </label>
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.base_ac') }}</span>
          <DsNumberField
            v-model="form.armorProps.base_ac"
            :label="$t('sheet.add_item.fields.base_ac')"
            :min="0"
          />
        </label>
        <DsCheckbox
          v-model="form.armorProps.stealth_disadvantage"
          :label="$t('sheet.add_item.fields.stealth_disadvantage')"
          class="labelled--end"
        />
      </div>

      <div
        v-else-if="form.itemType === 'equipment'"
        class="fields"
      >
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.category') }}</span>
          <DsSelectField
            v-model="form.category"
            :options="EQUIPMENT_CATEGORY_OPTIONS"
            :label="$t('sheet.add_item.fields.category')"
            :width="220"
          />
        </label>
        <label
          v-if="form.category === OTHER_CATEGORY"
          class="labelled labelled--grow"
        >
          <span class="ds-label">{{ $t('sheet.add_item.fields.category_other') }}</span>
          <DsTextField
            v-model="form.categoryOther"
            :label="$t('sheet.add_item.fields.category_other')"
            width="full"
          />
        </label>
      </div>

      <label
        v-else
        class="labelled"
      >
        <span class="ds-label">{{ $t('sheet.add_item.fields.tool_type') }}</span>
        <DsSelectField
          v-model="form.toolType"
          :options="TOOL_TYPE_OPTIONS"
          :label="$t('sheet.add_item.fields.tool_type')"
          :width="220"
        />
      </label>

      <div class="fields">
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.weight') }}</span>
          <DsNumberField
            v-model="form.weightKg"
            :label="$t('sheet.add_item.fields.weight')"
            :min="0"
            :step="0.1"
            :width="90"
          />
        </label>
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.price') }}</span>
          <DsNumberField
            v-model="form.costPo"
            :label="$t('sheet.add_item.fields.price')"
            :min="0"
            :step="0.01"
            :width="90"
          />
        </label>
      </div>

      <DsGroupTitle :label="$t('sheet.add_item.charges')" />
      <div class="fields">
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.add_item.fields.max_uses') }}</span>
          <DsNumberField
            v-model="form.maxUses"
            :label="$t('sheet.add_item.fields.max_uses')"
            :min="0"
          />
        </label>
        <template v-if="form.maxUses">
          <label class="labelled">
            <span class="ds-label">{{ $t('sheet.add_item.fields.recharge') }}</span>
            <DsSelectField
              v-model="form.rechargeType"
              :options="RECHARGE_TYPE_OPTIONS.map(option => ({ ...option }))"
              :label="$t('sheet.add_item.fields.recharge')"
              :width="160"
            />
          </label>
          <div
            v-if="form.rechargeType !== 'none'"
            class="labelled"
          >
            <span class="ds-label">{{ $t('sheet.add_item.fields.recharge_mode') }}</span>
            <DsSegmented
              v-model="form.rechargeMode"
              :options="rechargeModeOptions"
              :label="$t('sheet.add_item.fields.recharge_mode')"
            />
          </div>
          <label
            v-if="form.rechargeType !== 'none' && form.rechargeMode === 'dice'"
            class="labelled"
          >
            <span class="ds-label">{{ $t('sheet.add_item.fields.recharge_dice') }}</span>
            <DsTextField
              v-model="form.rechargeDice"
              :label="$t('sheet.add_item.fields.recharge_dice')"
              :width="90"
            />
          </label>
        </template>
      </div>

      <DsGroupTitle :label="$t('sheet.add_item.effects')" />
      <template
        v-for="(effect, index) in form.effects"
        :key="index"
      >
        <SheetEffectRow
          v-if="isEditableEffect(effect)"
          v-model="form.effects[index]!"
          @remove="form.effects.splice(index, 1)"
        />
      </template>
      <p
        v-if="keptEffectLabels.length"
        class="hint"
      >
        {{ $t('sheet.add_item.kept_effects', { effects: keptEffectLabels.join(', ') }) }}
      </p>
      <div class="effect-types">
        <DsLinkButton
          v-for="option in effectTypeOptions"
          :key="option.value"
          plus
          :label="option.label"
          @click="handleAddEffect(option.value)"
        />
      </div>

      <label class="labelled">
        <span class="ds-label">{{ $t('sheet.add_item.fields.description') }}</span>
        <DsTextArea
          v-model="form.description"
          :label="$t('sheet.add_item.fields.description')"
          :rows="3"
        />
      </label>
    </form>

    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ $t(`sheet.add_item.errors.${error}`) }}
    </p>

    <template #footer="{ close }">
      <DsLinkButton
        :label="$t('ds.cancel')"
        @click="close"
      />
      <DsButton
        :label="submitLabel"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import type { Effect, EffectType } from '~~/server/db/schema/effects'
import type { WeaponProperties, ArmorProperties } from '~~/server/db/schema/items'
import { weaponPropertyLabels } from '~~/shared/utils/item'
import { TEMPORARY_EFFECT_TYPES } from '~~/shared/utils/temporary_effects'
import type { InventoryItem } from '~/composables/character/useCharacterInventory'
import {
  ARMOR_TYPE_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
  EQUIPMENT_CATEGORY_OPTIONS,
  MAGIC_BONUS_OPTIONS,
  OTHER_CATEGORY,
  RECHARGE_TYPE_OPTIONS,
  TOOL_TYPE_OPTIONS,
  WEAPON_CATEGORY_OPTIONS,
  useAddItems,
  useCustomItemForm,
  useItemCatalogSearch,
  type AddItemsError,
  type CatalogItem,
  type CatalogItemType,
} from '~/composables/character/useItemCatalog'
import { armorClassSummary, itemKindLabel, weaponDamageSummary, weaponRangeSummary } from '~/utils/inventoryView'

const { characterSheet, editItem = null } = defineProps<{
  characterSheet: CharacterSheet
  editItem?: InventoryItem | null
}>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { query, typeFilter, filteredItems, isSearching, fetchItems, selection, isSelected, toggle, deselect, reset: resetSearch } = useItemCatalogSearch()
const { form, buildItemBody, reset: resetForm, prefill } = useCustomItemForm()
const { addSelection, createAndAdd, updateCustomItem } = useAddItems(toRef(() => characterSheet))

const isEdit = computed(() => !!editItem)
const tab = ref<'search' | 'create'>('search')
const tabOptions = computed(() => [
  { value: 'search' as const, label: t('sheet.add_item.tabs.search') },
  { value: 'create' as const, label: t('sheet.add_item.tabs.create') },
])

const ITEM_TYPES = ['weapon', 'armor', 'equipment', 'tool'] as const satisfies CatalogItemType[]
const typeOptions = computed(() => [
  { value: 'all' as const, label: t('sheet.add_item.types_all') },
  ...ITEM_TYPES.map(value => ({ value, label: t(`sheet.add_item.types.${value}`) })),
])
const createTypeOptions = computed(() => ITEM_TYPES.map(value => ({ value, label: t(`sheet.inventory.types.${value}`) })))
const rechargeModeOptions = computed(() => [
  { value: 'full' as const, label: t('sheet.add_item.recharge_modes.full') },
  { value: 'dice' as const, label: t('sheet.add_item.recharge_modes.dice') },
])

const focusedId = ref<number | null>(null)
const focusedItem = computed(() => filteredItems.value.find(item => item.id === focusedId.value) ?? filteredItems.value[0] ?? null)
const focusedFacts = computed(() => {
  const item = focusedItem.value
  if (!item) return []
  const asItem = item as unknown as InventoryItem
  if (item.itemType === 'weapon') {
    const range = weaponRangeSummary(asItem)
    return [
      { label: t('sheet.play.tiles.damage'), value: weaponDamageSummary(asItem) },
      ...(range ? [{ label: t('sheet.play.tiles.range'), value: range }] : []),
      ...((item.properties as unknown as WeaponProperties).weapon_properties.length
        ? [{ label: t('sheet.add_item.properties'), value: (item.properties as unknown as WeaponProperties).weapon_properties.map(property => weaponPropertyLabels[property] ?? property).join(', ') }]
        : []),
    ]
  }
  if (item.itemType === 'armor') {
    const props = item.properties as unknown as ArmorProperties
    return [
      { label: t('sheet.inventory.tiles.armor_class'), value: armorClassSummary(asItem) },
      { label: t('sheet.inventory.tiles.stealth'), value: props.stealth_disadvantage ? t('sheet.inventory.stealth_disadvantage') : t('sheet.inventory.stealth_ok') },
    ]
  }
  return []
})

const handleToggle = (item: CatalogItem) => {
  toggle(item)
  focusedId.value = item.id
}

const effectTypeOptions = EFFECT_TYPE_OPTIONS.filter(option => TEMPORARY_EFFECT_TYPES.includes(option.value as typeof TEMPORARY_EFFECT_TYPES[number]))
const isEditableEffect = (effect: Effect) => TEMPORARY_EFFECT_TYPES.includes(effect.type as typeof TEMPORARY_EFFECT_TYPES[number])
const keptEffectLabels = computed(() => form.value.effects
  .filter(effect => !isEditableEffect(effect))
  .map(effect => EFFECT_TYPE_OPTIONS.find(option => option.value === effect.type)?.label ?? effect.type))
const handleAddEffect = (type: EffectType) => {
  form.value.effects.push({ type, value: defaultEffectValue(type) } as Effect)
}

const canSubmit = computed(() =>
  tab.value === 'search' && !isEdit.value ? selection.value.length > 0 : form.value.name.trim().length > 0)

const submitLabel = computed(() => {
  if (isEdit.value) return t('sheet.add_item.save')
  if (tab.value === 'search') return selection.value.length ? t('sheet.add_item.add_n', selection.value.length) : t('sheet.add_item.add')
  return t('sheet.add_item.add')
})

const isSubmitting = ref(false)
const error = ref<AddItemsError | 'unknown' | null>(null)

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  error.value = null
  try {
    if (editItem) error.value = await updateCustomItem(editItem.id, buildItemBody())
    else if (tab.value === 'search') await addSelection(selection.value)
    else error.value = await createAndAdd(buildItemBody(), form.value.quantity || 1)
    if (!error.value) open.value = false
  } catch {
    error.value = 'unknown'
  } finally {
    isSubmitting.value = false
  }
}

watch(typeFilter, fetchItems)

watch(open, (isOpen) => {
  error.value = null
  if (!isOpen) {
    resetSearch()
    resetForm()
    tab.value = 'search'
    focusedId.value = null
    return
  }
  if (editItem) prefill(editItem)
  else void fetchItems()
})
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.error {
  font-size: 12.5px;
  color: var(--color-ds-bad);
}

.catalog {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 220px;
}

.catalog__list {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-bottom: 1px solid var(--color-ds-line);
}

.result--focused { background: var(--color-ds-panel-raised); }

.result__box { flex-shrink: 0; }

.result__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  text-align: left;
  color: inherit;
}

.result__name {
  font-size: 13px;
  font-weight: 700;
}

.result__kind {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.catalog__preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
}

.preview__name {
  font-family: var(--font-bodoni);
  font-size: 20px;
  font-weight: 700;
}

.preview__facts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}

.preview__description {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}

.picked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-ds-line);
}

.picked__name {
  flex: 1;
  min-width: 140px;
  font-weight: 700;
}

.create {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 14px;
}

.labelled {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.labelled--grow {
  flex: 1;
  align-items: stretch;
}

.labelled--end { align-self: flex-end; }

.effect-types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
</style>
