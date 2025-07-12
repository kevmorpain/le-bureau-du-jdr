<template>
  <div>
    <p
      v-if="isSpellbook"
      class="text-2xl"
    >
      {{ defaultDieText }}
    </p>

    <p
      class="text-heal"
      :class="{
        'text-2xl': !isSpellbook,
        'text-lg': isSpellbook,
      }"
    >
      {{ dieText }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  spell: Spell
}>()

const { t } = useI18n()

const isSpellbook = inject<boolean>('isSpellbook', false)
const { spellcastingModifier } = useCharacterSheet()

const defaultDie = computed<string>(() => ('heal_at_character_level' in props.spell.heal! ? props.spell.heal!.heal_at_character_level : props.spell.heal!.heal_at_slot_level)![1]!)

const hasModifier = computed<boolean | undefined>(() => props.spell.heal!.isSpellcastingModifierAdded)

const dieText = computed<string>(() => {
  let text = defaultDie.value

  if (hasModifier.value) {
    if (isSpellbook) {
      text += ` + ${spellcastingModifier.value}`
    }
    else {
      text += ` + mod ${t(`heal_types.${props.spell.heal!.heal_type}`)}`
    }
  }

  return text
})

const defaultDieText = computed<string>(() => {
  const { count, die } = parseDie(defaultDie.value)

  const min = count
  const max = count * die
  const modifier = hasModifier.value && spellcastingModifier.value ? spellcastingModifier.value : 0

  return `${min + modifier}~${max + modifier} ${t(`heal_types.${props.spell.heal!.heal_type}`)}`
})

function parseDie(value: string): { count: number, die: number } {
  // Expects value like "2d8", "1d6", etc.
  const match = value.match(/^(\d+)d(\d+)$/)
  if (!match) {
    return { count: 0, die: 0 }
  }

  return {
    count: parseInt(match[1]!, 10),
    die: parseInt(match[2]!, 10),
  }
}
</script>
