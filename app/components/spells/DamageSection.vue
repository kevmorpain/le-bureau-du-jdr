<template>
  <div v-if="defaultDie">
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
  <p
    v-else
    class="text-sm text-muted italic"
  >
    Dégâts non disponibles au niveau actuel
  </p>
</template>

<script lang="ts" setup>
const props = defineProps<{
  spell: Spell
}>()

const { t } = useI18n()

const isSpellbook = inject<boolean>('isSpellbook', false)
const spellContext = inject<SpellContext | null>('spellContext', null)
const { characterLevel, spellcastingModifier } = spellContext ?? useSpellLens()
const eldritchBlastAgonizing = spellContext?.eldritchBlastAgonizing
const charismaModifier = spellContext?.charismaModifier

const isEldritchBlast = computed(() => props.spell.name === 'Décharge occulte')

// Nombre de rayons de Décharge occulte selon le niveau (PHB 5e)
const eldritchBlastRayCount = computed(() => {
  const lvl = characterLevel.value
  if (lvl >= 17) return 4
  if (lvl >= 11) return 3
  if (lvl >= 5) return 2
  return 1
})

// Bonus de dégâts apporté par les manifestations occultes (par exemple Coup agonisant)
const eldritchBlastBonus = computed<number>(() => {
  if (!isEldritchBlast.value) return 0
  if (!eldritchBlastAgonizing?.value) return 0
  return (charismaModifier?.value ?? 0) * eldritchBlastRayCount.value
})

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

const defaultDie = computed<string | undefined>(() => closestCharacterLevelDamage.value ?? closestSlotLevelDamage.value)

const hasModifier = computed<boolean | undefined>(() => props.spell.damage!.isSpellcastingModifierAdded)

const dieText = computed<string>(() => {
  if (!defaultDie.value) return ''
  let text = defaultDie.value

  // Bonus global (modificateur d'incantation + bonus manifestation)
  let totalBonus = 0
  if (hasModifier.value && spellcastingModifier.value !== null) totalBonus += spellcastingModifier.value ?? 0
  totalBonus += eldritchBlastBonus.value

  if (totalBonus !== 0) {
    if (isSpellbook) {
      text += ` ${formatModifier(totalBonus)}`
    }
    else if (hasModifier.value && eldritchBlastBonus.value === 0) {
      text += ' + mod'
    }
    else {
      text += ` ${formatModifier(totalBonus)}`
    }
  }

  if (!isSpellbook) {
    const count = isNumeric(defaultDie.value) ? Number(defaultDie.value) : 0

    text += ` ${t(`damage_types.${props.spell.damage!.damage_type}`, count)}`
  }

  return text
})

const defaultDieText = computed<string>(() => {
  if (!defaultDie.value) return ''
  const { count, die } = parseDie(defaultDie.value)

  const modifier = (hasModifier.value && spellcastingModifier.value ? spellcastingModifier.value : 0) + eldritchBlastBonus.value
  const min = count + modifier
  const max = count * die + modifier

  return `${min}${min !== max ? `~${max}` : ''} ${t(`damage_types.${props.spell.damage!.damage_type}`, Math.max(min, max))}`
})
</script>
