<template>
  <div class="flex flex-wrap items-center gap-1">
    <template
      v-for="(group, idx) in groups"
      :key="idx"
    >
      <span
        v-if="idx > 0"
        class="text-xs text-muted"
      >
        ou
      </span>
      <span
        v-for="req in group"
        :key="req.label"
        class="text-xs px-1.5 py-0.5 rounded font-mono font-bold"
        :class="req.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'"
      >
        {{ req.label }}
      </span>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ABILITY_SHORT, type AbilityKey } from '~/data/character-builder'
import type { MulticlassPrerequisites } from '~~/shared/rules/multiclass'

const props = defineProps<{ prerequisites: MulticlassPrerequisites, scores: Record<AbilityKey, number> }>()

const groups = computed(() => props.prerequisites.map(group =>
  (Object.entries(group) as [AbilityKey, number][]).map(([ability, min]) => ({
    label: `${ABILITY_SHORT[ability]} ≥${min} (${props.scores[ability]})`,
    ok: (props.scores[ability] ?? 0) >= min,
  }))))
</script>
