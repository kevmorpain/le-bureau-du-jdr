<template>
  <ul class="space-y-4">
    <li
      v-for="spell in spells"
      :key="spell.id"
    >
      <UCard
        variant="soft"
        class="h-full font-playfair"
      >
        <div class="grid item-template items-center gap-2">
          <div class="area-title flex items-center gap-x-6">
            <UCheckbox
              size="xl"
              :model-value="isSelected(spell)"
              @update:model-value="toggleSpell(spell)"
            />

            <h2 class="text-xl font-inknut-antiqua">
              {{ spell.name }}
            </h2>
          </div>

          <div class="area-content flex gap-x-4 gap-y-2 flex-wrap">
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
                v-if="spell.ritual"
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
                v-if="spell.concentration"
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

          <div class="area-school text-right justify-end flex items-center gap-x-2">
            <p>{{ $t(`schools.${spell.school!.name}`) }}</p>

            <p class="bg-pink-950 text-white rounded-full size-8 flex items-center justify-center text-2xl font-inknut-antiqua relative">
              <span class="absolute -top-1">{{ spell.level }}</span>
            </p>
          </div>
        </div>
      </UCard>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { CauldronIcon, HandGestureIcon, VoiceActivateIcon } from '#components'
import { SpellComponent } from '~~/server/database/schema/spells'

defineProps<{
  spells: Spell[]
}>()

const { spellBook } = useSpellbook()

const isSelected = (spell: Spell): boolean => {
  return spellBook.value.some(s => s.id === spell.id)
}

const toggleSpell = (spell: Spell): void => {
  if (isSelected(spell)) {
    spellBook.value = spellBook.value.filter(s => s.id !== spell.id)
  } else {
    spellBook.value.push(spell)
  }
}

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

<style scoped>
.item-template {
  grid-template-areas: 'title school'
      'content content';

  @media (min-width: 48rem) { /* md */
    grid-template-areas: 'title content school';
  }
}

.area-title {
  grid-area: title;
}
.area-content {
  grid-area: content;
}
.area-school {
  grid-area: school;
}
</style>
