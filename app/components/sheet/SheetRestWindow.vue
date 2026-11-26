<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.rest.title')"
    width="lg"
  >
    <template #modes>
      <DsSegmented
        v-model="rest"
        :options="restOptions"
        :label="$t('sheet.rest.title')"
      />
    </template>

    <section
      v-if="rest === 'short'"
      class="section"
    >
      <div
        v-for="group in hitDice"
        :key="group.die"
        class="dice"
      >
        <DsGroupTitle :label="$t('sheet.rest.hit_dice_title', { die: group.die, modifier: formatModifier(conModifier) })" />
        <p class="hint">
          {{ $t('sheet.rest.hit_dice_summary', { chosen: chosenOf(group.die).length, left: group.remaining - chosenOf(group.die).length }) }}
        </p>
        <div class="dice__row">
          <DsHitDie
            v-for="index in group.total"
            :key="index"
            :die="`d${group.die}`"
            :spent="index > group.remaining"
            :chosen="isChosen(group.die, index)"
            :value="valueOf(group.die, index)"
            @click="handleToggleDie(group.die, index)"
          />
        </div>
      </div>
      <p
        v-if="!hitDice.length"
        class="hint"
      >
        {{ $t('sheet.rest.no_hit_dice') }}
      </p>

      <div
        v-if="chosen.length && isManual"
        class="manual"
      >
        <label
          v-for="(die, index) in chosen"
          :key="die.key"
          class="manual__roll"
        >
          <span>{{ $t('sheet.rest.die_n', { n: index + 1 }) }}</span>
          <DsNumberField
            v-model="die.value"
            :label="$t('sheet.rest.die_result', { n: index + 1 })"
            :min="1"
            :max="Number(die.die)"
            :placeholder="`d${die.die}`"
            :width="60"
          />
          <span>{{ formatModifier(conModifier) }}</span>
        </label>
      </div>
      <p
        v-else-if="chosen.length"
        class="rolls"
      >
        {{ $t('sheet.rest.rolls', { rolls: chosen.map(d => `${d.value} ${formatModifier(conModifier)}`).join(' · '), total: healing }) }}
      </p>
      <DsLinkButton
        v-if="rollsEnabled && hitDice.length"
        class="self-start"
        :label="isManual ? $t('sheet.rest.use_app') : $t('sheet.rest.enter_manually')"
        @click="handleToggleManual"
      />
    </section>

    <div class="preview">
      <p class="preview__value">
        <span class="ds-number">{{ $t('sheet.hit_points.preview', { from: characterSheet.currentHp, to: hpAfter.current }) }}</span>
        <span class="preview__max">/ {{ maxAfter }}</span>
      </p>
      <DsHpBar
        :max="maxAfter"
        :current="characterSheet.currentHp"
        :temp="characterSheet.temporaryHp ?? 0"
        :preview="hpAfter"
        legend
      />
    </div>

    <DsRibbon :label="$t(`sheet.rest.recap.title.${rest}`)" />
    <ul
      v-if="recap.length"
      class="recap"
    >
      <li
        v-for="row in recap"
        :key="row.key"
        class="recap__row"
      >
        <span>{{ row.label }}</span>
        <span
          v-if="row.kind === 'counter'"
          class="recap__value"
        >
          <DsCounter
            :model-value="row.after"
            :max="row.max"
            :regained="row.regained"
            :possible="row.possible"
            :aria-label="row.label"
            readonly
          />
          <span
            v-if="row.note"
            class="hint"
          >{{ row.note }}</span>
        </span>
        <span
          v-else
          class="recap__text"
        >{{ row.text }}</span>
      </li>
    </ul>
    <p
      v-else
      class="hint"
    >
      {{ $t('sheet.rest.recap.nothing') }}
    </p>
    <p class="legend">
      <span><DsDiamond state="filled" />{{ $t('sheet.rest.recap.legend.available') }}</span>
      <span><DsDiamond state="regained" />{{ $t('sheet.rest.recap.legend.regained') }}</span>
      <span><DsDiamond state="possible" />{{ $t('sheet.rest.recap.legend.possible') }}</span>
    </p>

    <DsCheckbox
      v-if="rest === 'long' && exhaustionLevel > 0"
      v-model="isFedAndWatered"
      :label="$t('sheet.rest.fed_and_watered', { from: exhaustionLevel, to: exhaustionLevel - 1 })"
    />
    <p class="hint">
      {{ $t(`sheet.rest.note.${rest}`) }}
    </p>

    <template #footer="{ close }">
      <DsLinkButton
        :label="$t('ds.cancel')"
        @click="close"
      />
      <DsButton
        :label="$t(`sheet.rest.confirm.${rest}`)"
        :disabled="isResting || !canConfirm"
        @click="handleConfirm(close)"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import type { SlotsByType } from '~/composables/character/useCharacterSpellcasting'
