<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
      subtitle="Combien de points de vie gagnez-vous ?"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Points de vie</h2>
    <p class="text-sm text-muted mb-5">
      Ajoutez votre modificateur de Constitution ({{ formatMod(conMod) }}).
    </p>

    <!-- Method selector -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="m in methods"
        :key="m.id"
        class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
        :class="state.hpMethod === m.id
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
        @click="state.hpMethod = m.id as any"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- Average method -->
    <div v-if="state.hpMethod === 'average'" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-5 text-center">
      <div class="text-xs text-muted mb-2 uppercase tracking-widest font-bold">Moyenne fixe</div>
      <div class="font-mono text-5xl font-black text-amber-400">+{{ averageHpGain }}</div>
      <div class="text-xs text-muted mt-2">
        ⌈d{{ pickedClass?.hitDie ?? '?' }}/2⌉ + 1 {{ conMod >= 0 ? '+' : '' }}{{ conMod }} CON
      </div>
    </div>

    <!-- Roll method -->
    <div v-else-if="state.hpMethod === 'roll'" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-5">
      <div class="text-xs text-muted mb-4 uppercase tracking-widest font-bold text-center">Jet de dé</div>

      <!-- Dice result display -->
      <div class="flex items-center justify-center gap-4 mb-5">
        <div class="text-center">
          <div class="text-xs text-muted mb-1">Jet (1d{{ pickedClass?.hitDie ?? '?' }})</div>
          <div
            class="size-16 rounded-xl border-2 flex items-center justify-center font-mono text-3xl font-black"
            :class="state.hpRolled != null ? 'border-amber-500/60 text-amber-400' : 'border-(--ui-border) text-muted'"
          >
            {{ state.hpRolled ?? '?' }}
          </div>
        </div>
        <span class="text-xl text-muted">+</span>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">CON</div>
          <div class="size-16 rounded-xl border-2 border-(--ui-border) flex items-center justify-center font-mono text-xl font-bold text-(--ui-text)">
            {{ formatMod(conMod) }}
          </div>
        </div>
        <span class="text-xl text-muted">=</span>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">Total</div>
          <div
            class="size-16 rounded-xl border-2 flex items-center justify-center font-mono text-3xl font-black"
            :class="state.hpGained != null ? 'border-green-500/60 text-green-400' : 'border-(--ui-border) text-muted'"
          >
            {{ state.hpGained != null ? `+${state.hpGained}` : '?' }}
          </div>
        </div>
      </div>

      <UButton block color="warning" @click="rollDie">
        🎲 Lancer 1d{{ pickedClass?.hitDie ?? '?' }}
      </UButton>

      <!-- Manual override for roll -->
      <div class="mt-4 flex items-center gap-2">
        <span class="text-xs text-muted">Ou entrer le résultat du jet :</span>
        <input
          v-model.number="state.hpRolled"
          type="number"
          :min="1"
          :max="pickedClass?.hitDie ?? 12"
          class="w-16 px-2 py-1 rounded-lg border border-(--ui-border) bg-(--ui-bg) text-sm font-mono text-center text-(--ui-text) focus:border-amber-500/60 focus:outline-none"
        >
      </div>
    </div>

    <!-- Manual method -->
    <div v-else-if="state.hpMethod === 'manual'" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-5">
      <div class="text-xs text-muted mb-4 uppercase tracking-widest font-bold text-center">Saisie manuelle</div>
      <div class="flex items-center gap-4 justify-center">
        <div class="text-center">
          <div class="text-xs text-muted mb-1">PV gagnés (brut, sans CON)</div>
          <input
            v-model.number="state.hpManual"
            type="number"
            :min="1"
            :max="pickedClass?.hitDie ?? 12"
            placeholder="—"
            class="w-20 px-2 py-2 rounded-xl border border-(--ui-border) bg-(--ui-bg) text-2xl font-mono font-bold text-center text-(--ui-text) focus:border-amber-500/60 focus:outline-none"
          >
        </div>
        <span class="text-xl text-muted">+</span>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">CON</div>
          <div class="w-20 py-2 rounded-xl border border-(--ui-border) text-2xl font-mono font-bold text-center text-(--ui-text)">
            {{ formatMod(conMod) }}
          </div>
        </div>
        <span class="text-xl text-muted">=</span>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">Total</div>
          <div
            class="w-20 py-2 rounded-xl border text-2xl font-mono font-black text-center"
            :class="computedHpGained != null ? 'border-green-500/40 text-green-400' : 'border-(--ui-border) text-muted'"
          >
            {{ computedHpGained != null ? `+${computedHpGained}` : '?' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Before / after -->
    <div v-if="state.hpGained" class="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm">
      <span class="text-muted">PV max :</span>
      <span class="font-mono font-bold text-(--ui-text)">{{ currentHpMax }}</span>
      <span class="text-muted">→</span>
      <span class="font-mono font-bold text-green-400">{{ currentHpMax + state.hpGained }}</span>
      <UBadge color="success" variant="soft" size="sm">+{{ state.hpGained }}</UBadge>
    </div>
  </div>
</template>

<script lang="ts" setup>
const lu = useLevelUp(inject('charSheet') as any)
const { state, pickedClass, conMod, averageHpGain, computedHpGained, formatMod } = lu

const charSheet = inject('charSheet') as any
const currentHpMax = computed(() => charSheet?.value?.maxHp ?? 0)

const methods = [
  { id: 'average', label: 'Moyenne' },
  { id: 'roll', label: 'Jet de dé' },
  { id: 'manual', label: 'Saisie manuelle' },
]

function rollDie() {
  const die = pickedClass.value?.hitDie ?? 8
  state.value.hpRolled = Math.floor(Math.random() * die) + 1
}
</script>
