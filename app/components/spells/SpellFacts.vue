<template>
  <ul
    v-if="facts.length"
    class="flex flex-wrap gap-1.5"
  >
    <li
      v-for="fact in facts"
      :key="fact.key"
    >
      <UTooltip
        v-if="fact.hint"
        :delay-duration="0"
        :text="fact.hint"
      >
        <UBadge
          :label="fact.label"
          :color="fact.color"
          variant="subtle"
          size="md"
        />
      </UTooltip>
      <UBadge
        v-else
        :label="fact.label"
        :color="fact.color"
        variant="subtle"
        size="md"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
const props = defineProps<{
  spell: Spell
  saveDc?: number | null
  attackBonus?: number | null
}>()

const { t } = useI18n()

const facts = computed(() => spellFacts(props.spell, {
  abilityLabel: ability => t(`ability_scores.${ability}`),
  saveDc: props.saveDc,
  attackBonus: props.attackBonus,
}))
</script>