import { useRestRecap } from '~/composables/character/useRestRecap'
import { hitDiceTotals, remainingHitDice } from '~~/shared/rules/hitDice'
import type { RestType } from '~~/shared/utils/rest'

interface ChosenDie { key: string, die: string, index: number, value: number | null }

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!
const { abilityModifiers, exhaustionLevel, maxHitPointsFor, effectiveMaxHp, refreshInventory } = useCharacterSheet(characterSheet)
const { shortRest, longRest, dawn, isResting } = useRest(characterSheet, spellSlots, maxHitPointsFor, { onRested: refreshInventory })
const { recapFor } = useRestRecap(characterSheet, spellSlots)
const { roll, rollsEnabled } = useDiceRoller()

const rest = ref<RestType>('short')
const chosen = ref<ChosenDie[]>([])
const isManualChoice = ref(false)
const isFedAndWatered = ref(true)

const isManual = computed(() => isManualChoice.value || !rollsEnabled.value)

watch(open, (isOpen) => {
  if (!isOpen) return
  rest.value = 'short'
  chosen.value = []
  isManualChoice.value = false
  isFedAndWatered.value = true
})

const restOptions = computed<DsOption<RestType>[]>(() => (['short', 'long', 'dawn'] as const).map(value => ({ value, label: t(`sheet.rest.types.${value}`) })))

const conModifier = computed(() => abilityModifiers.value.con ?? 0)

const hitDice = computed(() => {
  const totals = hitDiceTotals((characterSheet.value.classes ?? []).map(cls => ({ level: cls.level, hitDice: cls.class?.hitDice })))
  const remaining = remainingHitDice(characterSheet.value.currentHitDie, totals)
  return totals.map(({ die, count }) => ({ die, total: count, remaining: remaining.find(r => r.die === die)?.count ?? count }))
})

const chosenOf = (die: string) => chosen.value.filter(d => d.die === die)
const findChosen = (die: string, index: number) => chosen.value.find(d => d.die === die && d.index === index)
const isChosen = (die: string, index: number) => !!findChosen(die, index)
const valueOf = (die: string, index: number) => findChosen(die, index)?.value ?? null

const rollDie = (die: string) => (isManual.value ? null : roll(t('sheet.rest.hit_die_roll', { die }), conModifier.value, Number(die), 1) - conModifier.value)

const handleToggleDie = (die: string, index: number) => {
  if (isChosen(die, index)) {
    chosen.value = chosen.value.filter(d => !(d.die === die && d.index === index))
    return
  }
  chosen.value = [...chosen.value, { key: `${die}-${index}`, die, index, value: rollDie(die) }]
}

const handleToggleManual = () => {
  isManualChoice.value = !isManualChoice.value
  chosen.value = chosen.value.map(d => ({ ...d, value: isManual.value ? null : rollDie(d.die) }))
}

// Each die heals its roll plus the Constitution modifier, never below zero.
const healOf = (die: ChosenDie) => Math.max(0, (die.value ?? 0) + conModifier.value)
const healing = computed(() => chosen.value.reduce((sum, die) => sum + healOf(die), 0))

const maxAfter = computed(() =>
  rest.value === 'long' ? maxHitPointsFor(isFedAndWatered.value ? Math.max(0, exhaustionLevel.value - 1) : exhaustionLevel.value) : effectiveMaxHp.value)

const hpAfter = computed(() => {
  const current = characterSheet.value.currentHp
  const temp = characterSheet.value.temporaryHp ?? 0
  if (rest.value === 'short') return { current: Math.min(maxAfter.value, current + healing.value), temp }
  if (rest.value === 'long') return { current: maxAfter.value, temp: 0 }
  return { current, temp }
})

const recap = computed(() => recapFor(rest.value, { fedAndWatered: isFedAndWatered.value }))

const canConfirm = computed(() => rest.value !== 'short' || chosen.value.every(die => die.value !== null))

const handleConfirm = async (close: () => void) => {
  if (!canConfirm.value) return
  if (rest.value === 'short') await shortRest(chosen.value.map(die => ({ die: die.die, count: 1, healAmount: healOf(die) })))
  else if (rest.value === 'long') await longRest(exhaustionLevel.value > 0 ? isFedAndWatered.value : true)
  else await dawn()
  close()
}
</script>

<style scoped>
.section,
.dice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section {
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
}

.dice__row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.manual {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.manual__roll {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}

.rolls { font-size: 13px; }

.preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 22px;
}

.preview__max {
  font-size: 13px;
  color: var(--color-ds-mute);
}

.recap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recap__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.recap__value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recap__text { color: var(--color-ds-mute); }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 11.5px;
  color: var(--color-ds-mute);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
