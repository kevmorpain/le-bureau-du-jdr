<template>
  <div class="head">
    <img
      v-if="portraitSrc && !hasPortraitLoadError"
      :src="portraitSrc"
      alt=""
      class="head__portrait"
      @error="hasPortraitLoadError = true"
    >
    <div class="head__who">
      <p class="head__name">
        {{ characterSheet.name }}
      </p>
      <p class="ds-label head__classes">
        {{ classesText }}
      </p>
    </div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()

const { t } = useI18n()

const { characterLevel, mainClass, multiClass, portraitSrc } = useCharacterSheet(toRef(() => characterSheet))

const hasPortraitLoadError = ref(false)
watch(portraitSrc, () => {
  hasPortraitLoadError.value = false
})

const classesText = computed(() => {
  const classes = [mainClass.value, ...multiClass.value].filter(cls => !!cls)
  if (classes.length === 1) return t('sheet.rail.class_level', { name: classes[0]!.name, level: characterLevel.value })
  return classes.map(cls => `${cls!.name} ${cls!.level}`).join(' · ')
})
</script>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head__portrait {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  object-fit: cover;
}

.head__who {
  flex: 1;
  min-width: 0;
}

.head__name {
  font-family: var(--font-bodoni);
  font-size: 21px;
  line-height: 1.1;
  color: var(--color-ds-ink);
}

.head__classes { margin-top: 3px; }
</style>
