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

const slotLevel = ref<number>(props.spell.level)

const defaultDie = computed<string>(() => ('heal_at_character_level' in props.spell.heal! ? props.spell.heal!.heal_at_character_level : props.spell.heal!.heal_at_slot_level)![slotLevel.value]!)

const hasModifier = computed<boolean | undefined>(() => props.spell.heal!.isSpellcastingModifierAdded)

const dieText = computed<string>(() => {
  let text = defaultDie.value

  if (hasModifier.value) {
    if (isSpellbook) {
      text += ` + ${spellcastingModifier.value}`
    } else {
      text += ' + mod'
    }
  }

  if (!isSpellbook) {
    const count = isNumeric(defaultDie.value) ? Number(defaultDie.value) : 0

    text += ` ${t(`heal_types.${props.spell.heal!.heal_type}`, count)}`
  }

  return text
})

const defaultDieText = computed<string>(() => {
  const { count, die } = parseDie(defaultDie.value)

  const modifier = hasModifier.value && spellcastingModifier.value ? spellcastingModifier.value : 0
  const min = count + modifier
  const max = count * die + modifier

  return `${min}${min !== max ? `~${max}` : ''} ${t(`heal_types.${props.spell.heal!.heal_type}`, Math.max(min, max))}`
})
</script>
