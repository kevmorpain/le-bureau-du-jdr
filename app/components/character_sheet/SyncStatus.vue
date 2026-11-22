<template>
  <UBadge
    v-if="state === 'conflict'"
    color="error"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:exclamation-triangle"
      class="size-3.5"
    />
    Conflit de synchro
  </UBadge>

  <UBadge
    v-else-if="state === 'offline'"
    color="warning"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:signal-slash"
      class="size-3.5"
    />
    Hors-ligne<template v-if="pendingCount">
      · {{ pendingCount }} en attente
    </template>
  </UBadge>

  <UBadge
    v-else-if="state === 'saving' && isSyncing"
    color="info"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:arrow-path"
      class="size-3.5 animate-spin"
    />
    Synchronisation…
  </UBadge>

  <UBadge
    v-else-if="state === 'pending'"
    color="warning"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:cloud-arrow-up"
      class="size-3.5"
    />
    {{ pendingCount }} en attente
  </UBadge>

  <UBadge
    v-else-if="state === 'failed'"
    color="error"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:exclamation-circle"
      class="size-3.5"
    />
    Échec de l'enregistrement
  </UBadge>

  <UBadge
    v-else-if="state === 'saving'"
    color="info"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:arrow-path"
      class="size-3.5 animate-spin"
    />
    Enregistrement…
  </UBadge>

  <UBadge
    v-else
    color="success"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      :name="autoSaveStatus === 'saved' ? 'i-heroicons:check-circle' : 'i-heroicons:cloud'"
      class="size-3.5"
    />
    {{ autoSaveStatus === 'saved' ? 'Enregistré' : 'À jour' }}
  </UBadge>
</template>

<script lang="ts" setup>
const { state, pendingCount, isSyncing, autoSaveStatus } = useSaveState()
</script>
