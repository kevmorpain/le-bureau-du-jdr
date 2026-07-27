import { SpellComponent } from '~~/server/db/schema/spells'

const filters = reactive<{
  levels: number[]
  concentration: string
  ritual: string
  castingTime: string[]
  components: SpellComponent[]
}>({
  levels: [],
  concentration: 'both',
  ritual: 'both',
  castingTime: [],
  components: [],
})

export const useSpellFilters = () => {
  const maxLevel = 9
  const levelsItems = computed(() =>
    Array.from({ length: maxLevel + 1 }, (_, i) => i),
  )

  const booleanItems = computed(() => [
    { label: 'Avec', value: 'true' },
    { label: 'Sans', value: 'false' },
    { label: 'Les deux', value: 'both' },
  ])

  const castingTimeItems = computed(() => [
    { label: '1 action', value: '1 action' },
    { label: '1 action bonus', value: '1 action bonus' },
    { label: '1 réaction', value: '1 réaction' },
    { label: 'Autre', value: 'other' },
  ])

  const componentsItems = computed(() => [
    { label: 'Vocal', value: SpellComponent.Vocal },
    { label: 'Somatique', value: SpellComponent.Somatic },
    { label: 'Matériel', value: SpellComponent.Material },
  ])

  return {
    booleanItems,
    castingTimeItems,
    componentsItems,
    filters,
    levelsItems,
  }
}
