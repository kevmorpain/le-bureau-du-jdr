<template>
  <UCard
    variant="soft"
    class="h-full font-playfair"
  >
    <template #header>
      <div class="flex items-center justify-between gap-x-2">
        <h2 class="text-xl font-inknut-antiqua">
          {{ spell.name }}
        </h2>

        <div class="text-right">
          <p class="bg-pink-950 text-white rounded-full size-8 flex items-center justify-center ml-auto text-2xl font-inknut-antiqua relative">
            <span class="absolute -top-1">{{ spell.level }}</span>
          </p>

          <p>{{ $t(`schools.${spell.school!.name}`) }}</p>
        </div>
      </div>
    </template>

    <div class="flex gap-x-4 gap-y-2 flex-wrap">
      <ul class="flex gap-x-4">
        <li>
          <StarsIcon class="flex-none size-6 mx-auto" />
          {{ spell.castingTime }}
        </li>
        <li>
          <TargetIcon class="flex-none size-6 mx-auto" />
          {{ formatRange(spell.range) }}
        </li>
        <li>
          <HourglassIcon class="flex-none size-6 mx-auto" />
          {{ spell.duration }}
        </li>
        <li v-if="spell.dc">
          <ShieldIcon class="flex-none size-6 mx-auto" />
          JdS de {{ $t(`ability_scores.${spell.dc.ability}`) }}
        </li>
        <li
          v-if="spell.concentration"
        >
          <UTooltip
            :delay-duration="0"
            :content="{ side: 'top' }"
            arrow
            text="Concentration"
          >
            <ConcentrationIcon class="flex-none size-6 mx-auto" />
          </UTooltip>
        </li>
      </ul>

      <ul class="flex gap-x-4">
        <li
          v-for="component in spell.components"
          :key="component"
        >
          <UTooltip
            :delay-duration="0"
            :content="{ side: 'top' }"
            arrow
            :text="component"
          >
            <Component
              :is="getComponent(component)"
              class="size-6"
            />
          </UTooltip>
        </li>

        <li
          v-if="spell.ritual"
        >
          <UTooltip
            :delay-duration="0"
            :content="{ side: 'top' }"
            arrow
            text="Ritual"
          >
            <MagicSquareIcon class="flex-none size-6 mx-auto" />
          </UTooltip>
        </li>
      </ul>
    </div>

    <div v-if="spell.material">
      <p class="italic">
        ({{ spell.material }})
      </p>
    </div>

    <USeparator
      class="my-2"
      decorative
    />

    <div class="space-y-2">
      <HealSection
        v-if="spell.heal"
        :spell
      />

      <DamageSection
        v-if="spell.damage"
        :spell
      />

      <p class="whitespace-pre-line leading-5">
        {{ spell.description }}
      </p>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { CauldronIcon, HandGestureIcon, VoiceActivateIcon } from '#components'
import { SpellComponent } from '~~/server/database/schema/spells'

defineProps<{
  spell: Spell
}>()

const formatRange = (range: number): string => {
  if (range === 0) {
    return 'Personnelle'
  }
  if (range === 1.5) {
    return 'Contact'
  }

  return new Intl.NumberFormat('fr-FR', { style: 'unit', unit: 'meter' }).format(range)
}

const getComponent = (component: SpellComponent): Component => {
  switch (component) {
    case SpellComponent.Vocal:
      return VoiceActivateIcon
    case SpellComponent.Somatic:
      return HandGestureIcon
    case SpellComponent.Material:
      return CauldronIcon
  }
}
</script>
