<template>
  <div class="play">
    <section class="play__main">
      <DsCategoryTabs
        v-model="kind"
        :options="kindOptions"
        :label="$t('sheet.play.filters.kind')"
      />

      <div class="play__row">
        <span class="ds-label">{{ $t('sheet.play.filters.cost') }}</span>
        <DsSegmented
          v-model="cost"
          :options="costOptions"
          :label="$t('sheet.play.filters.cost')"
          class="play__cost"
        >
          <template #option="{ option }">
            <DsCostTag
              v-if="option.value !== 'all' && option.value !== 'other'"
              :cost="option.value"
            />
            {{ option.label }}
          </template>
        </DsSegmented>
        <DsTextField
          v-model="search"
          :label="$t('sheet.play.filters.search')"
          :placeholder="$t('sheet.play.filters.search')"
          icon="search"
          :width="150"
          class="play__search"
        />
      </div>

      <div
        v-if="facetOptions.length"
        class="play__row"
      >
        <span class="ds-label">{{ $t(`sheet.play.facet_titles.${kind}`) }}</span>
        <DsChips
          v-model="facets"
          :options="facetOptions"
          :label="$t(`sheet.play.facet_titles.${kind}`)"
        />
      </div>

      <p
        v-if="!groups.length"
        class="play__empty"
      >
        {{ cards.length ? $t('sheet.play.empty_filtered') : $t('sheet.play.empty') }}
      </p>

      <section
        v-for="group in groups"
        :key="group.cost"
        class="play__group"
        :aria-label="$t(`sheet.play.costs.${group.cost}`)"
      >
        <DsGroupTitle class="play__group-title">
          <DsCostTag
            v-if="group.cost !== 'other'"
            :cost="group.cost"
          />
          {{ $t(`sheet.play.costs.${group.cost}`) }}
        </DsGroupTitle>
        <div
          class="play__grid"
          :class="{ 'play__grid--narrow': selectedCard }"
        >
          <SheetPlayCard
            v-for="card in group.cards"
            :key="card.key"
            :card="card"
            :facts="getFacts(card)"
            :is-selected="card.key === selectedKey"
            @click="handleSelect(card.key)"
          />
        </div>
      </section>
    </section>

    <SheetPlayDrawer
      v-if="selectedCard && selectedDetail"
      v-model:selected-slot-key="selectedSlotKey"
      :card="selectedCard"
      :detail="selectedDetail"
      :actions="selectedActions"
      :warning="selectedCard.kind === 'spell' ? spellcastingBlockedWarning : null"
      @close="selectedKey = null"
      @action="handleAction"
      @set-remaining="handleSetRemaining"
    />
  </div>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import type { SlotsByType } from '~/composables/character/useCharacterSpellcasting'
import { useClassResources } from '~/composables/character/useClassResources'
import { usePlayCardDetails, type PlayActionKey } from '~/composables/character/usePlayCardDetails'
import { usePlayCards } from '~/composables/character/usePlayCards'
import { useSpellCasting } from '~/composables/character/useSpellCasting'
import { useWeaponAttacks } from '~/composables/character/useWeaponAttacks'
import { ACTION_COSTS, type ActionCost } from '~~/shared/rules/actionCost'
import {
  FACETS_BY_KIND,
  PLAY_CARD_ICONS,
  PLAY_CARD_KINDS,
  filterPlayCards,
  groupPlayCardsByCost,
  type PlayCard,
  type PlayCardKind,
  type PlayFacet,
} from '~/utils/playCards'

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()

const { t } = useI18n()
const characterSheetRef = toRef(() => characterSheet)
const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!

const sheet = useCharacterSheet(characterSheetRef)
const { resourceGroups, spellcastingBlockedWarning, updateInventoryEntry } = sheet
const spellCasting = useSpellCasting(characterSheetRef, { ...sheet, spellSlots })
const { cards, getSource } = usePlayCards({ ...sheet, spellSlots, spellCasting })
const { getCardFacts, getDetail, getActions } = usePlayCardDetails({ ...sheet, spellSlots, spellCasting })
const { roll } = useDiceRoller()
const { rollAttack, rollDamage, rollOffhandDamage } = useWeaponAttacks({ ...sheet, roll })
const { setFeatureSpent } = useClassResources(characterSheetRef, spellSlots)

const kind = ref<PlayCardKind | 'all'>('all')
const cost = ref<ActionCost | 'all'>('all')
const facets = ref<PlayFacet[]>([])
const search = ref('')

