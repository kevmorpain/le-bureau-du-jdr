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
      :to="{ query: getSheetViewQuery(view.key) }"
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
      <SheetSaveStatus
        side="right"
        @retry="emit('retry')"
        @resolve="emit('resolve')"
      />
    </div>
  </nav>
</template>

<script lang="ts" setup>
const { active } = defineProps<{ active: SheetView }>()

const emit = defineEmits<{ retry: [], resolve: [] }>()
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
</style>
