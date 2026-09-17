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
        v-if="isSpellbook && line.rangeText"
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
import { baseCastLevels, diceRange, resolveDamageDie } from '~~/shared/rules/spellScaling'

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

// Sort lancé SANS montée en puissance : la progression par emplacement est rendue à part, par
// `UpcastSection` (l'encart « Aux niveaux supérieurs ») et par le récapitulatif de CastSpellModal
// au moment où l'emplacement est choisi.
const levels = computed(() => baseCastLevels(props.spell, characterLevel.value))

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
    const die = resolveDamageDie(entry, levels.value)
    if (!die) continue

    const bonus = bonusForEntry(entry)

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

    let rangeText = ''
    if (isSpellbook) {
      const range = diceRange(die, bonus)
      if (range) {
        const { min, max } = range
        rangeText = `${min}${min !== max ? `~${max}` : ''} ${t(`damage_types.${entry.damage_type}`, Math.max(min, max))}`
      }
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
