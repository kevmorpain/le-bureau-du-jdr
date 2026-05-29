<template>
  <div
    class="flex items-center gap-x-3 gap-y-1 py-1.5 px-2 rounded-md cursor-pointer group flex-wrap hover:bg-elevated/50 transition-colors"
    @click="$emit('click')"
  >
    <!-- Warning somatique -->
    <UTooltip
      v-if="hasSomaticWarning"
      :delay-duration="0"
      text="Composante somatique impossible (incapacité)"
    >
      <UIcon
        name="i-heroicons:exclamation-triangle"
        class="size-4 text-warning flex-none"
      />
    </UTooltip>

    <!-- Nom -->
    <span class="font-medium min-w-0 flex-shrink-0">{{ spell.name }}</span>

    <!-- Infos clés -->
    <ul class="flex items-center gap-x-3 text-muted text-xs flex-wrap">
      <li class="flex items-center gap-1">
        <StarsIcon class="size-3.5 flex-none" />
        {{ spell.castingTime }}
      </li>

      <li class="flex items-center gap-1">
        <TargetIcon class="size-3.5 flex-none" />
        {{ displayedRange }}
      </li>

      <li class="flex items-center gap-1">
        <HourglassIcon class="size-3.5 flex-none" />
        {{ spell.duration }}
      </li>

      <li v-if="spell.dc">
        <UTooltip
          :delay-duration="0"
          :text="`JdS de ${$t(`ability_scores.${spell.dc.ability}`)}`"
        >
          <ShieldIcon class="size-3.5" />
        </UTooltip>
      </li>

      <li v-if="spell.concentration">
        <UTooltip
          :delay-duration="0"
          :text="$t('concentration')"
        >
          <ConcentrationIcon class="size-3.5" />
        </UTooltip>
      </li>

      <li v-if="spell.ritual">
        <UTooltip
          :delay-duration="0"
          :text="$t('ritual')"
        >
          <MagicSquareIcon class="size-3.5" />
        </UTooltip>
      </li>
    </ul>

    <!-- Composantes -->
    <ul class="flex items-center gap-1">
      <li
        v-for="component in spell.components"
        :key="component"
      >
        <UTooltip
          :delay-duration="0"
          :text="component"
        >
          <Component
            :is="getComponentIcon(component)"
            class="size-3.5"
            :class="{ 'text-warning': hasSomaticWarning && component === SpellComponent.Somatic }"
          />
        </UTooltip>
      </li>
    </ul>

    <!-- Badge source (Pacte / Manifestation) -->
    <UTooltip
      v-if="source"
      :text="sourceTooltip"
      :delay-duration="0"
    >
      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 whitespace-nowrap">
        {{ sourceLabel }}
      </span>
    </UTooltip>

    <!-- Badge modifications Décharge occulte (Manifestations) -->
    <UTooltip
      v-if="eldritchBlastModifierLabel"
      :text="eldritchBlastModifierTooltip"
      :delay-duration="0"
    >
      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 whitespace-nowrap">
        📿 {{ eldritchBlastModifierLabel }}
      </span>
    </UTooltip>

    <!-- Dégâts / Soins calculés -->
    <span
      v-if="damageText"
      class="text-xs font-mono"
      :class="`text-${spell.damage!.damage_type}`"
    >
      {{ damageText }}
    </span>
    <span
      v-else-if="healText"
      class="text-xs font-mono text-heal"
    >
      {{ healText }}
    </span>

    <div class="ml-auto flex items-center gap-2">
      <!-- Toggle préparé -->
      <div @click.stop>
        <UCheckbox
          v-model="prepared"
          label="Préparé"
        />
      </div>

      <!-- Supprimer -->
      <UButton
        icon="i-heroicons:trash"
        variant="ghost"
        color="error"
        size="xs"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop="$emit('remove')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { CauldronIcon, HandGestureIcon, VoiceActivateIcon } from '#components'
import { SpellComponent } from '~~/server/db/schema/spells'

const props = defineProps<{
  spell: Spell
  isPrepared: boolean
  hasSomaticWarning: boolean
  characterLevel: number
  spellcastingModifier: number | null
  source?:
    | 'pact_chain'
    | 'pact_tome'
    | 'invocation'
    | 'arcanum_6'
    | 'arcanum_7'
    | 'arcanum_8'
    | 'arcanum_9'
    | 'book_of_ancient_secrets'
    | null
  // Modifications de Décharge occulte (passées par MagicSection)
  eldritchBlastAgonizing?: boolean
  eldritchBlastRepelling?: boolean
  eldritchBlastRangeExtended?: boolean
  eldritchBlastSourceNames?: string[]
  charismaModifier?: number
}>()

const emit = defineEmits<{
  'click': []
  'toggle-prepared': [value: boolean]
  'remove': []
}>()

const prepared = computed({
  get: () => props.isPrepared,
  set: (val: boolean) => emit('toggle-prepared', val),
})

const { t } = useI18n()

const getComponentIcon = (component: SpellComponent): Component => {
  switch (component) {
    case SpellComponent.Vocal: return VoiceActivateIcon
    case SpellComponent.Somatic: return HandGestureIcon
    case SpellComponent.Material: return CauldronIcon
  }
}

