<template>
  <div v-if="lines.length">
    <div
      v-for="line in lines"
      :key="line.key"
    >
      <p
        v-if="line.label"
        class="text-xs text-muted"
      >
        {{ line.label }}
      </p>

      <p
        v-if="isSpellbook"
        class="text-2xl"
      >
        {{ line.rangeText }}
      </p>

      <p
        :class="[
          `text-${line.damageType}`,
          {
            'text-2xl': !isSpellbook,
            'text-lg': isSpellbook,
          },
        ]"
      >
        {{ line.dieText }}
      </p>
    </div>
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

type DamageEntry = NonNullable<Spell['damages']>[number]

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

const dieForEntry = (entry: DamageEntry): string | undefined => {
  if ('damage_at_character_level' in entry) {
    const list = entry.damage_at_character_level
    const level = closestLevel(Object.keys(list).map(Number), characterLevel.value)
    return level !== undefined ? list[String(level)] : undefined
  }
  const list = entry.damage_at_slot_level
  const level = closestLevel(Object.keys(list).map(Number), slotLevel.value)
  return level !== undefined ? list[String(level)] : undefined
}

// Bonus global (modificateur d'incantation + bonus manifestation) pour une entrée.
const bonusForEntry = (entry: DamageEntry): number => {
  let bonus = 0
  if (entry.isSpellcastingModifierAdded && spellcastingModifier.value !== null) bonus += spellcastingModifier.value ?? 0
  bonus += eldritchBlastBonus.value // = 0 pour tout sort autre que Décharge occulte
  return bonus
}

type Line = { key: string, label?: string, damageType: string, dieText: string, rangeText: string }

const lines = computed<Line[]>(() => {
  const damages = props.spell.damages ?? []
  const result: Line[] = []

  for (const [i, entry] of damages.entries()) {
    const die = dieForEntry(entry)
    if (!die) continue

    const bonus = bonusForEntry(entry)

    // Texte principal (die + éventuel modificateur + type de dégâts)
    let dieText = die
    if (bonus !== 0) {
      if (isSpellbook) {
        dieText += ` ${formatModifier(bonus)}`
      }
      else if (entry.isSpellcastingModifierAdded && eldritchBlastBonus.value === 0) {
        dieText += ' + mod'
      }
      else {
        dieText += ` ${formatModifier(bonus)}`
      }
    }
    if (!isSpellbook) {
      const count = isNumeric(die) ? Number(die) : 0
      dieText += ` ${t(`damage_types.${entry.damage_type}`, count)}`
    }

    // Fourchette min~max (mode grimoire)
    let rangeText = ''
    if (isSpellbook) {
      const { count, die: faces } = parseDie(die)
      const min = count + bonus
      const max = count * faces + bonus
      rangeText = `${min}${min !== max ? `~${max}` : ''} ${t(`damage_types.${entry.damage_type}`, Math.max(min, max))}`
    }

    result.push({
      key: `${entry.damage_type}-${i}`,
      label: entry.label,
      damageType: entry.damage_type,
      dieText,
      rangeText,
    })
  }

  return result
})
</script>
