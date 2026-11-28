<template>
  <aside class="rail">
    <DsFrame shape="stepped">
      <div class="identity">
        <SheetIdentityHead :character-sheet="characterSheet" />

        <SheetVitals :character-sheet="characterSheet" />

        <div class="identity__stats">
          <DsShield
            :label="$t('sheet.rail.armor_class')"
            :value="armorClass.total"
          />
          <DsStatBase
            :label="$t('sheet.rail.initiative')"
            :value="formatModifier(initiativeBonus)"
          />
          <DsStatBase
            :label="$t('sheet.rail.speed')"
            :value="$t('sheet.rail.speed_value', { n: effectiveSpeed })"
          />
        </div>

        <div class="identity__row identity__inspiration">
          <span class="ds-label">{{ $t('sheet.rail.inspiration') }}</span>
          <span class="identity__inspiration-state">
            {{ characterSheet.inspiration ? $t('sheet.rail.inspiration_on') : $t('sheet.rail.inspiration_off') }}
            <DsCounter
              :model-value="characterSheet.inspiration ? 1 : 0"
              :max="1"
              :aria-label="$t('sheet.rail.inspiration_toggle')"
              @update:model-value="handleInspirationChange"
            />
          </span>
        </div>

        <dl class="abilities">
          <div
            v-for="ability in ABILITY_KEYS"
            :key="ability"
            class="abilities__item"
          >
            <dt class="ds-label">
              <abbr :title="$t(`ability_scores.${ability}`)">{{ $t(`sheet.rail.abilities.${ability}`) }}</abbr>
            </dt>
            <dd class="ds-number">
              {{ formatModifier(abilityModifiers[ability] ?? 0) }}
            </dd>
          </div>
        </dl>
      </div>
    </DsFrame>

    <SheetConcentrationStatus :character-sheet="characterSheet" />

    <DsBlock
      v-if="spellcastingStats || slotRows.length"
      :ribbon="activeCasterClass ? $t('sheet.rail.magic_of', { name: activeCasterClass.className }) : $t('sheet.rail.magic')"
    >
      <dl
        v-if="spellcastingStats"
        class="magic"
      >
        <div class="magic__row">
          <dt class="ds-label">
            {{ $t('sheet.rail.spell_save_dc') }}
          </dt>
          <dd class="ds-number magic__value">
            {{ spellcastingStats.dc }}
          </dd>
        </div>
        <div class="magic__row">
          <dt class="ds-label">
            {{ $t('sheet.rail.spell_attack') }}
          </dt>
          <dd class="ds-number magic__value">
            {{ formatModifier(spellcastingStats.attackBonus) }}
          </dd>
        </div>
      </dl>
      <DsCounter
        v-for="row in slotRows"
        :key="row.key"
        :model-value="row.slot.current"
        :max="row.slot.max"
        :label="row.label"
        class="magic__slots"
        @update:model-value="handleSlotChange(row.slot, $event)"
      />
    </DsBlock>

    <DsBlock
      :ribbon="$t('sheet.rail.effects')"
      class="rail__effects"
    >
      <button
        type="button"
        class="effects__open"
        :aria-label="$t('sheet.rail.manage_effects')"
        @click="open('effects')"
      />
      <ul
        v-if="effects.length"
        class="effects"
      >
        <li
          v-for="effect in effects"
          :key="effect.key"
          class="effects__item"
          :class="{ 'effects__item--bad': effect.isHarmful }"
        >
          <div class="effects__head">
            <span class="effects__name">{{ effect.name }}</span>
            <span v-if="effect.remaining">{{ effect.remaining }}</span>
          </div>
          <p
            v-for="line in effect.lines"
            :key="line"
            class="effects__line"
          >
            {{ line }}
          </p>
        </li>
      </ul>
      <p
        v-else
        class="effects__empty"
      >
        {{ $t('sheet.rail.no_effects') }}
      </p>
    </DsBlock>

    <div class="rail__actions">
      <DsButton
        variant="secondary"
        :label="$t('sheet.rail.rest')"
        @click="open('rest')"
      />
      <DsButton
        :variant="isInCombat ? 'primary' : 'secondary'"
        :label="isInCombat ? $t('sheet.rail.end_combat') : $t('sheet.rail.combat')"
        @click="handleToggleCombat"
      />
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ABILITY_KEYS } from '~~/shared/rules/abilities'
import { conditionLabels } from '~~/shared/utils/labels'
import { useCombatTurn } from '~/composables/character/useCombatTurn'
import { useSheetWindows } from '~/composables/character/useSheetWindows'
import type { SlotState, SlotsByType } from '~/composables/character/useCharacterSpellcasting'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()

