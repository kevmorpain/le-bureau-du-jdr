<template>
  <UPopover
    :content="{ side, align: 'end', sideOffset: 8 }"
    :ui="{ content: 'bg-transparent ring-0 shadow-none rounded-none' }"
  >
    <DsSaveIndicator
      :state
      :pending="pendingCount"
    />

    <template #content>
      <DsFrame class="detail">
        <p class="detail__title">
          {{ $t(`sheet.save.titles.${state}`, pendingCount) }}
        </p>
        <p class="detail__body">
          {{ $t(`sheet.save.descriptions.${state}`, pendingCount) }}
        </p>
        <DsLinkButton
          v-if="availableAction"
          class="detail__action"
          :label="$t(`sheet.save.actions.${availableAction}`)"
          @click="handleAction(availableAction)"
        />
      </DsFrame>
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
const { side } = defineProps<{ side: 'right' | 'bottom' }>()

const emit = defineEmits<{ retry: [], resolve: [] }>()

const { state, pendingCount, flushAll } = useSaveState()

const ACTIONS = ['pending', 'failed', 'conflict'] as const
type SaveAction = typeof ACTIONS[number]

const availableAction = computed(() => ACTIONS.find(action => action === state.value))

const handleAction = (action: SaveAction) => {
  if (action === 'pending') void flushAll()
  else if (action === 'failed') emit('retry')
  else emit('resolve')
}
</script>

<style scoped>
.detail {
  width: min(290px, calc(100vw - 24px));
  filter: drop-shadow(0 10px 24px rgb(0 0 0 / 0.6));
}

.detail__title {
  font-family: var(--font-bodoni);
  font-size: 16px;
  color: var(--color-ds-ink);
}

.detail__body {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}

.detail__action { margin-top: 8px; }
</style>
