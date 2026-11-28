<template>
  <nav
    class="tabs"
    :aria-label="$t('sheet.nav_label')"
  >
    <DsNavItem
      v-for="view in PHONE_TAB_VIEWS"
      :key="view.key"
      :label="$t(`sheet.views.${view.key}`)"
      :active="view.key === active"
      :to="{ query: getSheetViewQuery(view.key) }"
      class="tabs__item"
    >
      <template #icon>
        <DsIcon
          :name="view.icon"
          :size="22"
        />
      </template>
    </DsNavItem>

    <DsNavItem
      :label="$t('sheet.tabs.more')"
      :active="isMoreActive"
      class="tabs__item"
      @click="isMoreOpen = true"
    >
      <template #icon>
        <DsIcon
          name="nav-more"
          :size="22"
        />
      </template>
    </DsNavItem>

    <DsSheet
      v-model:open="isMoreOpen"
      :title="$t('sheet.tabs.more')"
    >
      <ul class="more">
        <li
          v-for="link in moreLinks"
          :key="link.key"
        >
          <NuxtLink
            :to="link.to"
            class="more__link"
            :aria-current="link.isActive ? 'page' : undefined"
            @click="isMoreOpen = false"
          >
            <DsIcon
              :name="link.icon"
              :size="22"
            />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </DsSheet>
  </nav>
</template>

<script lang="ts" setup>
const { active } = defineProps<{ active: SheetView }>()

const { t } = useI18n()

const isMoreOpen = ref(false)

const isMoreActive = computed(() => PHONE_MORE_VIEWS.some(view => view.key === active))

const moreLinks = computed(() => [
  ...PHONE_MORE_VIEWS.map(view => ({
    key: view.key,
    icon: view.icon,
    label: t(`sheet.views.${view.key}`),
    to: { query: getSheetViewQuery(view.key) },
    isActive: view.key === active,
  })),
  { key: 'characters', icon: 'nav-characters' as const, label: t('sheet.characters'), to: '/characters', isActive: false },
])
</script>

<style scoped>
.tabs {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  flex-shrink: 0;
  padding: 4px 4px 6px;
  box-shadow: 0 -1px 0 var(--color-ds-gold-dim);
}

.tabs .tabs__item {
  width: auto;
  min-height: 56px;
}

.more {
  display: flex;
  flex-direction: column;
}

.more__link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 6px;
  font-size: 15px;
  font-weight: 700;
  border-bottom: 1px solid var(--color-ds-line);
}

.more li:last-child .more__link { border-bottom: 0; }

.more__link[aria-current='page'] { color: var(--color-ds-gold); }

.more__link :deep(.icon) { color: var(--color-ds-gold); }
</style>