watch(kind, () => {
  facets.value = []
})

const kindOptions = computed(() => (['all', ...PLAY_CARD_KINDS] as const).map(value => ({
  value,
  label: t(`sheet.play.filters.kinds.${value}`),
  icon: value === 'all' ? undefined : PLAY_CARD_ICONS[value],
  count: value === 'all' ? cards.value.length : cards.value.filter(card => card.kind === value).length,
})))

const costOptions = computed<DsOption<ActionCost | 'all'>[]>(() => (['all', ...ACTION_COSTS] as const).map(value => ({
  value,
  label: t(`sheet.play.filters.costs.${value}`),
})))

const facetOptions = computed<DsOption<PlayFacet>[]>(() => FACETS_BY_KIND[kind.value].map(value => ({
  value,
  label: t(`sheet.play.facets.${value}`),
})))

const groups = computed(() => groupPlayCardsByCost(filterPlayCards(cards.value, {
  kind: kind.value,
  cost: cost.value,
  facets: facets.value,
  search: search.value,
})))

const getFacts = (card: PlayCard) => {
  const source = getSource(card.key)
  return source ? getCardFacts(card, source) : []
}

const selectedKey = ref<string | null>(null)
const selectedSlotKey = ref<string | null>(null)

const selectedCard = computed(() => cards.value.find(card => card.key === selectedKey.value) ?? null)
const selectedSource = computed(() => (selectedKey.value ? getSource(selectedKey.value) : undefined))
const selectedDetail = computed(() => (selectedCard.value && selectedSource.value ? getDetail(selectedCard.value, selectedSource.value) : null))
const selectedSlot = computed(() => selectedDetail.value?.slotOptions.find(slot => slot.key === selectedSlotKey.value) ?? null)
const selectedActions = computed(() => (selectedCard.value && selectedSource.value ? getActions(selectedCard.value, selectedSource.value, selectedSlot.value) : []))

const getDefaultSlotKey = () => selectedDetail.value?.slotOptions.find(slot => slot.current > 0)?.key ?? null

// After a cast empties the chosen slot level, the next cast falls back to the next level still available.
watch(() => selectedDetail.value?.slotOptions, (options) => {
  const selected = options?.find(slot => slot.key === selectedSlotKey.value)
  if (!selected || selected.current === 0) selectedSlotKey.value = getDefaultSlotKey()
})

const handleSelect = (key: string) => {
  selectedKey.value = selectedKey.value === key ? null : key
  selectedSlotKey.value = getDefaultSlotKey()
}

const handleSetRemaining = async (remaining: number) => {
  const card = selectedCard.value
  const source = selectedSource.value
  if (!card?.uses || !source) return
  const spent = card.uses.max - remaining
  if (source.kind === 'feature') {
    await setFeatureSpent(card.id, spent, resourceGroups.value.find(group => group.featureIds.includes(card.id)))
  } else if (source.kind === 'weapon' || source.kind === 'item') {
    await updateInventoryEntry(card.id, { currentUses: spent })
  }
}

const handleAction = (key: PlayActionKey) => {
  const card = selectedCard.value
  const source = selectedSource.value
  if (!card || !source) return
  if (source.kind === 'spell') {
    const characterSpell = source.characterSpell
    if (key === 'cast-slot' && selectedSlot.value) spellCasting.castWithSlot(characterSpell, selectedSlot.value.level, selectedSlot.value.slotType, null)
    else if (key === 'cast-cantrip') spellCasting.castCantrip(characterSpell)
    else if (key === 'cast-arcanum') void spellCasting.castArcanum(characterSpell)
    else if (key === 'cast-ritual') spellCasting.castAsRitual(characterSpell)
    else if (key === 'spell-damage') spellCasting.rollSpellEffect(characterSpell, spellCasting.getCastLevel(characterSpell))
    return
  }
  if (key === 'attack') rollAttack(card.id)
  else if (key === 'damage') rollDamage(card.id)
  else if (key === 'offhand-damage') rollOffhandDamage(card.id)
  else if (key === 'use' && card.uses) void handleSetRemaining(card.uses.remaining - 1)
}
</script>

<style scoped>
.play {
  display: flex;
  gap: 12px;
  min-height: 0;
}

.play__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.play__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.play__row .play__cost {
  width: auto;
}

.play__search {
  margin-left: auto;
}

.play__empty {
  font-size: 13px;
  color: var(--color-ds-mute);
}

.play__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.play__group-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.play__grid--narrow {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
