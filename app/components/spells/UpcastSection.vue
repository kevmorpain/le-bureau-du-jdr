<template>
  <div v-if="rows.length">
    <p class="text-xs text-muted">
      Aux niveaux supérieurs
    </p>

    <ul class="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
      <li
        v-for="row in rows"
        :key="row.level"
        class="whitespace-nowrap"
      >
        <span class="text-muted text-xs">niv. {{ row.level }}</span>
        <span
          v-for="(entry, i) in row.entries"
          :key="i"
          :class="entryClass(entry)"
        >
          {{ ' ' }}{{ entryText(entry) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { upcastRows, type ScalingEntry } from '~~/shared/rules/spellScaling'

// Encart « Aux niveaux supérieurs » : rend la table `*_at_slot_level` déjà présente en base, que
// seule sa première ligne était lue jusqu'ici (cf. U10 de docs/fonctionnalites-manquantes.md).
// Un palier par niveau d'emplacement où la valeur CHANGE — rien pour un sort qui ne monte pas.
const props = defineProps<{
  spell: Spell
}>()

const { t } = useI18n()

const rows = computed(() => upcastRows(props.spell))

const entryClass = (entry: ScalingEntry): string => {
  if (entry.kind === 'damage') return `text-${entry.damageType}`
  if (entry.kind === 'heal') return 'text-heal'
  return ''
}

const entryText = (entry: ScalingEntry): string => {
  if (entry.kind === 'attacks') return `${entry.count} × ${entry.label}`
  const count = isNumeric(entry.die) ? Number(entry.die) : 0
  const type = entry.kind === 'damage'
    ? t(`damage_types.${entry.damageType}`, count)
    : t(`heal_types.${entry.healType}`, count)
  const label = entry.kind === 'damage' && entry.label ? ` (${entry.label})` : ''

  return `${entry.die} ${type}${label}`
}
</script>
