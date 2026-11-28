<template>
  <UDrawer
    v-model:open="open"
    direction="bottom"
    :title="title"
    :description="description"
    :handle="false"
    :ui="{
      overlay: 'bg-black/70',
      content: 'bg-transparent ring-0 mt-0 max-h-[92dvh]',
    }"
  >
    <template #content>
      <div class="ds-bevel sheet">
        <div class="ds-fill sheet__fill">
          <span
            class="sheet__handle"
            aria-hidden="true"
          />
          <header class="sheet__head">
            <h2 class="sheet__title">
              {{ title }}
            </h2>
            <DsCornerButton
              class="sheet__close"
              :label="$t('ds.close')"
              @click="open = false"
            />
          </header>
          <div class="sheet__body">
            <slot />
          </div>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
const { title, description } = defineProps<{ title: string, description?: string }>()

const open = defineModel<boolean>('open', { default: false })
</script>

<style scoped>
.sheet {
  --ds-cut: var(--ds-cut-button);
  --c: var(--ds-cut);
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 0;
  font-family: var(--font-atkinson);
}

.sheet,
.sheet__fill {
  clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% 100%, 0 100%, 0 var(--c));
}

.sheet__fill {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 8px 14px 18px;
  color: var(--color-ds-ink);
}

.sheet__handle {
  align-self: center;
  width: 42px;
  height: 4px;
  background: var(--color-ds-gold-dim);
}

.sheet__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sheet__title {
  font-family: var(--font-bodoni);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
}

.sheet__close { margin-left: auto; }

.sheet__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
</style>
