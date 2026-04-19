<template>
  <ul class="flex lg:flex-col gap-y-4 gap-x-2">
    <li
      v-for="(_, key) in abilityScores"
      :key
      class="rounded-lg bg-default ring ring-default py-1 px-2 space-y-2"
    >
      <p class="font-semibold text-muted text-center">
        {{ $t(`ability_scores.${key}`) }}
      </p>

      <div class="flex items-baseline justify-center">
        <p class="text-2xl border rounded-full size-12 grid place-items-center relative z-1 bg-default">
          {{ formatModifier(abilityModifiers[key]!) }}
        </p>

        <UPopover
          :content="{
            side: 'top',
          }"
        >
          <p class="border rounded-r-md py-0.5 px-1 text-sm min-w-10 bg-default -ml-2 text-center">
            {{ abilityScores[key]!.total }}
          </p>

          <template #content>
            <ul class="p-1.5 divide-y divide-default">
              <li>Base: {{ abilityScores[key]!.base }}</li>
              <li>Bonus espèce: {{ abilityScores[key]!.speciesBonus }}</li>
              <li>Total: {{ abilityScores[key]!.total }}</li>
            </ul>
          </template>
        </UPopover>
      </div>

      <USeparator />

      <div class="flex items-center gap-2">
        <ProficiencyIndicator :level="savingThrows[key]!.proficiency" />
        <span class="w-6 text-right text-sm">{{ formatModifier(savingThrows[key]!.modifier) }}</span>
        <span class="flex-1 text-sm">Jet de sauvegarde</span>
        <ConditionWarning
          v-if="saveStatuses[key]?.autoFail || saveStatuses[key]?.disadvantage"
          :lines="saveStatuses[key]!.reasons"
        />
      </div>

      <template v-if="abilitySkillKeys[key]!.length > 0">
        <USeparator />

        <div
          v-if="skillDisadvantageReasons.length"
          class="flex items-center gap-1"
        >
          <ConditionWarning :lines="skillDisadvantageReasons" />
          <span class="text-xs text-rose-400">Désavantage aux jets de carac.</span>
        </div>

        <ul class="space-y-1">
          <li
            v-for="skillKey in abilitySkillKeys[key]"
            :key="skillKey"
            class="flex items-center gap-2"
          >
            <ProficiencyIndicator :level="getEffectiveProficiency(skillKey)" />
            <span class="w-6 text-right text-sm">{{ formatModifier(getSkillModifier(key, skillKey)) }}</span>
            <span class="flex-1 text-sm">{{ $t(`skills.${key}.${skillKey}`) }}</span>
          </li>
        </ul>
      </template>
    </li>
  </ul>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  abilityScores,
  abilityModifiers,
  abilitySkillKeys,
  getEffectiveProficiency,
  getSkillModifier,
  savingThrows,
  saveStatuses,
  skillDisadvantageReasons,
} = useCharacterSheet(characterSheet)
</script>
