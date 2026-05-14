<template>
  <div class="min-h-screen flex flex-col bg-(--ui-bg)">
    <!-- Header -->
    <header class="sticky top-0 z-50 flex items-center gap-3 px-4 h-11 bg-(--ui-bg-elevated) border-b border-(--ui-border) shadow-sm">
      <NuxtLink
        to="/characters"
        class="text-xs text-muted hover:text-(--ui-text) transition-colors"
      >
        ← Fiches
      </NuxtLink>
      <USeparator orientation="vertical" class="h-4" />
      <span class="text-sm font-bold text-(--ui-text)">Création de personnage</span>
      <span class="text-xs text-amber-400">D&D 5e 2014</span>

      <UTooltip text="Recommencer depuis le début" class="ml-auto">
        <UButton
          variant="ghost"
          size="xs"
          color="neutral"
          icon="i-heroicons:arrow-path"
          @click="showResetConfirm = true"
        />
      </UTooltip>
    </header>

    <!-- Sidebar mobile (pills en haut) — masqué sur desktop -->
    <nav class="lg:hidden flex items-center gap-1.5 px-3 py-2 border-b border-(--ui-border) overflow-x-auto scrollbar-none">
      <button
        v-for="step in activeSteps"
        :key="step.id"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors border"
        :class="pillClass(step.id)"
        @click="goTo(step.id)"
      >
        <span v-if="isStepComplete(step.id) && step.id !== currentStepId.value" class="text-green-400">✓</span>
        <UIcon v-else :name="step.icon" class="size-3.5" />
        {{ step.label }}
      </button>
    </nav>

    <!-- Corps principal -->
    <div class="flex flex-1 min-h-0">

      <!-- Sidebar desktop — masqué sur mobile -->
      <nav class="hidden lg:flex flex-col gap-1 py-4 px-3 border-r border-(--ui-border) w-48 shrink-0 sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3 px-2">Étapes</p>
        <button
          v-for="step in activeSteps"
          :key="step.id"
          class="flex flex-col gap-0.5 w-full text-left px-3 py-2 rounded-lg transition-colors"
          :class="sidebarButtonClass(step.id)"
          @click="goTo(step.id)"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm leading-none shrink-0">
              <span v-if="isStepComplete(step.id) && step.id !== currentStepId.value" class="text-green-400 text-base">✓</span>
              <UIcon v-else :name="step.icon" class="size-4" />
            </span>
            <span class="text-sm font-medium truncate">{{ step.label }}</span>
            <span
              v-if="step.id === currentStepId.value"
              class="ml-auto size-1.5 rounded-full bg-amber-400 shrink-0"
            />
          </div>
          <p
            v-if="stepSummaries[step.id]"
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
              @click="goPrev"
            >
              Précédent
            </UButton>

            <span class="text-xs text-muted">{{ currentStep?.label }}</span>

            <UButton
              :disabled="!canGoNext"
              :color="canGoNext ? 'warning' : 'neutral'"
              :variant="canGoNext ? 'solid' : 'ghost'"
              trailing-icon="i-heroicons:arrow-right"
              @click="handleNext"
            >
              {{ isLastStep ? 'Terminer' : 'Suivant' }}
            </UButton>
          </div>
        </div>
      </main>

      <!-- Aperçu desktop -->
      <aside class="hidden lg:flex flex-col gap-3 py-4 px-3 w-56 shrink-0 border-l border-(--ui-border) sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto">
        <BuilderPreview />
      </aside>
    </div>

    <!-- Aperçu mobile (accordéon bas) -->
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
        <BuilderPreview mobile />
      </div>
    </div>

    <!-- Modal reset -->
    <UModal v-model:open="showResetConfirm">
      <template #content>
        <div class="p-6">
          <h3 class="font-bold text-(--ui-text) mb-2">Recommencer ?</h3>
          <p class="text-sm text-muted mb-4">
            Toutes vos sélections seront effacées.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="showResetConfirm = false">
              Annuler
            </UButton>
            <UButton color="error" @click="confirmReset">
              Recommencer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
const {
  activeSteps,
  currentStepId,
  currentStep,
  isStepComplete,
  stepSummaries,
  canGoNext,
  canGoPrev,
  isLastStep,
  goTo,
  goNext,
  goPrev,
  resetBuilder,
} = useCharacterBuilder()

const showResetConfirm = ref(false)
const previewOpen = ref(false)
const emit = defineEmits<{ finish: [] }>()

function handleNext() {
  if (isLastStep.value) emit('finish')
  else goNext()
}

function confirmReset() {
  showResetConfirm.value = false
  resetBuilder()
}

function sidebarButtonClass(stepId: string): string {
  const active = stepId === currentStepId.value
  const done = isStepComplete.value(stepId)
  if (active) return 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
  if (done) return 'text-muted hover:bg-(--ui-bg-elevated)'
  return 'text-muted/60 hover:bg-(--ui-bg-elevated)'
}

function pillClass(stepId: string): string {
  const active = stepId === currentStepId.value
  const done = isStepComplete.value(stepId)
  if (active) return 'bg-amber-500/10 border-amber-500/40 text-amber-400'
  if (done) return 'border-(--ui-border) text-muted'
  return 'border-(--ui-border) text-muted/50'
}
</script>
