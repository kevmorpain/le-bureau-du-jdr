<template>
  <UPopover v-model:open="open">
    <UButton
      size="xs"
      variant="soft"
      :aria-label="`Jet : ${label}`"
    >
      Jet
    </UButton>

    <template #content>
      <div class="w-[min(30rem,90vw)] p-2">
        <KnInlineCheck
          :request="{ id, note: label }"
          @close="open = false"
        />
      </div>
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
defineProps<{
  // `skill:<clé>`, `resistance:<clé>` ou `extra:<rang>`.
  id: string
  label: string
}>()

const open = ref(false)
</script>
