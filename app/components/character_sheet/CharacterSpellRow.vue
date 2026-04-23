<template>
  <div
    class="flex items-center gap-x-3 gap-y-1 py-1.5 px-2 rounded-md cursor-pointer group flex-wrap hover:bg-elevated/50 transition-colors"
    :class="{ 'opacity-40': !isAvailable }"
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
        {{ formatRange(spell.range) }}
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
  isAvailable: boolean
  hasSomaticWarning: boolean
  characterLevel: number
  spellcastingModifier: number | null
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

  const mod = dmg.isSpellcastingModifierAdded && props.spellcastingModifier !== null
    ? ` ${formatModifier(props.spellcastingModifier)}`
    : ''
  const type = t(`damage_types.${dmg.damage_type}`, 1)

  return `${die}${mod} ${type}`
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
