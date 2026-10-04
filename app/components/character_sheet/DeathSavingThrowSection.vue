<template>
  <div
    v-if="isDying || isDead"
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
            :class="n <= successes
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
            :class="n <= failures
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

    <p
      v-if="isDead"
      class="text-xs font-bold text-red-400"
    >
      ☠ Mort — {{ failures >= DEATH_SAVE_LIMIT ? '3 échecs' : 'épuisement de niveau 6' }}
    </p>
    <p
      v-else-if="isStable"
      class="text-xs font-bold text-green-400"
    >
      ♥ Stabilisé — 3 succès
    </p>
    <template v-if="!isDead && !isStable">
      <UButton
        v-if="rollsEnabled"
        size="xs"
        variant="outline"
        color="neutral"
        class="w-full"
        @click="rollSave"
      >
        Lancer un jet de mort
      </UButton>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <UInput
          v-model.number="enteredNatural"
          type="number"
          :min="1"
          :max="20"
          size="xs"
          placeholder="d20 obtenu"
          aria-label="Résultat du d20 du jet de mort"
          class="flex-1"
          @keydown.enter="enterSave"
        />
        <UButton
          size="xs"
          variant="outline"
          color="neutral"
          :disabled="!validNatural"
          @click="enterSave"
        >
          Valider
        </UButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { DEATH_SAVE_LIMIT, rollDeathSave } from '~~/shared/rules/damage'

const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const { hitPointState, setHitPointState, isDead, isDying, isStable } = useCharacterSheet(toRef(props, 'characterSheet'))

const successes = computed(() => hitPointState.value.deathSaveSuccesses)
const failures = computed(() => hitPointState.value.deathSaveFailures)

const toggleSave = (type: 'success' | 'failure', n: number) => {
  const key = type === 'success' ? 'deathSaveSuccesses' : 'deathSaveFailures'
  const current = hitPointState.value[key]
  setHitPointState({ ...hitPointState.value, [key]: current === n ? n - 1 : n })
}

const toaster = useToast()

const rollsEnabled = useRollsEnabled()
const enteredNatural = ref<number | null>(null)
const validNatural = computed(() => Number.isInteger(enteredNatural.value) && enteredNatural.value! >= 1 && enteredNatural.value! <= 20)

const rollSave = () => applySave(props.roll?.('Jet de mort', 0) ?? 0)

// Un d20 saisi à la table suit la même règle qu'un jet de l'application (20 : 1 PV, 1 : deux échecs).
const enterSave = () => {
  if (!validNatural.value) return
  applySave(enteredNatural.value!)
  enteredNatural.value = null
}

const applySave = (natural: number) => {
  const { state, outcome } = rollDeathSave(hitPointState.value, natural)
  setHitPointState(state)
  if (outcome === 'recovered') toaster.add({ title: '20 naturel — récupéré à 1 PV !', color: 'success' })
  else if (outcome === 'two-failures') toaster.add({ title: '1 naturel — 2 échecs !', color: 'error' })
}
</script>
