<template>
  <div class="space-y-2">
    <p
      v-if="spell.material"
      class="italic"
    >
      ({{ spell.material }})
    </p>

    <SpellFacts
      :spell
      :save-dc
      :attack-bonus
    />

    <HealSection
      v-if="spell.heal"
      :spell
    />

    <DamageSection
      v-if="spell.damages?.length"
      :spell
    />

    <UpcastSection :spell />

    <LightMarkdown
      :source="spell.description ?? ''"
      class="leading-5"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  spell: Spell
  saveDc?: number | null
  attackBonus?: number | null
}>()
</script>
