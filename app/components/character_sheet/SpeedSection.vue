<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
    <p class="font-semibold text-muted">
      Vitesse
    </p>

    <p class="flex items-center gap-1">
      <UIcon
        name="i-game-icons:run"
        class="size-4 mr-1"
      />
      <span :class="speedModifiers.length ? 'text-rose-400 font-semibold' : ''">{{ $n(effectiveSpeed) }} m</span>
      <ConditionWarning :lines="speedModifiers" />
    </p>
    <p class="text-xs text-muted">
      {{ speedInSquares }} case{{ speedInSquares > 1 ? 's' : '' }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  speed,
  effectiveSpeed,
  speedModifiers,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const speedInSquares = computed(() => effectiveSpeed.value / 1.5)
</script>
