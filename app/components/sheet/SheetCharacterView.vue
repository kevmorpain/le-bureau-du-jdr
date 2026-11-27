<template>
  <div class="manage">
    <section class="manage__main">
      <DsBlock :ribbon="$t('sheet.character.abilities')">
        <div class="row">
          <span class="ds-label">{{ $t('sheet.character.proficiency_bonus') }}</span>
          <span class="ds-number row__value">{{ formatModifier(proficiencyBonus) }}</span>
        </div>
        <ul class="tiles">
          <li
            v-for="ability in abilityRows"
            :key="ability.key"
            class="tile"
          >
            <button
              type="button"
              class="tile__check"
              :disabled="!rollsEnabled"
              :aria-label="$t('sheet.character.roll_check', { ability: ability.name })"
              @click="rollCheck(ability.key)"
            >
              <span class="ds-label">{{ ability.name }}</span>
              <span class="tile__values">
                <span class="ds-number tile__mod">{{ formatModifier(ability.modifier) }}</span>
                <span class="tile__score">{{ $t('sheet.character.score', { n: ability.score }) }}</span>
              </span>
            </button>
            <button
              type="button"
              class="tile__save"
              :disabled="!rollsEnabled"
              :aria-label="$t('sheet.character.roll_save', { ability: ability.name })"
              @click="rollSave(ability.key)"
            >
              <span
                class="mark"
                :class="`mark--${ability.saveProficiency}`"
                :title="$t(`sheet.character.proficiency.${ability.saveProficiency}`)"
              />
              {{ $t('sheet.character.save') }}
              <b class="tile__save-value">{{ formatModifier(ability.save) }}</b>
            </button>
          </li>
        </ul>
      </DsBlock>

      <DsBlock :ribbon="$t('sheet.character.skills')">
        <p class="legend">
          <span
            v-for="level in PROFICIENCY_LEVELS"
            :key="level"
          >
            <span
              class="mark"
              :class="`mark--${level}`"
            />
            {{ $t(`sheet.character.proficiency.${level}`) }}
          </span>
        </p>
        <ul class="skills">
          <li
            v-for="skill in skillRows"
            :key="skill.key"
          >
            <button
              type="button"
              class="skill"
              :disabled="!rollsEnabled"
              :aria-label="$t('sheet.character.roll_skill', { skill: skill.name, modifier: formatModifier(skill.modifier) })"
              @click="rollSkill(skill.ability, skill.key, skill.name)"
            >
              <span
                class="mark"
                :class="`mark--${skill.proficiency}`"
                :title="$t(`sheet.character.proficiency.${skill.proficiency}`)"
              />
              <span class="skill__name">{{ skill.name }}</span>
              <span class="ds-label skill__ability">{{ $t(`sheet.rail.abilities.${skill.ability}`) }}</span>
              <b class="ds-number skill__value">{{ formatModifier(skill.modifier) }}</b>
            </button>
          </li>
        </ul>
      </DsBlock>

      <DsBlock :ribbon="$t('sheet.character.proficiencies')">
        <dl class="pairs">
          <div
            v-for="row in proficiencyRows"
            :key="row.key"
            class="row"
          >
            <dt class="ds-label">
              {{ $t(`sheet.character.proficiency_kinds.${row.key}`) }}
            </dt>
            <dd class="row__text">
              {{ row.values.length ? row.values.join(', ') : $t('sheet.character.none') }}
            </dd>
          </div>
        </dl>
      </DsBlock>
    </section>

    <section class="manage__side">
      <DsBlock :ribbon="$t('sheet.character.senses')">
        <dl class="pairs">
          <div
            v-if="visionRange"
            class="row"
          >
            <dt class="ds-label">
              {{ $t('sheet.character.darkvision') }}
            </dt>
            <dd class="ds-number row__value">
              {{ $t('sheet.rail.speed_value', { n: visionRange }) }}
            </dd>
          </div>
          <div
            v-for="sense in otherSenses"
            :key="sense"
            class="row"
          >
            <dt class="ds-label">
              {{ sense }}
            </dt>
          </div>
          <div class="row">
            <dt class="ds-label">
              {{ $t('sheet.character.passive_perception') }}
            </dt>
            <dd class="ds-number row__value">
              {{ passivePerception }}
            </dd>
          </div>
          <div class="row">
            <dt class="ds-label">
              {{ $t('sheet.character.passive_investigation') }}
            </dt>
            <dd class="ds-number row__value">
              {{ passiveInvestigation }}
            </dd>
          </div>
        </dl>
      </DsBlock>

      <DsBlock :ribbon="$t('sheet.character.state')">
        <div
          v-for="die in hitDieRows"
          :key="die.die"
          class="state-row"
        >
          <div class="row">
            <span class="ds-label">{{ $t('sheet.character.hit_dice', { die: die.die }) }}</span>
            <span class="row__hint">{{ $t('ds.count_of', { value: die.remaining, max: die.total }) }}</span>
          </div>
          <DsCounter
            :model-value="die.remaining"
            :max="die.total"
            :aria-label="$t('sheet.character.hit_dice', { die: die.die })"
            @update:model-value="count => handleHitDiceChange(die.die, count)"
          />
        </div>
        <div class="state-row">
          <div class="row">
            <span class="ds-label">{{ $t('sheet.rail.exhaustion') }}</span>
            <span class="row__hint">{{ $t('ds.count_of', { value: exhaustionLevel, max: EXHAUSTION_MAX }) }}</span>
          </div>
          <DsCounter
            v-model="exhaustionLevel"
            :max="EXHAUSTION_MAX"
            color="bad"
            :aria-label="$t('sheet.rail.exhaustion')"
          />
        </div>
        <div
          v-for="group in defenseGroups"
          :key="group.level"
          class="row row--wrap"
        >
          <span class="ds-label">{{ $t(`sheet.character.defenses.${group.level}`) }}</span>
          <span class="badges">
            <DsBadge
              v-for="entry in group.entries"
              :key="entry.key"
              :label="entry.label"
            />
          </span>
        </div>
      </DsBlock>

      <DsBlock :ribbon="$t('sheet.character.passives')">
        <p
          v-if="!passiveGroups.length"
          class="row__hint"
        >
          {{ $t('sheet.character.no_passives') }}
        </p>
        <div
          v-for="group in passiveGroups"
          :key="group.label"
        >
          <DsGroupTitle :label="group.label" />
          <div
            v-for="feature in group.features"
            :key="`${feature.origin.kind}-${feature.id}`"
          >
            <button
              type="button"
              class="accordion"
              :aria-expanded="openPassive === passiveKey(feature)"
              @click="handleTogglePassive(feature)"
            >
              <span class="accordion__title">{{ feature.name }}</span>
              <span
                class="accordion__chevron"
                aria-hidden="true"
              >{{ openPassive === passiveKey(feature) ? '−' : '+' }}</span>
            </button>
            <LightMarkdown
              v-if="openPassive === passiveKey(feature)"
              class="accordion__body"
              :source="feature.description ?? ''"
            />
          </div>
        </div>
      </DsBlock>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { ProficiencyLevel } from '~/composables/character/useCharacterAbilities'
