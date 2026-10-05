<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">Effets temporaires</span>
      <UButton
        icon="i-heroicons:plus-16-solid"
        size="xs"
        variant="ghost"
        color="neutral"
        aria-label="Ajouter un effet temporaire"
        @click="openCreate"
      />
    </div>

    <ul
      v-if="temporaryEffects.length"
      class="space-y-2"
    >
      <li
        v-for="entry in temporaryEffects"
        :key="entry.id"
        class="space-y-1"
        :class="entry.active ? '' : 'opacity-50'"
      >
        <div class="flex items-center gap-1.5">
          <USwitch
            :model-value="entry.active"
            size="xs"
            :aria-label="entry.active ? 'Désactiver' : 'Activer'"
            @update:model-value="toggleTemporaryEffect(entry.id)"
          />
          <span
            class="flex-1 min-w-0 truncate text-sm font-medium"
            :title="entry.name"
          >{{ entry.name }}</span>
          <UButton
            icon="i-heroicons:pencil-square-16-solid"
            size="xs"
            variant="ghost"
            color="neutral"
            aria-label="Modifier"
            @click="openEdit(entry)"
          />
          <UButton
            icon="i-heroicons:x-mark-16-solid"
            size="xs"
            variant="ghost"
            color="neutral"
            aria-label="Retirer"
            @click="removeTemporaryEffect(entry.id)"
          />
        </div>
        <div
          v-if="entry.countdown || entry.durationLabel || entry.concentration"
          class="flex flex-wrap gap-1 pl-9"
        >
          <UBadge
            v-if="entry.concentration"
            label="Concentration"
            color="warning"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-if="entry.countdown"
            :label="countdownLabel(entry.countdown)"
            :color="entry.countdown.remaining === 0 ? 'neutral' : entry.countdown.remaining <= 1 ? 'warning' : 'info'"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-else-if="entry.durationLabel"
            :label="`Durée : ${entry.durationLabel}`"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </div>
        <p
          v-if="entry.description"
          class="text-xs text-muted italic whitespace-pre-line pl-9"
        >
          {{ entry.description }}
        </p>
        <div
          v-if="entry.effects.length"
          class="flex flex-wrap gap-1 pl-9"
        >
          <UBadge
            v-for="(eff, idx) in entry.effects"
            :key="idx"
            :label="effectLabel(eff)"
            :color="entry.active ? (isEffectMalus(eff) ? 'error' : 'primary') : 'neutral'"
            variant="subtle"
            size="sm"
          />
        </div>
      </li>
    </ul>
    <p
      v-else
      class="text-xs text-muted italic"
    >
      Bénédiction, malédiction, sort reçu…
    </p>

    <UModal v-model:open="modalOpen">
      <template #content>
        <UCard>
          <template #header>
            <p class="font-semibold text-lg">
              {{ draft.id === undefined ? 'Nouvel effet temporaire' : 'Modifier l\'effet temporaire' }}
            </p>
          </template>

          <div class="space-y-4">
            <UFormField label="Nom">
              <UInput
                v-model="draft.name"
                placeholder="ex. Bénédiction d'Ilmater"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Description"
              hint="facultatif"
            >
              <UTextarea
                v-model="draft.description"
                placeholder="Effet sans mécanique, ex. ne peut répondre que par oui ou par non"
                :rows="2"
                autoresize
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Durée (rounds)"
                hint="facultatif"
              >
                <UInput
                  v-model.number="draft.rounds"
                  type="number"
                  :min="1"
                  :max="MAX_COUNTED_ROUNDS"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                v-if="draft.id !== undefined && draft.rounds"
                label="Rounds restants"
              >
                <UInput
                  v-model.number="draft.remaining"
                  type="number"
                  :min="0"
                  :max="draft.rounds"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="rounded-lg ring ring-default p-3">
              <MagicEffectEditor
                v-model="draft.effects"
                title="Effets"
                :types="TEMPORARY_EFFECT_TYPES"
              />
            </div>

            <p
              v-if="draft.name.trim() && !parsedDraft.success"
              class="text-xs text-error"
            >
              Une valeur d'effet ou de durée est invalide.
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                variant="ghost"
                @click="closeModal"
              >
                Annuler
              </UButton>
              <UButton
                :disabled="!parsedDraft.success"
                @click="submit"
              >
                Enregistrer
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import type { Effect } from '~~/server/db/schema/effects'
import { MAX_COUNTED_ROUNDS } from '~~/shared/rules/durations'
import { TEMPORARY_EFFECT_TYPES, temporaryEffectSchema, type TemporaryEffect } from '~~/shared/utils/temporary_effects'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  temporaryEffects,
  saveTemporaryEffect,
  toggleTemporaryEffect,
  removeTemporaryEffect,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const draftSchema = temporaryEffectSchema.omit({ id: true })

type Draft = Omit<TemporaryEffect, 'id' | 'description' | 'effects'> & {
  id?: number
  description: string
  effects: Effect[]
  // Champs de saisie du décompte : `''` quand l'input est vidé.
  rounds: number | ''
  remaining: number | ''
}

const modalOpen = ref(false)
const emptyDraft = (): Draft => ({ name: '', description: '', active: true, effects: [], rounds: '', remaining: '' })
const draft = ref<Draft>(emptyDraft())

const asRounds = (v: number | '') => (typeof v === 'number' && v > 0 ? v : undefined)

// Même schéma que le PUT de la fiche : une entrée invalide ferait échouer toute la sauvegarde.
const draftEntry = computed(() => {
  const { rounds, remaining, ...entry } = draft.value
  const total = asRounds(rounds)
  return { ...entry, countdown: total ? { rounds: total, remaining: typeof remaining === 'number' ? remaining : total } : undefined }
})
const parsedDraft = computed(() => draftSchema.safeParse(draftEntry.value))

const openCreate = () => {
  draft.value = emptyDraft()
  modalOpen.value = true
}

const openEdit = (entry: TemporaryEffect) => {
  // Copie profonde : annuler l'édition ne doit pas muter la fiche.
  draft.value = { ...emptyDraft(), ...JSON.parse(JSON.stringify(entry)), rounds: entry.countdown?.rounds ?? '', remaining: entry.countdown?.remaining ?? '' }
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
}

const submit = () => {
  if (!parsedDraft.value.success) return
  saveTemporaryEffect({ ...parsedDraft.value.data, id: draft.value.id })
  closeModal()
}
</script>
