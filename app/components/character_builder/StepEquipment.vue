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
              <div class="flex flex-wrap gap-2 mb-2">
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

              <!-- Sous-sélecteur si l'option choisie est générique -->
              <template v-if="choices[i] && genericOptions(choices[i]!)">
                <p class="text-xs text-muted/70 mb-2 mt-1">Choisissez un item spécifique :</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="item in genericOptions(choices[i]!)"
                    :key="item"
                    type="button"
                    class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer"
                    :class="subChoices[i] === item
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium'
                      : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-emerald-500/40'"
                    @click="setSubChoice(i, item)"
                  >
                    {{ item }}
                  </button>
                </div>
              </template>
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
          <div v-if="!backgroundData.equipment.length" class="text-xs text-muted/60 italic">Aucun équipement d'historique.</div>
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
import { GENERIC_ITEM_OPTIONS } from '~/data/character-builder'

const {
  state,
  classData,
  backgroundData,
} = useCharacterBuilder()

// Choix locaux (index → option choisie ou null)
const choices = ref<(string | null)[]>([])
// Sous-choix pour les options génériques (index → item spécifique)
const subChoices = ref<Record<number, string | null>>({})

// Retourne la liste d'items spécifiques si l'option est générique, sinon null
function genericOptions(opt: string): string[] | null {
  return GENERIC_ITEM_OPTIONS[opt] ?? null
}

// Initialiser les choix quand la classe change
watch(classData, (cls) => {
  if (!cls) { choices.value = []; subChoices.value = {}; return }
  choices.value = cls.equipment.map((grp, i) =>
    grp.choice ? (state.value.equipChoices[i] ?? grp.options?.[0] ?? null) : null,
  )
  subChoices.value = { ...(state.value.equipSubChoices ?? {}) }
  syncEquipment()
}, { immediate: true })

function setChoice(i: number, opt: string) {
  choices.value[i] = opt
  // Reset sub-choice si l'option change
  subChoices.value[i] = null
  syncEquipment()
}

function setSubChoice(i: number, item: string) {
  subChoices.value[i] = item
  syncEquipment()
}

function syncEquipment() {
  const cls = classData.value
  if (!cls) { state.value.equipment = []; return }

  const items: string[] = []
  cls.equipment.forEach((grp, i) => {
    if (grp.choice) {
      const chosen = choices.value[i]
      if (chosen) {
        // Utiliser le sous-choix si disponible, sinon l'option générique
        const sub = subChoices.value[i]
        items.push(sub ?? chosen)
      }
    }
    else {
      grp.items?.forEach(it => items.push(it))
    }
  })
  backgroundData.value?.equipment.forEach(it => items.push(it))

  state.value.equipChoices = [...choices.value]
  state.value.equipSubChoices = { ...subChoices.value }
  state.value.equipment = items
}

// Re-sync si l'historique change
watch(() => backgroundData.value, syncEquipment)
</script>