import { usePassiveFeatures } from '~/composables/character/usePlayCards'
import { ABILITY_KEYS, type AbilityKey } from '~~/shared/rules/abilities'
import { hitDiceTotals, remainingHitDice, setRemainingHitDice } from '~~/shared/rules/hitDice'
import { languageLabel } from '~~/shared/rules/languages'
import { armorProficiencyLabels, weaponProficiencyLabels } from '~~/shared/utils/item'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()
const sheet = useCharacterSheet(characterSheet)
const {
  proficiencyBonus,
  abilityScores,
  abilityModifiers,
  abilityCheckModifiers,
  abilitySkillKeys,
  savingThrows,
  getEffectiveProficiency,
  getSkillModifier,
  senses,
  visionRange,
  passivePerception,
  passiveInvestigation,
  exhaustionLevel,
  defenseEntries,
  weaponProficiencies,
  armorProficiencies,
  toolProficiencies,
  languageProficiencies,
} = sheet
const passiveGroups = usePassiveFeatures(sheet)
const { roll, rollsEnabled } = useDiceRoller()

const PROFICIENCY_LEVELS = ['proficient', 'expert', 'none'] as const satisfies ProficiencyLevel[]
const EXHAUSTION_MAX = 6
const DEFENSE_LEVELS = ['resistance', 'immunity', 'vulnerability'] as const

const abilityRows = computed(() => ABILITY_KEYS.map(key => ({
  key,
  name: t(`ability_scores.${key}`),
  modifier: abilityModifiers.value[key] ?? 0,
  score: abilityScores.value[key]?.total ?? 0,
  save: savingThrows.value[key]?.modifier ?? 0,
  saveProficiency: savingThrows.value[key]?.proficiency ?? 'none',
})))

