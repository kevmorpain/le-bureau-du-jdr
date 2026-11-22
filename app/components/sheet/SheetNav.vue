<template>
  <nav
    class="nav"
    :aria-label="$t('sheet.nav_label')"
  >
    <DsNavItem
      v-for="view in SHEET_VIEWS"
      :key="view.key"
      :label="$t(`sheet.views.${view.key}`)"
      :active="view.key === active"
      :to="{ query: sheetViewQuery(view.key) }"
      :class="{ nav__settings: view.key === 'settings' }"
    >
      <template #icon>
        <DsIcon
          :name="view.icon"
          :size="22"
        />
      </template>
    </DsNavItem>

    <DsNavItem
      :label="$t('sheet.characters')"
      to="/characters"
    >
      <template #icon>
        <DsIcon
          name="nav-characters"
          :size="22"
        />
      </template>
    </DsNavItem>

    <div class="nav__save">
      <UPopover
        :content="{ side: 'right', align: 'end', sideOffset: 8 }"
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
              v-if="action"
              class="detail__action"
              :label="$t(`sheet.save.actions.${action}`)"
              @click="act(action)"
            />
          </DsFrame>
        </template>
      </UPopover>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const { active } = defineProps<{ active: SheetView }>()

const emit = defineEmits<{ retry: [], resolve: [] }>()

const { state, pendingCount, flushAll } = useSaveState()

const ACTIONS = ['pending', 'failed', 'conflict'] as const
type SaveAction = typeof ACTIONS[number]

const action = computed(() => ACTIONS.find(candidate => candidate === state.value))

const act = (chosen: SaveAction) => {
  if (chosen === 'pending') void flushAll()
  else if (chosen === 'failed') emit('retry')
  else emit('resolve')
}
</script>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 76px;
  flex-shrink: 0;
  padding: 14px 0;
}

.nav__settings { margin-top: auto; }

.nav__save {
  width: 64px;
  margin-top: 4px;
  padding-top: 8px;
  box-shadow: 0 -1px 0 var(--color-ds-line);
}

.detail {
  width: 290px;
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
