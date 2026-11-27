import type { MaybeRefOrGetter } from 'vue'
import type { Ruleset } from '~~/shared/rules/ruleset'
import { matchesSearch } from '~~/shared/utils/search'

type CatalogSpell = Spell & { school?: { name: string } | null }

export const useSpellCatalogSearch = (ruleset: MaybeRefOrGetter<Ruleset>) => {
  const catalogQuery = useCatalogQuery(ruleset)
  const { data: spells, pending } = useFetch<CatalogSpell[]>('/api/spells', { query: catalogQuery })

  const query = ref('')
  const levels = ref<number[]>([])
  const schools = ref<string[]>([])
  const classNames = ref<string[]>([])

  // The catalogue lists a class's spells one class at a time: each list is fetched once, then kept.
  const spellIdsByClass = ref(new Map<string, Set<number>>())
  watch([classNames, catalogQuery], async () => {
    for (const className of classNames.value) {
      if (spellIdsByClass.value.has(className)) continue
      const classSpells = await $fetch<CatalogSpell[]>('/api/spells', { query: { ...catalogQuery.value, className } })
      spellIdsByClass.value = new Map(spellIdsByClass.value).set(className, new Set(classSpells.map(spell => spell.id)))
    }
  }, { immediate: true })

  const isClassListLoading = computed(() => classNames.value.some(className => !spellIdsByClass.value.has(className)))

  const filteredSpells = computed(() => (spells.value ?? []).filter(spell =>
    matchesSearch(spell.name, query.value)
    && (!levels.value.length || levels.value.includes(spell.level))
    && (!schools.value.length || schools.value.includes(spell.school?.name ?? ''))
    && (!classNames.value.length || classNames.value.some(className => spellIdsByClass.value.get(className)?.has(spell.id)))))

  const reset = (defaultClassNames: string[] = []) => {
    query.value = ''
    levels.value = []
    schools.value = []
    classNames.value = defaultClassNames
  }

  return { spells, pending, query, levels, schools, classNames, filteredSpells, isClassListLoading, reset }
}