const skillRows = computed(() => ABILITY_KEYS
  .flatMap(ability => (abilitySkillKeys[ability] ?? []).map(key => ({
    key,
    ability,
    name: t(`skills.${ability}.${key}`),
    modifier: getSkillModifier(ability, key),
    proficiency: getEffectiveProficiency(key),
  })))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr')))

const proficiencyRows = computed(() => [
  { key: 'armor', values: armorProficiencies.value.map(value => armorProficiencyLabels[value] ?? value) },
  { key: 'weapons', values: weaponProficiencies.value.map(value => weaponProficiencyLabels[value] ?? value) },
  { key: 'tools', values: toolProficiencies.value },
  { key: 'languages', values: languageProficiencies.value.map(value => languageLabel(value)) },
])

// `sensesOf` lists darkvision first, already shown with its range.
const otherSenses = computed(() => (visionRange.value ? senses.value.slice(1) : senses.value))

const hitDiceTotalsOfSheet = computed(() =>
  hitDiceTotals((characterSheet.value.classes ?? []).map(cls => ({ level: cls.level, hitDice: cls.class?.hitDice }))))

const hitDieRows = computed(() => {
  const remaining = remainingHitDice(characterSheet.value.currentHitDie, hitDiceTotalsOfSheet.value)
  return hitDiceTotalsOfSheet.value.map(({ die, count }) => ({
    die,
    total: count,
    remaining: remaining.find(entry => entry.die === die)?.count ?? count,
  }))
})

const handleHitDiceChange = (die: string, count: number) => {
  characterSheet.value.currentHitDie = setRemainingHitDice(characterSheet.value.currentHitDie, hitDiceTotalsOfSheet.value, die, count)
}

const defenseGroups = computed(() => DEFENSE_LEVELS
  .map(level => ({ level, entries: defenseEntries.value.filter(entry => entry.level === level) }))
  .filter(group => group.entries.length))

type PassiveFeature = (typeof passiveGroups.value)[number]['features'][number]
const passiveKey = (feature: PassiveFeature) => `${feature.origin.kind}-${feature.id}`
const openPassive = ref<string | null>(null)
const handleTogglePassive = (feature: PassiveFeature) => {
  const key = passiveKey(feature)
  openPassive.value = openPassive.value === key ? null : key
}

const rollCheck = (ability: AbilityKey) =>
  roll(t('sheet.character.check_label', { ability: t(`ability_scores.${ability}`) }), abilityCheckModifiers.value[ability] ?? 0, 20, 1, { d20: { type: 'check', ability } })

const rollSave = (ability: AbilityKey) =>
  roll(t('sheet.character.save_label', { ability: t(`ability_scores.${ability}`) }), savingThrows.value[ability]?.modifier ?? 0, 20, 1, { d20: { type: 'save', ability } })

const rollSkill = (ability: AbilityKey, skill: string, name: string) =>
  roll(name, getSkillModifier(ability, skill), 20, 1, { d20: { type: 'check', ability, skill } })
</script>

<style scoped>
.manage {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.manage__main {
  display: flex;
  flex: 1 1 480px;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.manage__side {
  display: flex;
  flex-direction: column;
  flex: 0 1 340px;
  gap: 12px;
  min-width: 250px;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.row--wrap { flex-wrap: wrap; }

.row__value { font-size: 17px; }

.row__text {
  font-size: 12px;
  text-align: right;
}

.row__hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.pairs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px 8px;
  background: var(--color-ds-panel-raised);
  border-top: 2px solid var(--color-ds-gold-dim);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%);
}

.tile__check,
.tile__save,
.skill {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  color: inherit;
}

.tile__check {
  flex-direction: column;
  align-items: stretch;
}

.tile__values {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.tile__mod { font-size: 24px; }

.tile__score,
.tile__save {
  font-size: 11.5px;
  color: var(--color-ds-mute);
}

.tile__save { gap: 6px; }

.tile__save-value {
  margin-left: auto;
  color: var(--color-ds-ink);
}

.tile__check:enabled:hover .tile__mod,
.tile__save:enabled:hover .tile__save-value,
.skill:enabled:hover .skill__value { color: var(--color-ds-gold); }

.tile__check:disabled,
.tile__save:disabled,
.skill:disabled { cursor: default; }

.legend {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 11px;
  color: var(--color-ds-mute);
}

.legend > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mark {
  display: inline-block;
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--color-ds-faint);
  transform: rotate(45deg);
}

.mark--proficient {
  background: var(--color-ds-gold);
  border-color: var(--color-ds-gold);
}

.mark--expert {
  padding: 1.5px;
  background: var(--color-ds-gold);
  background-clip: content-box;
  border-color: var(--color-ds-gold);
}

.skills {
  display: grid;
  grid-template-rows: repeat(9, auto);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-flow: column;
  column-gap: 22px;
}

.skill {
  gap: 7px;
  padding: 4px 2px;
  font-size: 12.5px;
  border-bottom: 1px solid var(--color-ds-line);
}

.skill__name {
  flex: 1;
  min-width: 0;
}

.skill__ability {
  width: 30px;
  font-size: 9.5px;
  color: var(--color-ds-faint);
}

.skill__value {
  width: 26px;
  font-size: 14px;
  text-align: right;
}

.state-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.accordion {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 2px;
  font-size: 12.5px;
  font-weight: 700;
  text-align: left;
  color: inherit;
  border-bottom: 1px solid var(--color-ds-line);
}

.accordion__title { flex: 1; }

.accordion__chevron {
  font-size: 13px;
  color: var(--color-ds-gold);
}

.accordion__body {
  padding: 4px 2px 8px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--color-ds-mute);
}
</style>
