<template>
  <UPageHeader title="Liste des personnages" />

  <UPageBody>
    <UPageGrid>
      <NuxtLink to="/characters/new">
        <UCard
          class="h-full place-content-center place-items-center"
        >
          <div
            class="flex items-center gap-x-4"
          >
            <h3 class="text-lg font-semibold">
              Ajouter un personnage
            </h3>

            <UIcon
              name="heroicons-outline:plus-circle"
              class="size-8 text-primary"
            />
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink
        v-for="character in characters"
        :key="character.id"
        :to="`/characters/${character.id}`"
      >
        <CharacterCard
          :character
          deletable
          @delete="askDelete(character)"
        />
      </NuxtLink>
    </UPageGrid>
  </UPageBody>

  <UModal v-model:open="deleteModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Supprimer ce personnage
          </p>
        </template>

        <div class="space-y-4">
          <p class="text-muted text-sm">
            Cette action est irréversible. La fiche et toutes ses données
            (classes, sorts, inventaire, compétences…) seront définitivement supprimées.
          </p>

          <CharacterCard
            v-if="characterToDelete"
            :character="characterToDelete"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              :disabled="deleting"
              @click="deleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              icon="i-heroicons:trash"
              :loading="deleting"
              @click="confirmDelete"
            >
              Supprimer ce personnage
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
const { data: characters, refresh } = await useFetch<CharacterSheet[]>('/api/character_sheets')

const toast = useToast()

const characterToDelete = ref<CharacterSheet | null>(null)
const deleteModalOpen = ref(false)
const deleting = ref(false)

function askDelete(character: CharacterSheet) {
  characterToDelete.value = character
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!characterToDelete.value) return

  deleting.value = true
  try {
    await $fetch(`/api/character_sheets/${characterToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Personnage supprimé', color: 'success' })
    deleteModalOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
