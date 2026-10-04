<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <TransitionGroup name="dice-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-xl px-4 py-2.5 min-w-48 max-w-72 shadow-xl border"
          :class="toast.isCrit
            ? 'bg-amber-950 border-amber-500'
            : toast.isFumble
              ? 'bg-red-950 border-red-600'
              : toast.critDamage
                ? 'bg-amber-950/60 border-amber-700'
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
            <span class="text-xs text-zinc-500">{{ rollDiceText(toast) }}</span>
            <span
              v-if="toast.isCrit"
              class="text-xs font-bold text-amber-400 ml-1"
            >CRITIQUE !</span>
            <span
              v-else-if="toast.isFumble"
              class="text-xs font-bold text-red-400 ml-1"
            >FUMBLE !</span>
          </div>
          <p
            v-for="note in rollNotes(toast)"
            :key="note"
            class="text-xs mt-1"
            :class="toast.autoFail?.length ? 'text-red-400' : 'text-zinc-400'"
          >
            {{ note }}
          </p>
        </div>
      </TransitionGroup>

      <UPopover :content="{ side: 'top', align: 'end' }">
        <UButton
          class="pointer-events-auto shadow-lg"
          icon="i-game-icons:rolling-dices"
          :color="hasPending ? 'primary' : 'neutral'"
          :variant="hasPending ? 'solid' : 'outline'"
          size="md"
          :label="pendingLabel ?? 'Jets'"
          aria-label="Jets : prochain jet et historique"
        />

        <template #content>
          <div class="w-80 p-3 space-y-3">
            <section class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-widest text-muted">
                Prochain jet
              </p>
              <div class="grid grid-cols-2 gap-1">
                <UButton
                  v-for="mode in modes"
                  :key="mode.value"
                  size="xs"
                  color="neutral"
                  :variant="pending.override === mode.value ? 'solid' : 'outline'"
                  :label="mode.label"
                  @click="pending.override = mode.value"
                />
              </div>
              <div
                v-if="situations.length"
                class="space-y-1"
              >
                <p class="text-xs text-muted">
                  La sauvegarde ou le jet est lancé contre…
                </p>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="situation in situations"
                    :key="situation"
                    size="md"
                    class="cursor-pointer"
                    :color="pending.situations.includes(situation) ? 'primary' : 'neutral'"
                    :variant="pending.situations.includes(situation) ? 'solid' : 'outline'"
                    :label="situationLabel(situation)"
                    @click="toggleSituation(situation)"
                  />
                </div>
              </div>
              <USwitch
                v-model="pending.crit"
                label="Dégâts critiques (dés doublés)"
                size="sm"
              />
            </section>

            <section class="space-y-1">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold uppercase tracking-widest text-muted">
                  Historique
                </p>
                <UButton
                  v-if="history.entries.value.length"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  label="Effacer"
                  @click="history.clear()"
                />
              </div>
              <p
                v-if="!history.entries.value.length"
                class="text-xs text-muted py-2"
              >
                Aucun jet pour l'instant.
              </p>
              <ul class="max-h-72 overflow-y-auto divide-y divide-default">
                <li
                  v-for="entry in history.entries.value"
                  :key="entry.id"
                  class="flex items-start gap-2 py-1.5"
                >
                  <span
                    class="w-9 shrink-0 text-right text-lg font-black leading-tight"
                    :class="entry.isCrit ? 'text-amber-400' : entry.isFumble ? 'text-red-400' : ''"
                  >{{ entry.result }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium truncate">
                      {{ entry.label }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ rollDiceText(entry) }} · {{ timeOf(entry) }}
                    </p>
                    <p
                      v-for="note in rollNotes(entry)"
                      :key="note"
                      class="text-xs text-muted"
                    >
                      {{ note }}
                    </p>
                  </div>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons:arrow-path"
                    aria-label="Relancer"
                    @click="replay(entry)"
                  />
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons:clipboard-document"
                    aria-label="Copier"
                    @click="copy(entry)"
                  />
                </li>
              </ul>
            </section>
          </div>
        </template>
      </UPopover>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { DiceRoll } from '~/composables/useDiceRoller'
import { situationLabel, type RollOverride } from '~~/shared/rules/rolls'

const { toasts, roll, engine, history } = useDiceRoller()
const pending = engine.pending
const situations = engine.situations

const modes: { value: RollOverride, label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'advantage', label: 'Avantage' },
  { value: 'disadvantage', label: 'Désavantage' },
  { value: 'normal', label: 'Normal' },
]

const toggleSituation = (situation: string) => {
  const selected = pending.value.situations
  pending.value.situations = selected.includes(situation) ? selected.filter(s => s !== situation) : [...selected, situation]
}

const hasPending = computed(() => pending.value.override !== 'auto' || pending.value.situations.length > 0 || pending.value.crit)

// Le prochain jet est toujours visible depuis le bouton, même fenêtre fermée.
const pendingLabel = computed(() => {
  if (!hasPending.value) return null
  return [
    ...(pending.value.override === 'auto' ? [] : [modes.find(m => m.value === pending.value.override)!.label]),
    ...pending.value.situations.map(situationLabel),
    ...(pending.value.crit ? ['Critique'] : []),
  ].join(' · ')
})

const timeOf = (entry: DiceRoll) =>
  new Date(entry.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const replay = (entry: DiceRoll) => {
  const { label, modifier, sides, count, options } = entry.replay
  roll(label, modifier, sides, count, options)
}

const copy = async (entry: DiceRoll) => {
  try {
    await navigator.clipboard.writeText(rollText(entry))
    useToast().add({ title: 'Jet copié', color: 'success' })
  } catch {
    useToast().add({ title: 'Copie impossible', color: 'error' })
  }
}
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
