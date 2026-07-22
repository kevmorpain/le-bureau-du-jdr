<template>
  <div class="space-y-2">
    <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
      Bourse
    </h2>

    <!-- Soldes actuels -->
    <div class="grid grid-cols-5 gap-2">
      <div
        v-for="coin in coins"
        :key="coin.key"
        class="flex flex-col items-center gap-0.5"
      >
        <span class="font-mono font-bold text-sm tabular-nums">
          {{ characterSheet[coin.key] }}
        </span>
        <span
          class="text-xs font-semibold uppercase"
          :class="coin.color"
        >
          {{ coin.label }}
        </span>
      </div>
    </div>

    <!-- Flash résultat -->
    <Transition name="slide-in">
      <p
        v-if="flashResult"
        class="text-xs font-semibold text-center"
        :class="flashResult.startsWith('−') ? 'text-red-400' : 'text-green-400'"
      >
        {{ flashResult }}
      </p>
    </Transition>

    <!-- Boutons Gagner / Dépenser -->
    <div class="flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm border transition-colors"
        :class="mode === 'gain'
          ? 'bg-green-500/15 border-green-500/40 text-green-400'
          : 'bg-green-500/8 border-green-500/25 text-green-500 hover:bg-green-500/15'"
        @click="toggleMode('gain')"
      >
        <UIcon
          name="i-heroicons:plus-circle"
          class="size-4"
        />
        Gagner
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm border transition-colors"
        :class="mode === 'spend'
          ? 'bg-red-500/15 border-red-500/40 text-red-400'
          : 'bg-red-500/8 border-red-500/25 text-red-500 hover:bg-red-500/15'"
        @click="toggleMode('spend')"
      >
        <UIcon
          name="i-heroicons:minus-circle"
          class="size-4"
        />
        Dépenser
      </button>
    </div>

    <!-- Saisie des deltas : remplir les pièces concernées, un seul OK applique tout -->
    <div
      v-if="mode"
      class="space-y-2"
    >
      <div class="grid grid-cols-5 gap-2">
        <div
          v-for="(coin, idx) in coins"
          :key="coin.key"
          class="flex flex-col items-center gap-1"
        >
          <UInput
            :ref="(el: any) => setInputRef(el, idx)"
            v-model="deltas[coin.key]"
            type="number"
            min="0"
            placeholder="0"
            size="sm"
            class="w-full"
            :ui="{ base: 'text-center' }"
            @keydown.enter="commit"
          />
          <span
            class="text-xs font-semibold uppercase"
            :class="coin.color"
          >
            {{ coin.label }}
          </span>
        </div>
      </div>
      <UButton
        block
        size="sm"
        :color="mode === 'gain' ? 'success' : 'error'"
        @click="commit"
      >
        {{ mode === 'gain' ? 'Ajouter' : 'Retirer' }}
      </UButton>
    </div>

    <!-- Édition directe -->
    <details class="text-xs">
      <summary class="text-muted cursor-pointer hover:text-default transition-colors">
        Édition directe
      </summary>
      <div class="grid grid-cols-5 gap-2 mt-1.5">
        <div
          v-for="coin in coins"
          :key="coin.key"
          class="flex flex-col items-center gap-1"
        >
          <UInput
            :model-value="characterSheet[coin.key]"
            type="number"
            :min="0"
            size="sm"
            class="w-full"
            :ui="{ base: 'text-center' }"
            @change="(e: Event) => setAbsolute(coin.key, Number((e.target as HTMLInputElement).value))"
          />
          <span
            class="text-xs font-semibold uppercase"
            :class="coin.color"
          >
            {{ coin.label }}
          </span>
        </div>
      </div>
    </details>
  </div>
</template>

<script lang="ts" setup>
type CoinKey = 'pp' | 'po' | 'pe' | 'pa' | 'pc'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const coins: { key: CoinKey, label: string, color: string }[] = [
  { key: 'pp', label: 'PP', color: 'text-sky-300' },
  { key: 'po', label: 'PO', color: 'text-yellow-400' },
  { key: 'pe', label: 'PE', color: 'text-emerald-400' },
  { key: 'pa', label: 'PA', color: 'text-gray-400' },
  { key: 'pc', label: 'PC', color: 'text-amber-700' },
]

// ── Mode gagner / dépenser ─────────────────────────────────────────────────────
const mode = ref<'gain' | 'spend' | null>(null)
const deltas = ref<Record<CoinKey, string>>({ pp: '', po: '', pe: '', pa: '', pc: '' })
const flashResult = ref<string | null>(null)

const inputRefs: any[] = []
const setInputRef = (el: any, idx: number) => {
  if (el) inputRefs[idx] = el
}

const resetDeltas = () => {
  deltas.value = { pp: '', po: '', pe: '', pa: '', pc: '' }
}

const toggleMode = (m: 'gain' | 'spend') => {
  mode.value = mode.value === m ? null : m
  resetDeltas()
  if (mode.value) nextTick(() => inputRefs[0]?.input?.focus())
}

// ── Applique tous les deltas saisis d'un coup ──────────────────────────────────
// Chaque pièce est plafonnée à 0 indépendamment (pas de conversion automatique :
// D&D ne fait pas la monnaie).
const commit = () => {
  const sign = mode.value === 'spend' ? -1 : 1
  const applied: string[] = []
  const next = { ...characterSheet.value }

  for (const coin of coins) {
    const raw = parseInt(deltas.value[coin.key]) || 0
    if (raw <= 0) continue
    next[coin.key] = Math.max(0, characterSheet.value[coin.key] + sign * raw)
    applied.push(`${sign < 0 ? '−' : '+'}${raw} ${coin.label}`)
  }

  if (applied.length === 0) {
    mode.value = null
    return
  }

  characterSheet.value = next
  showFlash(applied.join(' '))
  resetDeltas()
  mode.value = null
}

const setAbsolute = (key: CoinKey, value: number) => {
  characterSheet.value = { ...characterSheet.value, [key]: Math.max(0, value) }
}

const showFlash = (msg: string) => {
  flashResult.value = msg
  setTimeout(() => {
    flashResult.value = null
  }, 3000)
}
</script>

<style scoped>
.slide-in-enter-active {
  transition: all 0.2s ease;
}
.slide-in-enter-from {
  transform: translateX(8px);
  opacity: 0;
}
</style>
