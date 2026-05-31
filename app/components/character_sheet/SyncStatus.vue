<template>
  <!-- Conflit : la fiche a changé ailleurs (la modale de résolution arrive en Phase 4). -->
  <UBadge
    v-if="hasConflict"
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

  <!-- Hors-ligne -->
  <UBadge
    v-else-if="!online"
    color="warning"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:signal-slash"
      class="size-3.5"
    />
    Hors-ligne<template v-if="pendingCount"> · {{ pendingCount }} en attente</template>
  </UBadge>

  <!-- Synchronisation en cours -->
  <UBadge
    v-else-if="isSyncing"
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

  <!-- En ligne avec des modifs en attente (backlog) -->
  <UBadge
    v-else-if="pendingCount"
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

  <!-- À jour -->
  <UBadge
    v-else
    color="success"
    variant="subtle"
    size="md"
    class="gap-1"
  >
    <UIcon
      name="i-heroicons:cloud"
      class="size-3.5"
    />
    À jour
  </UBadge>
</template>

<script lang="ts" setup>
const { online, pendingCount, isSyncing, hasConflict } = useOfflineSync()
</script>
