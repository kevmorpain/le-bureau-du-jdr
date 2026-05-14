<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">🎒</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Équipement</h2>
        <p class="text-sm text-muted mt-0.5">Choisissez l'équipement de départ de votre classe. L'équipement d'historique est ajouté automatiquement.</p>
      </div>
    </div>

    <div v-if="!classData" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-8 text-center text-sm text-muted">
      Veuillez d'abord choisir une classe.
    </div>

    <template v-else>
      <!-- Équipement de classe -->
      <div class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Équipement — {{ classData.name }}</p>
        <div class="flex flex-col gap-3">
          <div
            v-for="(grp, i) in classData.equipment"
            :key="i"
            class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4"
          >
            <!-- Choix entre options -->
            <template v-if="grp.choice && grp.options">
              <p class="text-xs text-muted mb-2">Choisissez une option</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in grp.options"
                  :key="opt"
                  type="button"
                  class="px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer"
                  :class="choices[i] === opt
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
                    : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
                  @click="setChoice(i, opt)"
                >
                  {{ opt }}
                </button>
              </div>
            </template>

            <!-- Équipement automatique -->
            <template v-else-if="grp.items">
              <p class="text-xs text-muted/60 mb-1.5">Inclus automatiquement</p>
              <p class="text-sm text-(--ui-text)">{{ grp.items.join(' · ') }}</p>
            </template>
          </div>
        </div>
      </div>

      <!-- Équipement d'historique -->
      <div v-if="backgroundData" class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Équipement — {{ backgroundData.name }}</p>
        <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
          <div v-for="(item, i) in backgroundData.equipment" :key="i" class="flex items-center gap-2 py-0.5">
            <span class="text-amber-400/60 text-xs">·</span>
            <span class="text-sm text-muted">{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- Récapitulatif -->
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Inventaire final
          <span class="text-amber-400 ml-1.5">{{ state.equipment.length }} objets</span>
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(item, i) in state.equipment"
            :key="i"
            class="text-xs px-2.5 py-1 rounded-full border border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text)"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const {
  state,
  classData,
  backgroundData,
} = useCharacterBuilder()

// Choix locaux (index → option choisie ou null)
const choices = ref<(string | null)[]>([])

// Initialiser les choix quand la classe change
watch(classData, (cls) => {
  if (!cls) { choices.value = []; return }
  choices.value = cls.equipment.map((grp, i) =>
    grp.choice ? (state.value.equipChoices[i] ?? grp.options?.[0] ?? null) : null,
  )
  syncEquipment()
}, { immediate: true })

function setChoice(i: number, opt: string) {
  choices.value[i] = opt
  syncEquipment()
}

function syncEquipment() {
  const cls = classData.value
  if (!cls) { state.value.equipment = []; return }

  const items: string[] = []
  cls.equipment.forEach((grp, i) => {
    if (grp.choice) {
      const chosen = choices.value[i]
      if (chosen) items.push(chosen)
    }
    else {
      grp.items?.forEach(it => items.push(it))
    }
  })
  backgroundData.value?.equipment.forEach(it => items.push(it))

  state.value.equipChoices = [...choices.value]
  state.value.equipment = items
}

// Re-sync si l'historique change
watch(() => backgroundData.value, syncEquipment)
</script>
