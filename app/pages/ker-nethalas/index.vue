<template>
  <UPageHeader title="Ker Nethalas" />

  <UPageBody>
    <UPageGrid>
      <button
        type="button"
        class="text-left"
        @click="createModalOpen = true"
      >
        <UCard class="h-full place-content-center place-items-center">
          <div class="flex items-center gap-x-4">
            <h3 class="text-lg font-semibold">
              Ajouter un survivant
            </h3>

            <UIcon
              name="heroicons-outline:plus-circle"
              class="size-8 text-primary"
            />
          </div>
        </UCard>
      </button>

      <NuxtLink
        v-for="character in characters"
        :key="character.id"
        :to="`/ker-nethalas/${character.id}`"
      >
        <KnCharacterCard
          :character
          deletable
          @delete="askDelete(character)"
        />
      </NuxtLink>
    </UPageGrid>
  </UPageBody>

  <UModal v-model:open="createModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Nouveau survivant
          </p>
        </template>

        <form
          id="kn-create-form"
          @submit.prevent="create"
        >
          <UFormField label="Nom">
            <UInput
              v-model="newName"
              :maxlength="100"
              autofocus
              class="w-full"
            />
          </UFormField>
        </form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              :disabled="creating"
              @click="createModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              type="submit"
              form="kn-create-form"
              :loading="creating"
              :disabled="!newName.trim()"
            >
              Créer
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <UModal v-model:open="deleteModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Supprimer ce survivant
          </p>
        </template>

        <div class="space-y-4">
          <p class="text-muted text-sm">
            Cette action est irréversible. La fiche sera définitivement supprimée.
          </p>

          <KnCharacterCard
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
              Supprimer ce survivant
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

const { data: characters, refresh } = await useFetch<KnCharacter[]>('/api/ker-nethalas/characters')

const toast = useToast()

const createModalOpen = ref(false)
const newName = ref('')
const creating = ref(false)

async function create() {
  const name = newName.value.trim()
  if (!name) return

  creating.value = true
  try {
    const { id } = await $fetch<{ id: number }>('/api/ker-nethalas/characters', { method: 'POST', body: { name } })
    await navigateTo(`/ker-nethalas/${id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la création', color: 'error' })
  } finally {
    creating.value = false
  }
}

const characterToDelete = ref<KnCharacter | null>(null)
const deleteModalOpen = ref(false)
const deleting = ref(false)

function askDelete(character: KnCharacter) {
  characterToDelete.value = character
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!characterToDelete.value) return

  deleting.value = true
  try {
    await $fetch(`/api/ker-nethalas/characters/${characterToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Survivant supprimé', color: 'success' })
    deleteModalOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