const getClosestDie = (record: Record<string, string>, atLevel: number): string | undefined => {
  const level = closestLevel(Object.keys(record).map(Number), atLevel)
  return level !== undefined ? record[String(level)] : undefined
}

// Nombre de rayons de Décharge occulte au niveau du perso (5e PHB)
const eldritchBlastRayCount = computed(() => {
  const lvl = props.characterLevel
  if (lvl >= 17) return 4
  if (lvl >= 11) return 3
  if (lvl >= 5) return 2
  return 1
})

const isEldritchBlast = computed(() => props.spell.name === 'Décharge occulte')

const displayedRange = computed(() => {
  if (isEldritchBlast.value && props.eldritchBlastRangeExtended) return '90 m'
  return formatRange(props.spell.range)
})

const damageText = computed<string | null>(() => {
  if (!props.spell.damage) return null
  const dmg = props.spell.damage

  let die: string | undefined
  if ('damage_at_character_level' in dmg) {
    die = getClosestDie(dmg.damage_at_character_level, props.characterLevel)
  } else {
    die = getClosestDie(dmg.damage_at_slot_level, props.spell.level || 1)
  }

  if (!die) return null

  let bonus = 0
  if (dmg.isSpellcastingModifierAdded && props.spellcastingModifier !== null) {
    bonus += props.spellcastingModifier
  }
  // Coup éldritique agonisant : +CHA mod par rayon de Décharge occulte
  if (isEldritchBlast.value && props.eldritchBlastAgonizing && props.charismaModifier != null) {
    bonus += props.charismaModifier * eldritchBlastRayCount.value
  }
  const mod = bonus !== 0 ? ` ${formatModifier(bonus)}` : ''
  const type = t(`damage_types.${dmg.damage_type}`, 1)

  return `${die}${mod} ${type}`
})

const ARCANUM_SOURCES = ['arcanum_6', 'arcanum_7', 'arcanum_8', 'arcanum_9'] as const
type ArcanumSource = typeof ARCANUM_SOURCES[number]

const arcanumLevel = (s: ArcanumSource) => Number(s.split('_')[1])

const sourceLabel = computed(() => {
  if (props.source === 'pact_chain') return 'Pacte · Chaîne'
  if (props.source === 'pact_tome') return 'Pacte · Tome'
  if (props.source === 'invocation') return 'Manifestation'
  if (props.source === 'book_of_ancient_secrets') return 'Livre des Ombres'
  if (props.source && (ARCANUM_SOURCES as readonly string[]).includes(props.source)) {
    return `Arcanum (niv. ${arcanumLevel(props.source as ArcanumSource)}) — 1/repos long`
  }
  return ''
})

const sourceTooltip = computed(() => {
  if (props.source === 'pact_chain') return 'Sort octroyé par le Pacte de la Chaîne'
  if (props.source === 'pact_tome') return 'Sort mineur du Pacte du Tome'
  if (props.source === 'invocation') return 'Sort octroyé par une manifestation occulte'
  if (props.source === 'book_of_ancient_secrets') {
    return 'Sort rituel inscrit dans votre Livre des Ombres (lançable uniquement en tant que rituel).'
  }
  if (props.source && (ARCANUM_SOURCES as readonly string[]).includes(props.source)) {
    const lvl = arcanumLevel(props.source as ArcanumSource)
    return `Arcane Mystérieux (niv. ${lvl}) — peut être lancé 1 fois par repos long sans dépenser d'emplacement de sort.`
  }
  return ''
})

const activeEldritchBlastModifiers = computed(() => {
  if (!isEldritchBlast.value) return []
  const list: string[] = []
  if (props.eldritchBlastAgonizing) list.push('Coup agonisant')
  if (props.eldritchBlastRepelling) list.push('Repousse 3 m')
  if (props.eldritchBlastRangeExtended) list.push('Portée 90 m')
  return list
})

const eldritchBlastModifierLabel = computed(() => {
  if (!activeEldritchBlastModifiers.value.length) return ''
  return activeEldritchBlastModifiers.value.length === 1
    ? activeEldritchBlastModifiers.value[0]
    : `${activeEldritchBlastModifiers.value.length} modifs`
})

const eldritchBlastModifierTooltip = computed(() => {
  const mods = activeEldritchBlastModifiers.value.join(' · ')
  const sources = (props.eldritchBlastSourceNames ?? []).join(', ')
  return sources ? `${mods} (via ${sources})` : mods
})

const healText = computed<string | null>(() => {
  if (!props.spell.heal) return null
  const heal = props.spell.heal

  let die: string | undefined
  if ('heal_at_character_level' in heal) {
    die = getClosestDie(heal.heal_at_character_level, props.characterLevel)
  } else {
    die = getClosestDie(heal.heal_at_slot_level, props.spell.level || 1)
  }

  if (!die) return null

  const mod = heal.isSpellcastingModifierAdded && props.spellcastingModifier !== null
    ? ` ${formatModifier(props.spellcastingModifier)}`
    : ''
  const type = t(`heal_types.${heal.heal_type}`, 1)

  return `${die}${mod} ${type}`
})
</script>
