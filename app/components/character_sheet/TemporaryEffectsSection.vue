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
          v-if="entry.effects.length"
          class="flex flex-wrap gap-1 pl-9"
        >
          <UBadge
            v-for="(eff, idx) in entry.effects"
            :key="idx"
            :label="effectLabel(eff)"
            :color="entry.active ? 'primary' : 'neutral'"
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
              Une valeur d'effet est invalide.
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

const modalOpen = ref(false)
const draft = ref<{ id?: number, name: string, active: boolean, effects: Effect[] }>({ name: '', active: true, effects: [] })

// Même schéma que le PUT de la fiche : une entrée invalide ferait échouer toute la sauvegarde.
const parsedDraft = computed(() => draftSchema.safeParse(draft.value))

const openCreate = () => {
  draft.value = { name: '', active: true, effects: [] }
  modalOpen.value = true
}

const openEdit = (entry: TemporaryEffect) => {
  // Copie profonde : annuler l'édition ne doit pas muter la fiche.
  draft.value = JSON.parse(JSON.stringify(entry))
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
