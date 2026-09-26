<template>
  <div class="rounded-lg border border-(--ui-border) bg-(--ui-bg) p-3">
    <div class="flex items-center gap-2 mb-2">
      <p class="text-xs font-bold uppercase tracking-widest text-muted">Doué — 3 maîtrises au choix</p>
      <span class="text-xs font-semibold" :class="total >= SKILLED_FEAT_COUNT ? 'text-green-400' : 'text-amber-400'">
        {{ total }}/{{ SKILLED_FEAT_COUNT }}
      </span>
    </div>

    <p class="text-[11px] font-semibold uppercase tracking-wide text-muted/70 mb-1">Compétences</p>
    <div class="flex flex-wrap gap-1.5 mb-3">
      <button
        v-for="s in availableSkills"
        :key="s.key"
        type="button"
        class="px-2.5 py-1 rounded-md border text-xs transition-all"
        :class="skills.includes(s.key)
          ? 'border-amber-500 bg-amber-500/10 text-amber-400 cursor-pointer'
          : total >= SKILLED_FEAT_COUNT
            ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-40'
            : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40 cursor-pointer'"
        @click="toggleSkill(s.key)"
      >
        {{ s.label }}
      </button>
    </div>

    <template v-for="(catTools, category) in availableToolsByCategory" :key="category">
      <p v-if="catTools.length" class="text-[11px] font-semibold uppercase tracking-wide text-muted/70 mb-1">{{ category }}</p>
      <div v-if="catTools.length" class="flex flex-wrap gap-1.5 mb-3">
        <button
          v-for="tool in catTools"
          :key="tool"
          type="button"
          class="px-2.5 py-1 rounded-md border text-xs transition-all"
          :class="tools.includes(tool)
            ? 'border-amber-500 bg-amber-500/10 text-amber-400 cursor-pointer'
            : total >= SKILLED_FEAT_COUNT
              ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-40'
              : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40 cursor-pointer'"
          @click="toggleTool(tool)"
        >
          {{ tool }}
        </button>
      </div>
    </template>

    <p
      v-if="duplicateLabels"
      class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
    >
      ⚠️ Déjà maîtrisé par ailleurs : <strong>{{ duplicateLabels }}</strong>. Ce choix est gaspillé — remplace-le.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { SKILLED_FEAT_COUNT, TOOL_CATEGORIES } from '~~/shared/rules/tools'
import { SKILLS } from '~/data/character-builder'

// Exclut les maîtrises déjà accordées pour ne pas gaspiller un choix sur un doublon. Un choix devenu
// doublon après coup (source ajoutée ou chargée ensuite) reste affiché : masqué, il ne serait plus
// désélectionnable alors qu'il compte dans le total.
const props = defineProps<{ ownedSkills: string[], ownedTools: string[] }>()
const skills = defineModel<string[]>('skills', { default: () => [] })
const tools = defineModel<string[]>('tools', { default: () => [] })

const total = computed(() => skills.value.length + tools.value.length)

const availableSkills = computed(() => SKILLS.filter(s => !props.ownedSkills.includes(s.key) || skills.value.includes(s.key)))
const availableToolsByCategory = computed<Record<string, string[]>>(() =>
  Object.fromEntries(
    Object.entries(TOOL_CATEGORIES).map(([cat, list]) => [cat, list.filter(t => !props.ownedTools.includes(t) || tools.value.includes(t))]),
  ),
)
const duplicateLabels = computed(() => [
  ...SKILLS.filter(s => skills.value.includes(s.key) && props.ownedSkills.includes(s.key)).map(s => s.label),
  ...tools.value.filter(t => props.ownedTools.includes(t)),
].join(', '))

function toggleSkill(key: string) {
  const i = skills.value.indexOf(key)
  if (i >= 0) skills.value = skills.value.filter(s => s !== key)
  else if (total.value < SKILLED_FEAT_COUNT) skills.value = [...skills.value, key]
}
function toggleTool(tool: string) {
  const i = tools.value.indexOf(tool)
  if (i >= 0) tools.value = tools.value.filter(t => t !== tool)
  else if (total.value < SKILLED_FEAT_COUNT) tools.value = [...tools.value, tool]
}
</script>
