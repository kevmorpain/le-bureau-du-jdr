<template>
  <aside class="rail">
    <DsFrame shape="stepped">
      <div class="identity">
        <div class="identity__head">
          <img
            v-if="portraitSrc && !hasPortraitLoadError"
            :src="portraitSrc"
            alt=""
            class="identity__portrait"
            @error="hasPortraitLoadError = true"
          >
          <div class="identity__who">
            <p class="identity__name">
              {{ characterSheet.name }}
            </p>
            <p class="ds-label identity__classes">
              {{ classesText }}
            </p>
          </div>
        </div>

        <div class="identity__hp">
          <div class="identity__row">
            <span class="ds-label">{{ $t('ds.hp.label') }}</span>
            <span class="identity__hp-value">
              <span class="ds-number identity__hp-current">{{ characterSheet.currentHp }}</span>
              <span class="identity__hp-max">/ {{ effectiveMaxHp }}</span>
              <span
                v-if="characterSheet.temporaryHp"
                class="identity__hp-temp"
              >{{ $t('sheet.rail.temp_hp', { n: characterSheet.temporaryHp }) }}</span>
            </span>
          </div>
          <DsHpBar
            :max="effectiveMaxHp"
            :current="characterSheet.currentHp"
            :temp="characterSheet.temporaryHp ?? 0"
          />
        </div>

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

    <DsConcentration
      v-if="isConcentrating && concentrationName"
      :spell="concentrationName"
      :remaining="concentrationRounds"
    />

    <DsBlock
      :ribbon="$t('sheet.rail.effects')"
      class="rail__effects"
    >
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
  </aside>
</template>

<script lang="ts" setup>
import { ABILITY_KEYS } from '~~/shared/rules/abilities'
import { conditionLabels } from '~~/shared/utils/labels'

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()

const { t } = useI18n()

const {
  characterLevel, mainClass, multiClass, portraitSrc, effectiveMaxHp, armorClass, initiativeBonus, effectiveSpeed,
  abilityModifiers, isConcentrating, concentrationName, concentratingSpellId, temporaryEffects, activeConditions,
  conditionRounds, exhaustionLevel,
} = useCharacterSheet(toRef(() => characterSheet))

const hasPortraitLoadError = ref(false)
watch(portraitSrc, () => {
  hasPortraitLoadError.value = false
})

const classesText = computed(() => {
  const classes = [mainClass.value, ...multiClass.value].filter(cls => !!cls)
  if (classes.length === 1) return t('sheet.rail.class_level', { name: classes[0]!.name, level: characterLevel.value })
  return classes.map(cls => `${cls!.name} ${cls!.level}`).join(' · ')
})

const getRoundsText = (n: number | undefined) => (n ? t('sheet.rail.rounds', n) : undefined)

const concentrationRounds = computed(() =>
  getRoundsText(temporaryEffects.value.find(e => e.concentration && e.spellId === concentratingSpellId.value)?.countdown?.remaining),
)

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
  width: 248px;
  flex-shrink: 0;
  min-height: 0;
  padding: 12px 10px 12px 0;
  overflow-y: auto;
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.identity__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.identity__portrait {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  object-fit: cover;
}

.identity__who { min-width: 0; }

.identity__name {
  font-family: var(--font-bodoni);
  font-size: 21px;
  line-height: 1.1;
  color: var(--color-ds-ink);
}

.identity__classes { margin-top: 3px; }

.identity__hp {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.identity__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.identity__hp-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.identity__hp-current { font-size: 18px; }

.identity__hp-max {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.identity__hp-temp {
  font-size: 10.5px;
  font-weight: 700;
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

.rail__effects {
  flex: 1;
  min-height: 0;
}

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
