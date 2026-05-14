<template>
  <!-- Desktop : sidebar verticale -->
  <nav class="hidden lg:flex flex-col gap-1 py-4 px-3 border-r border-(--ui-border) w-48 shrink-0">
    <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3 px-2">
      Étapes
    </p>

    <button
      v-for="step in activeSteps"
      :key="step.id"
      class="flex flex-col gap-0.5 w-full text-left px-3 py-2 rounded-lg transition-colors duration-150"
      :class="stepButtonClass(step.id)"
      @click="goTo(step.id)"
    >
      <div class="flex items-center gap-2">
        <span class="shrink-0 text-base leading-none">
          <span v-if="isStepComplete(step.id) && step.id !== currentStepId" class="text-green-400">✓</span>
          <UIcon v-else :name="step.icon" class="size-4" />
        </span>
        <span class="text-sm font-medium truncate">{{ step.label }}</span>
        <span
          v-if="step.id === currentStepId"
          class="ml-auto size-1.5 rounded-full bg-amber-400 shrink-0"
        />
      </div>

      <!-- Résumé de la valeur sélectionnée -->
      <p
        v-if="stepSummaries[step.id]"
        class="text-xs text-muted leading-tight pl-6 truncate"
      >
        {{ stepSummaries[step.id] }}
      </p>
    </button>
  </nav>

  <!-- Mobile / tablette portrait : pills horizontales -->
  <nav class="lg:hidden flex items-center gap-1.5 px-3 py-2 border-b border-(--ui-border) overflow-x-auto scrollbar-none">
    <button
      v-for="step in activeSteps"
      :key="step.id"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors duration-150 border"
      :class="stepPillClass(step.id)"
      @click="goTo(step.id)"
    >
      <span v-if="isStepComplete(step.id) && step.id !== currentStepId" class="text-green-400 leading-none">✓</span>
      <UIcon v-else :name="step.icon" class="size-3.5" />
      {{ step.label }}
    </button>
  </nav>
</template>

<script lang="ts" setup>
const { activeSteps, currentStepId, isStepComplete, stepSummaries, goTo } = useCharacterBuilder()

function stepButtonClass(stepId: string): string {
  const active = stepId === currentStepId.value
  const done = isStepComplete.value(stepId)
  if (active) return 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
  if (done) return 'text-muted hover:bg-(--ui-bg-elevated)'
  return 'text-muted/60 hover:bg-(--ui-bg-elevated)'
}

function stepPillClass(stepId: string): string {
  const active = stepId === currentStepId.value
  const done = isStepComplete.value(stepId)
  if (active) return 'bg-amber-500/10 border-amber-500/40 text-amber-400'
  if (done) return 'border-(--ui-border) text-muted'
  return 'border-(--ui-border) text-muted/50'
}
</script>
