<template>
  <USlideover
    v-model:open="open"
    :dismissible="false"
    title="Modification des classes"
  >
    <UTooltip text="Modifier les classes">
      <UButton
        icon="i-heroicons:pencil-square"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Modifier les classes"
        @click="open = true"
      />
    </UTooltip>

    <template #body>
      <div class="space-y-4">
        <ul class="space-y-4">
          <li
            v-for="(characterClass, index) in characterClassesInput"
            :key="index"
            class="rounded-lg ring ring-default bg-default p-3 space-y-2"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <UTooltip :text="characterClass.isMain ? 'Classe principale' : 'Définir comme classe principale'">
                <UButton
                  :icon="characterClass.isMain ? 'i-heroicons:star-16-solid' : 'i-heroicons:star'"
                  :color="characterClass.isMain ? 'warning' : 'neutral'"
                  variant="ghost"
                  size="sm"
                  :disabled="characterClassesInput.length === 1"
                  @click="promoteAsMain(index)"
                />
              </UTooltip>

              <UFormField
                :label="$t('classes_section.class_select_label')"
                class="flex-1 min-w-32"
              >
                <USelect
                  :items="classesItems"
                  value-key="value"
                  :model-value="characterClass.classId"
                  @update:model-value="(value) => characterClass.classId = value"
                />
              </UFormField>

              <UFormField :label="$t('classes_section.level_label')">
                <UInput
                  type="number"
                  min="1"
                  max="20"
                  class="w-16"
                  :model-value="characterClass.level"
                  @update:model-value="(value) => characterClass.level = Number(value)"
                />
              </UFormField>

              <UButton
                class="self-end"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                size="md"
                @click="removeClass(index)"
              />
            </div>

            <UFormField
              v-if="characterClass.classId && subclassesForClass(characterClass.classId).length > 0"
              label="Sous-classe"
            >
              <USelect
                :items="subclassItems(characterClass.classId)"
                value-key="value"
                :model-value="characterClass.subclassId ?? null"
                @update:model-value="(value: number | null) => characterClass.subclassId = value"
              />
            </UFormField>
          </li>
        </ul>

        <UButton
          color="primary"
          variant="link"
          @click="handleAddClass"
        >
          {{ $t('classes_section.add_class') }}
        </UButton>
      </div>
    </template>

    <template #footer>
      <UButton
        color="primary"
        @click="handleSubmit"
      >
        {{ $t('classes_section.submit_change') }}
      </UButton>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { CharacterClass, CharacterSheet } from '~~/server/utils/drizzle'

type ClassWithSubclasses = {
  id: number
  name: string
  hitDice: string
  spellcastingAbility: string | null
  subclasses: { id: number, name: string, classId: number, spellcastingAbility: string | null }[]
}

const { data: classes } = useFetch<ClassWithSubclasses[]>('/api/classes')

const classesItems = computed<{ label: string, value: number }[]>(() => {
  return classes.value?.map(cls => ({
    label: cls.name,
    value: cls.id,
  })).toSorted((a, b) => a.label.localeCompare(b.label)) ?? []
})

const subclassesForClass = (classId: number) =>
  classes.value?.find(c => c.id === classId)?.subclasses ?? []

const subclassItems = (classId: number): { label: string, value: number | null }[] => [
  { label: 'Aucune', value: null },
  ...subclassesForClass(classId).map(s => ({ label: s.name, value: s.id })),
]

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const characterClasses = computed(() => characterSheet.value.classes || [])

type CharacterClassInput = {
  level: number
  classId?: number
  isMain: boolean
  subclassId: number | null
}

const characterClassesInput = ref<CharacterClassInput[]>([])

const promoteAsMain = (index: number) => {
  characterClassesInput.value = characterClassesInput.value.map((c, i) => ({
    ...c,
    isMain: i === index,
  }))
}

const removeClass = (index: number) => {
  const wasMain = characterClassesInput.value[index]?.isMain
  characterClassesInput.value.splice(index, 1)
  // Si on supprime la principale, promouvoir la première restante
  if (wasMain && characterClassesInput.value.length > 0 && !characterClassesInput.value.some(c => c.isMain)) {
    characterClassesInput.value[0]!.isMain = true
  }
}

const handleAddClass = () => {
  characterClassesInput.value.push({
    classId: undefined,
    level: 1,
    isMain: characterClassesInput.value.length === 0,
    subclassId: null,
  })
}

const open = ref(false)

watch(open, (newVal) => {
  if (newVal) {
    characterClassesInput.value = structuredClone(toRaw(characterClasses.value)).map(c => ({
      classId: c.classId,
      level: c.level,
      isMain: c.isMain,
      subclassId: c.subclassId ?? null,
    }))
  }
  else {
    characterClassesInput.value = []
  }
})

const handleSubmit = () => {
  characterSheet.value.classes = characterClassesInput.value.map((input) => {
    const cls = classes.value?.find(c => c.id === input.classId)
    const subclass = input.subclassId ? subclassesForClass(input.classId!).find(s => s.id === input.subclassId) : null
    return {
      classId: input.classId!,
      level: input.level,
      isMain: input.isMain,
      subclassId: input.subclassId,
      class: cls || null,
      subclass: subclass || null,
    } as unknown as CharacterClass
  })

  open.value = false
}
</script>
