<template>
  <Teleport to="body">
    <div class="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="dice-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-xl px-4 py-2.5 min-w-48 shadow-xl border"
          :class="toast.isCrit
            ? 'bg-amber-950 border-amber-500'
            : toast.isFumble
              ? 'bg-red-950 border-red-600'
              : 'bg-stone-900 border-zinc-700'"
        >
          <p class="text-xs text-zinc-400 mb-1">
            {{ toast.label }}
          </p>
          <div class="flex items-baseline gap-2">
            <span
              class="text-3xl font-black leading-none"
              :class="toast.isCrit ? 'text-amber-400' : toast.isFumble ? 'text-red-400' : 'text-white'"
            >{{ toast.result }}</span>
            <span class="text-xs text-zinc-500">
              {{ toast.rolls.length > 1 ? toast.rolls.join('+') : toast.natural }}
              <template v-if="toast.modifier !== 0">
                {{ toast.modifier > 0 ? `+${toast.modifier}` : toast.modifier }}
              </template>
            </span>
            <span
              v-if="toast.isCrit"
              class="text-xs font-bold text-amber-400 ml-1"
            >CRITIQUE !</span>
            <span
              v-else-if="toast.isFumble"
              class="text-xs font-bold text-red-400 ml-1"
            >FUMBLE !</span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
const { toasts } = useDiceRoller()
</script>

<style scoped>
.dice-toast-enter-active {
  transition: all 0.2s ease;
}
.dice-toast-leave-active {
  transition: all 0.4s ease;
}
.dice-toast-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.dice-toast-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
