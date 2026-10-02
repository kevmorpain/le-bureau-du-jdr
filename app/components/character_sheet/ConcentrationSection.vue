<template>
  <div
    class="rounded-xl border p-3 space-y-2 transition-all"
    :class="isConcentrating ? 'border-amber-500/30 bg-amber-500/5' : 'border-default bg-default'"
  >
    <div class="flex items-center justify-between">
      <span
        class="text-xs font-bold uppercase tracking-widest"
        :class="isConcentrating ? 'text-amber-400' : 'text-muted'"
      >Concentration</span>
      <UButton
        v-if="isConcentrating"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="setConcentration(null)"
      >
        Rompre
      </UButton>
      <UButton
        v-else-if="!starting"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="starting = true"
      >
        Se concentrer
      </UButton>
    </div>

    <template v-if="isConcentrating">
      <p class="text-sm font-medium">
        {{ concentrationName }}
      </p>

      <p class="text-xs text-muted leading-relaxed">
        JS Constitution requis si vous prenez des dégâts (DD = max entre 10 et ½ dégâts).
      </p>
    </template>

    <p
      v-else-if="!starting"
      class="text-xs text-muted italic"
    >
      Aucune
    </p>

    <form
      v-else
      class="space-y-2"
      @submit.prevent="startFree"
    >
      <div
        v-if="concentrationSpells.length"
        class="flex flex-wrap gap-1"
      >
        <UButton
          v-for="cs in concentrationSpells"
          :key="cs.spellId"
          size="xs"
          variant="soft"
          color="warning"
          type="button"
          @click="startSpell(cs.spellId, cs.spell.name)"
        >
          {{ cs.spell.name }}
        </UButton>
      </div>
      <div class="flex gap-2">
        <UInput
          v-model="label"
          placeholder="Effet de monstre, sort hors catalogue…"
          maxlength="100"
          size="sm"
          class="flex-1"
        />
        <UButton
          type="submit"
          size="sm"
          :disabled="!label.trim()"
        >
          OK
        </UButton>
        <UButton
          type="button"
          size="sm"
          variant="ghost"
          color="neutral"
          @click="cancel"
        >
          Annuler
        </UButton>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  isConcentrating, concentrationName, setConcentration, setFreeConcentration, startConcentration, characterSpells,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const starting = ref(false)
const label = ref('')

const concentrationSpells = computed(() =>
  (characterSpells.value ?? []).filter(cs => cs.spell?.concentration),
)

const cancel = () => {
  starting.value = false
  label.value = ''
}

const startSpell = (spellId: number, name: string) => {
  startConcentration(spellId, name)
  cancel()
}

const startFree = () => {
  if (!label.value.trim()) return
  setFreeConcentration(label.value)
  cancel()
}
</script>
