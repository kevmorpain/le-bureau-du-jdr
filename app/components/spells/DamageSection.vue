<template>
  <div>
    <p
      v-if="isSpellbook"
      class="text-2xl"
    >
      {{ defaultDieText }}
    </p>

    <p
      :class="[
        `text-${spell.damage!.damage_type}`,
        {
          'text-2xl': !isSpellbook,
          'text-lg': isSpellbook,
        },
      ]"
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
const { characterLevel, spellcastingModifier } = useCharacterSheet()

const slotLevel = ref<number>(props.spell.level)
const closestCharacterLevelDamage = computed<string | undefined>(() => {
  if (!('damage_at_character_level' in props.spell.damage!)) return undefined

  const list = props.spell.damage!.damage_at_character_level
  const level = closestLevel(Object.keys(list).map(Number), characterLevel.value)

  return level !== undefined ? list[String(level)] : undefined
})

const closestSlotLevelDamage = computed<string | undefined>(() => {
  if (!('damage_at_slot_level' in props.spell.damage!)) return undefined

  const list = props.spell.damage!.damage_at_slot_level
  const level = closestLevel(Object.keys(list).map(Number), slotLevel.value)

  return level !== undefined ? list[String(level)] : undefined
})

const defaultDie = computed<string>(() => (closestCharacterLevelDamage.value ?? closestSlotLevelDamage.value)!)

const hasModifier = computed<boolean | undefined>(() => props.spell.damage!.isSpellcastingModifierAdded)

const dieText = computed<string>(() => {
  let text = defaultDie.value

  if (hasModifier.value) {
    if (isSpellbook) {
      text += ` + ${spellcastingModifier.value}`
    }
    else {
      text += ' + mod'
    }
  }

  if (!isSpellbook) {
    const count = isNumeric(defaultDie.value) ? Number(defaultDie.value) : 0

    text += ` ${t(`damage_types.${props.spell.damage!.damage_type}`, count)}`
  }

  return text
})

const defaultDieText = computed<string>(() => {
  const { count, die } = parseDie(defaultDie.value)

  const modifier = hasModifier.value && spellcastingModifier.value ? spellcastingModifier.value : 0
  const min = count + modifier
  const max = count * die + modifier

  return `${min}${min !== max ? `~${max}` : ''} ${t(`damage_types.${props.spell.damage!.damage_type}`, Math.max(min, max))}`
})
</script>
