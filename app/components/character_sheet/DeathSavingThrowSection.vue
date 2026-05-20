<template>
  <div
    v-if="isDying"
    class="rounded-xl border p-3 space-y-2 transition-all"
    :class="isDead
      ? 'border-red-600/50 bg-red-500/10'
      : isStable
        ? 'border-green-500/40 bg-green-500/8'
        : 'border-red-500/30 bg-red-500/5'"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-red-400">
        JdS contre la mort
      </span>
      <span
        v-if="!isDead && !isStable"
        class="text-xs text-red-400 animate-pulse font-semibold"
      >Inconscient</span>
    </div>

    <!-- Succès & Échecs (design en opposition depuis le centre) -->
    <div class="grid grid-cols-2 divide-x divide-default">
      <!-- Succès (gauche, dots de droite vers gauche) -->
      <div class="flex items-center justify-end gap-1 pr-2">
        <UIcon
          name="i-game-icons:sundial"
          class="size-4 shrink-0 text-green-400"
        />
        <div class="flex gap-1">
          <button
            v-for="n in [3, 2, 1]"
            :key="n"
            class="size-4 rounded-full border-2 transition-all"
            :class="n <= deathSavingThrows.success
              ? 'bg-green-500/60 border-green-500 hover:bg-green-500/80'
              : 'border-green-500/40 hover:border-green-500'"
            @click="toggleSave('success', n)"
          />
        </div>
      </div>

      <!-- Échecs (droite, dots de gauche vers droite) -->
      <div class="flex items-center justify-start gap-1 pl-2">
        <div class="flex gap-1">
          <button
            v-for="n in 3"
            :key="n"
            class="size-4 rounded-full border-2 transition-all"
            :class="n <= deathSavingThrows.failure
              ? 'bg-red-500/60 border-red-500 hover:bg-red-500/80'
              : 'border-red-500/40 hover:border-red-500'"
            @click="toggleSave('failure', n)"
          />
        </div>
        <UIcon
          name="i-game-icons:death-skull"
          class="size-4 shrink-0 text-red-400"
        />
      </div>
    </div>

    <!-- États terminaux -->
    <p
      v-if="isDead"
      class="text-xs font-bold text-red-400"
    >
      ☠ Mort — 3 échecs
    </p>
    <p
      v-else-if="isStable"
      class="text-xs font-bold text-green-400"
    >
      ♥ Stabilisé — 3 succès
    </p>
    <!-- Bouton lancer un jet de mort -->
    <UButton
      v-if="!isDead && !isStable"
      size="xs"
      variant="outline"
      color="neutral"
      class="w-full"
      @click="rollDeathSave"
    >
      Lancer un jet de mort
    </UButton>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const emit = defineEmits<{
  recover: [hp: number]
}>()

const { deathSavingThrows } = useCharacterSheet(toRef(props, 'characterSheet'))

const isDying = computed(() => props.characterSheet.currentHp === 0)
const isDead = computed(() => deathSavingThrows.value.failure >= 3)
const isStable = computed(() => deathSavingThrows.value.success >= 3)

const toggleSave = (type: 'success' | 'failure', n: number) => {
  const current = deathSavingThrows.value[type]
  deathSavingThrows.value = { ...deathSavingThrows.value, [type]: current === n ? n - 1 : n }
}

const toaster = useToast()

const rollDeathSave = () => {
  const natural = props.roll?.('Jet de mort', 0) ?? 0

  if (natural === 20) {
    // Récupération miraculeuse
    emit('recover', 1)
    deathSavingThrows.value = { success: 0, failure: 0 }
    toaster.add({ title: '20 naturel — récupéré à 1 PV !', color: 'success' })
  } else if (natural === 1) {
    deathSavingThrows.value = { ...deathSavingThrows.value, failure: Math.min(3, deathSavingThrows.value.failure + 2) }
    toaster.add({ title: '1 naturel — 2 échecs !', color: 'error' })
  } else if (natural >= 10) {
    deathSavingThrows.value = { ...deathSavingThrows.value, success: Math.min(3, deathSavingThrows.value.success + 1) }
  } else {
    deathSavingThrows.value = { ...deathSavingThrows.value, failure: Math.min(3, deathSavingThrows.value.failure + 1) }
  }
}
</script>