const {
  armorClass, initiativeBonus, effectiveSpeed, abilityModifiers, temporaryEffects, activeConditions,
  conditionRounds, exhaustionLevel, spellcastingStats, activeCasterClass,
} = useCharacterSheet(characterSheet)

const { open } = useSheetWindows(characterSheet)

const { isActive: isInCombat, endCombat } = useCombatTurn(characterSheet)

const handleToggleCombat = () => {
  if (isInCombat.value) endCombat()
  else open('combatStart')
}

const handleInspirationChange = (value: number) => {
  characterSheet.value.inspiration = value > 0
}

const spellSlots = inject<Ref<SlotsByType> | null>('spellSlots', null)

const slotRows = computed(() => (['pact_magic', 'spellcasting'] as const).flatMap(slotType =>
  Object.entries(spellSlots?.value[slotType] ?? {})
    .filter(([, slot]) => slot.max > 0)
    .map(([level, slot]) => ({
      key: `${slotType}-${level}`,
      label: t(slotType === 'pact_magic' ? 'sheet.play.slot.pact' : 'sheet.play.slot.level', { level }),
      slot,
    }))))

const handleSlotChange = (slot: SlotState, current: number) => {
  slot.current = current
}

const getRoundsText = (n: number | undefined) => (n ? t('sheet.rail.rounds', n) : undefined)

const effects = computed(() => [
  ...temporaryEffects.value
    .filter(entry => entry.active)
    .map(entry => ({
      key: `effect-${entry.id}`,
      name: entry.name,
      remaining: getRoundsText(entry.countdown?.remaining),
      lines: entry.effects.map(effectLabel),
      isHarmful: false,
    })),
  ...activeConditions.value.map(condition => ({
    key: `condition-${condition}`,
    name: conditionLabels[condition],
    remaining: getRoundsText(conditionRounds.value[condition]),
    lines: [t('sheet.rail.condition')],
    isHarmful: true,
  })),
  ...(exhaustionLevel.value > 0
    ? [{
        key: 'exhaustion',
        name: t('sheet.rail.exhaustion'),
        remaining: undefined,
        lines: [t('sheet.rail.exhaustion_level', { n: exhaustionLevel.value })],
        isHarmful: true,
      }]
    : []),
])
</script>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.identity__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.identity__inspiration { align-items: center; }

.identity__inspiration-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--color-ds-mute);
}

.identity__stats {
  display: flex;
  align-items: stretch;
  gap: 7px;
}

.abilities {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px 6px;
}

.abilities__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 3px 7px;
  background: var(--color-ds-panel-raised);
}

.abilities__item abbr { text-decoration: none; }

.abilities__item dd { font-size: 14px; }

.magic {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.magic__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.magic__value { font-size: 16px; }

.magic__slots {
  margin-top: 6px;
}

.rail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rail__actions > * { flex: 1 1 auto; }

/* Fills the free height, but never below its effects: past that, the rail itself scrolls. */
.rail__effects {
  position: relative;
  flex: 1 0 auto;
}

.effects__open {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: pointer;
}

.effects__open:focus-visible { outline: 2px solid var(--color-ds-gold); }

.effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.effects__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px 6px;
  background: var(--color-ds-panel-raised);
}

.effects__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--color-ds-mute);
}

.effects__name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-ds-ink);
}

.effects__item--bad .effects__name { color: var(--color-ds-bad); }

.effects__line,
.effects__empty {
  font-size: 11.5px;
  color: var(--color-ds-mute);
}
</style>
