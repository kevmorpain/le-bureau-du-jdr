<template>
  <div class="min-h-screen flex flex-col bg-(--ui-bg)">
    <!-- Header -->
    <header class="sticky top-0 z-50 flex items-center gap-3 px-4 h-11 bg-(--ui-bg-elevated) border-b border-(--ui-border) shadow-sm">
      <NuxtLink
        :to="backTo ?? '/'"
        class="text-xs text-muted hover:text-(--ui-text) transition-colors"
      >
        {{ backLabel ?? '←' }}
      </NuxtLink>
      <USeparator orientation="vertical" class="h-4" />
      <span class="text-sm font-bold text-(--ui-text)">{{ title }}</span>
      <slot name="header-subtitle" />
      <div class="ml-auto flex items-center gap-2">
        <slot name="header-actions" />
      </div>
    </header>

    <!-- Sidebar mobile (pills) -->
    <nav class="lg:hidden flex items-center gap-1.5 px-3 py-2 border-b border-(--ui-border) overflow-x-auto scrollbar-none">
      <button
        v-for="step in steps"
        :key="step.id"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors border"
        :class="pillClass(step.id)"
        @click="$emit('go-to', step.id)"
      >
        <span v-if="isStepComplete(step.id) && step.id !== currentStepId" class="text-green-400">✓</span>
        <UIcon v-else :name="step.icon" class="size-3.5" />
        {{ step.label }}
      </button>
    </nav>

    <!-- Corps -->
    <div class="flex flex-1 min-h-0">
      <!-- Sidebar desktop -->
      <nav class="hidden lg:flex flex-col gap-1 py-4 px-3 border-r border-(--ui-border) w-48 shrink-0 sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3 px-2">Étapes</p>
        <button
          v-for="step in steps"
          :key="step.id"
          class="flex flex-col gap-0.5 w-full text-left px-3 py-2 rounded-lg transition-colors"
          :class="sidebarButtonClass(step.id)"
          @click="$emit('go-to', step.id)"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm leading-none shrink-0">
              <span v-if="isStepComplete(step.id) && step.id !== currentStepId" class="text-green-400 text-base">✓</span>
              <UIcon v-else :name="step.icon" class="size-4" />
            </span>
            <span class="text-sm font-medium truncate">{{ step.label }}</span>
            <span
              v-if="step.id === currentStepId"
              class="ml-auto size-1.5 rounded-full bg-amber-400 shrink-0"
            />
          </div>
          <p
            v-if="stepSummaries?.[step.id]"
            class="text-xs text-muted leading-tight pl-6 truncate"
          >
            {{ stepSummaries[step.id] }}
          </p>
        </button>
      </nav>

      <!-- Zone centrale -->
      <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div class="flex-1 px-6 py-6">
          <slot />
        </div>

        <!-- Navigation bas -->
        <div class="sticky bottom-0 bg-(--ui-bg) border-t border-(--ui-border) px-6 py-3">
          <div class="flex justify-between items-center">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="!canGoPrev"
              leading-icon="i-heroicons:arrow-left"
              @click="$emit('prev')"
            >
              Précédent
            </UButton>
            <span class="text-xs text-muted">{{ currentStep?.label }}</span>
            <UButton
              :disabled="!canGoNext"
              :color="canGoNext ? 'warning' : 'neutral'"
              :variant="canGoNext ? 'solid' : 'ghost'"
              trailing-icon="i-heroicons:arrow-right"
              @click="$emit('next')"
            >
              {{ isLastStep ? 'Terminer' : 'Suivant' }}
            </UButton>
          </div>
        </div>
      </main>

      <!-- Aperçu desktop -->
      <aside class="hidden lg:flex flex-col gap-3 py-4 px-3 w-56 shrink-0 border-l border-(--ui-border) sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto">
        <slot name="preview" />
      </aside>
    </div>

    <!-- Aperçu mobile (accordéon) -->
    <div class="lg:hidden border-t border-(--ui-border)">
      <button
        class="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted"
        @click="previewOpen = !previewOpen"
      >
        <span>Aperçu du personnage</span>
        <UIcon
          name="i-heroicons:chevron-down"
          class="size-4 transition-transform duration-200"
          :class="previewOpen ? 'rotate-180' : ''"
        />
      </button>
      <div v-show="previewOpen" class="px-4 pb-4">
        <slot name="preview-mobile" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface WizardStep {
  id: string
  label: string
  icon: string
}

const props = defineProps<{
  title: string
  backTo?: string
  backLabel?: string
  steps: WizardStep[]
  currentStepId: string
  canGoNext: boolean
  canGoPrev: boolean
  isLastStep: boolean
  stepSummaries?: Record<string, string | null>
  isStepComplete: (stepId: string) => boolean
}>()

defineEmits<{
  next: []
  prev: []
  'go-to': [stepId: string]
}>()

const previewOpen = ref(false)
const currentStep = computed(() => props.steps.find(s => s.id === props.currentStepId) ?? null)

function sidebarButtonClass(stepId: string): string {
  const active = stepId === props.currentStepId
  const done = props.isStepComplete(stepId)
  if (active) return 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
  if (done) return 'text-muted hover:bg-(--ui-bg-elevated)'
  return 'text-muted/60 hover:bg-(--ui-bg-elevated)'
}

function pillClass(stepId: string): string {
  const active = stepId === props.currentStepId
  const done = props.isStepComplete(stepId)
  if (active) return 'bg-amber-500/10 border-amber-500/40 text-amber-400'
  if (done) return 'border-(--ui-border) text-muted'
  return 'border-(--ui-border) text-muted/50'
}
</script>
