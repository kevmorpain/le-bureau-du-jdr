<template>
  <div v-if="die">
    <p
      v-if="isSpellbook && rangeText"
      class="text-2xl"
    >
      {{ rangeText }}
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
import { baseCastLevels, diceRange, resolveHealDie } from '~~/shared/rules/spellScaling'

const props = defineProps<{
  spell: Spell
}>()

const { t } = useI18n()

const isSpellbook = inject<boolean>('isSpellbook', false)
const spellContext = inject<SpellContext | null>('spellContext', null)
const { characterLevel, spellcastingModifier } = spellContext ?? useSpellLens()

// Sort lancé SANS montée en puissance — cf. la note de DamageSection : la progression par
// emplacement est rendue par `UpcastSection` et par le récapitulatif de CastSpellModal.
const levels = computed(() => baseCastLevels(props.spell, characterLevel.value))

const die = computed<string | undefined>(() =>
  props.spell.heal ? resolveHealDie(props.spell.heal, levels.value) : undefined,
)

const modifier = computed<number>(() =>
  props.spell.heal?.isSpellcastingModifierAdded ? spellcastingModifier.value ?? 0 : 0,
)

const dieText = computed<string>(() => {
  if (!die.value) return ''
  let text = die.value

  if (props.spell.heal!.isSpellcastingModifierAdded) {
    text += isSpellbook ? ` ${formatModifier(modifier.value)}` : ' + mod'
  }

  if (!isSpellbook) {
    const count = isNumeric(die.value) ? Number(die.value) : 0
    text += ` ${t(`heal_types.${props.spell.heal!.heal_type}`, count)}`
  }

  return text
})

const rangeText = computed<string>(() => {
  if (!die.value) return ''
  const range = diceRange(die.value, modifier.value)
  if (!range) return ''
  const { min, max } = range

  return `${min}${min !== max ? `~${max}` : ''} ${t(`heal_types.${props.spell.heal!.heal_type}`, Math.max(min, max))}`
})
</script>
