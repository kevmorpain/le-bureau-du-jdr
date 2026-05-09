<template>
  <ul class="space-y-1.5">
    <li
      v-for="(score, key) in abilityScores"
      :key
      class="flex gap-2.5 rounded-lg bg-default ring ring-default p-2"
    >
      <!-- ── Cercle modificateur + score éditable ── -->
      <div class="flex flex-col items-center gap-1 shrink-0">
        <UPopover
          mode="hover"
          :content="{ side: 'right' }"
        >
          <button
            class="size-10 rounded-full bg-elevated flex items-center justify-center hover:ring-1 hover:ring-primary transition-all"
            @click="roll?.(`Jet de ${$t(`ability_scores.${key}`)}`, abilityModifiers[key]!)"
          >
            <span class="text-base font-bold">{{ formatModifier(abilityModifiers[key]!) }}</span>
          </button>
          <template #content>
            <table class="text-xs p-2">
              <tbody>
                <tr>
                  <td class="text-muted pr-4 py-0.5">
                    Base
                  </td>
                  <td class="text-right font-mono">
                    {{ score.base }}
                  </td>
                </tr>
                <tr v-if="score.speciesBonus">
                  <td class="text-muted pr-4 py-0.5">
                    Espèce
                  </td>
                  <td class="text-right font-mono">
                    +{{ score.speciesBonus }}
                  </td>
                </tr>
                <tr class="border-t border-default">
                  <td class="text-muted pr-4 pt-1">
                    Total
                  </td>
                  <td class="text-right font-mono font-semibold pt-1">
                    {{ score.total }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </UPopover>

        <UPopover :content="{ side: 'right' }">
          <button class="text-xs text-muted hover:text-default transition-colors font-mono">
            {{ score.total }}
          </button>
          <template #content>
            <div class="p-3 space-y-2">
              <table class="text-xs w-full">
                <tbody>
                  <tr>
                    <td class="text-muted pr-4 py-0.5">
                      Base
                    </td>
                    <td class="text-right font-mono">
                      <UInputNumber
                        :model-value="score.base"
                        :min="1"
                        :max="30"
                        size="xs"
                        class="w-20"
                        @update:model-value="(v) => updateBaseScore(key, v ?? score.base)"
                      />
                    </td>
                  </tr>
                  <tr v-if="score.speciesBonus">
                    <td class="text-muted pr-4 py-0.5">
                      Espèce
                    </td>
                    <td class="text-right font-mono">
                      +{{ score.speciesBonus }}
                    </td>
                  </tr>
                  <tr class="border-t border-default">
                    <td class="text-muted pr-4 pt-1">
                      Total
                    </td>
                    <td class="text-right font-mono font-semibold pt-1">
                      {{ score.total }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- ── Contenu ── -->
      <div class="flex-1 min-w-0 space-y-0.5">
        <p class="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">
          {{ $t(`ability_scores.${key}`) }}
        </p>

        <!-- Jet de sauvegarde -->
        <div class="flex items-center gap-1 rounded px-0.5">
          <button
            class="shrink-0 hover:scale-110 transition-transform"
            @click="cycleProficiency(`${key}_save`)"
          >
            <ProficiencyIndicator :level="savingThrows[key]!.proficiency" />
          </button>
          <span
            class="flex-1 text-xs cursor-pointer hover:text-primary transition-colors"
            @click="roll?.(`JS ${$t(`ability_scores.${key}`)}`, savingThrows[key]!.modifier)"
          >
            Sauvegarde
          </span>
          <ConditionWarning
            v-if="saveStatuses[key]?.autoFail || saveStatuses[key]?.disadvantage"
            :lines="saveStatuses[key]!.reasons"
          />
          <span
            class="text-xs font-mono cursor-pointer hover:text-primary transition-colors"
            :class="savingThrows[key]!.proficiency !== 'none' ? 'text-primary' : 'text-muted'"
            @click="roll?.(`JS ${$t(`ability_scores.${key}`)}`, savingThrows[key]!.modifier)"
          >
            {{ formatModifier(savingThrows[key]!.modifier) }}
          </span>
        </div>

        <!-- Compétences -->
        <template v-if="abilitySkillKeys[key]!.length > 0">
          <USeparator />
          <div
            v-if="skillDisadvantageReasons.length"
            class="flex items-center gap-1 mt-0.5"
          >
            <ConditionWarning :lines="skillDisadvantageReasons" />
            <span class="text-[10px] text-rose-400">Désavantage</span>
          </div>

          <div
            v-for="skillKey in abilitySkillKeys[key]"
            :key="skillKey"
            class="flex items-center gap-1 rounded px-0.5"
          >
            <button
              class="shrink-0 hover:scale-110 transition-transform"
              @click="cycleProficiency(skillKey)"
            >
              <ProficiencyIndicator :level="getEffectiveProficiency(skillKey)" />
            </button>
            <span
              class="flex-1 text-xs cursor-pointer hover:text-primary transition-colors truncate"
              @click="roll?.($t(`skills.${key}.${skillKey}`), getSkillModifier(key, skillKey))"
            >
              {{ $t(`skills.${key}.${skillKey}`) }}
            </span>
            <ConditionWarning
              v-if="skillKey === 'stealth' && armorStealthDisadvantage"
              :lines="['Armure : désavantage en Discrétion']"
            />
            <span
              class="text-xs font-mono cursor-pointer hover:text-primary transition-colors"
              :class="getEffectiveProficiency(skillKey) !== 'none' ? 'text-primary' : 'text-muted'"
              @click="roll?.($t(`skills.${key}.${skillKey}`), getSkillModifier(key, skillKey))"
            >
              {{ formatModifier(getSkillModifier(key, skillKey)) }}
            </span>
          </div>
        </template>
      </div>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { ProficiencyLevel } from '~/composables/character/useCharacterAbilities'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

defineProps<{
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const {
  abilityScores,
  abilityModifiers,
  abilitySkillKeys,
  getEffectiveProficiency,
  getSkillModifier,
  savingThrows,
  saveStatuses,
  skillDisadvantageReasons,
  armorStealthDisadvantage,
} = useCharacterSheet(characterSheet)

// ── Édition du score de base ──────────────────────────────────────────────────

const updateBaseScore = async (key: string, value: number) => {
  const entry = characterSheet.value.baseAbilityScores?.find(s => s.abilityId === key)
  if (entry) {
    entry.value = value
    await $fetch(`/api/character_sheets/${characterSheet.value.id}/ability-scores`, {
      method: 'PUT',
      body: [{ abilityId: key, value }],
    })
  }
}

// ── Toggle proficiency (compétences + jets de sauvegarde) ────────────────────

const proficiencyCycle: Record<ProficiencyLevel, ProficiencyLevel> = {
  none: 'proficient',
  proficient: 'expert',
  expert: 'none',
}

const cycleProficiency = async (skillKey: string) => {
  const current = getEffectiveProficiency(skillKey)
  const next = proficiencyCycle[current]

  const existing = characterSheet.value.skills?.find(
    s => s.skillKey === skillKey && s.source === 'manual',
  )
  if (existing) {
    existing.proficiencyLevel = next
  } else {
    characterSheet.value.skills ??= []
    characterSheet.value.skills.push({
      skillKey,
      proficiencyLevel: next,
      source: 'manual',
      isOverride: true,
      characterSheetId: characterSheet.value.id,
    })
  }

  await $fetch(`/api/character_sheets/${characterSheet.value.id}/skills`, {
    method: 'PUT',
    body: [{ skillKey, proficiencyLevel: next, source: 'manual', isOverride: true }],
  })
}
</script>
