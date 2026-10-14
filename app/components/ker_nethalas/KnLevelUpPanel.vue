<template>
  <div class="space-y-3 rounded-md border border-primary p-3">
    <div class="flex items-center gap-2">
      <h3 class="flex-1 font-medium">
        Passer au niveau {{ character.level + 1 }}
      </h3>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons:x-mark"
        aria-label="Fermer"
        @click="emit('close')"
      />
    </div>

    <p class="text-sm text-muted">
      +1 Point d'Aptitude (à dépenser dans la section Maîtrises), 1 000 XP en moins, et un avantage au choix :
    </p>

    <URadioGroup
      v-model="benefit"
      :items="benefitItems"
      variant="list"
    />

    <UFormField
      v-if="benefit === 'skill'"
      label="Compétence"
    >
      <USelect
        v-model="skill"
        :items="skillItems"
        placeholder="Choisir une compétence"
        class="w-64"
      />
    </UFormField>

    <UFormField
      v-if="benefit === 'physicalDamage'"
      label="Type de dégâts"
    >
      <USelect
        v-model="damageType"
        :items="damageItems"
        placeholder="Choisir un type"
        class="w-64"
      />
    </UFormField>

    <UFormField
      v-if="benefit === 'abilityDamage'"
      label="Aptitude qui inflige des dégâts"
    >
      <USelect
        v-if="abilityItems.length"
        v-model="ability"
        :items="abilityItems"
        placeholder="Choisir une Aptitude"
        class="w-72"
      />
      <p
        v-else
        class="text-sm text-muted"
      >
        Aucune Aptitude débloquée connue : choisissez un autre avantage, ou débloquez d'abord une Aptitude.
      </p>
    </UFormField>

    <p
      v-if="issues.length"
      class="text-sm text-warning"
    >
      {{ issues[0] }}
    </p>

    <UButton
      :disabled="issues.length > 0"
      icon="i-heroicons:arrow-up-circle"
      @click="confirm"
    >
      Monter de niveau
    </UButton>
  </div>
</template>

<script lang="ts" setup>
import type { RadioGroupItem, SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { knLevelUp } from '~~/shared/ker-nethalas/levelUp'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import {
  KN_LEVEL_BENEFITS,
  KN_PHYSICAL_DAMAGE_TYPES,
  knLevelChoiceIssues,
  type KnLevelBenefitKey,
} from '~~/shared/ker-nethalas/progression'
import { KN_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'

const props = defineProps<{
  masteries: KnMastery[] | null
}>()

const emit = defineEmits<{
  close: []
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const toast = useToast()

const LABELS: Record<KnLevelBenefitKey, { label: string, description: string }> = {
  health: { label: 'Santé +D4', description: 'Tout ce que vous avez traversé vous rend plus solide.' },
  toughness: { label: 'Robustesse +D6', description: 'Plus on essaie de vous briser, moins les coups portent.' },
  sanity: { label: 'Santé mentale +D4', description: 'Rien de ce qui se cache dans l\'ombre ne vous effraie plus.' },
  aether: { label: 'Éther +D6', description: 'Votre lien avec le royaume éthérique se renforce.' },
  physicalDamage: { label: '+D6 dégâts physiques', description: 'Ajouté à la réserve de dégâts physiques hors Aptitude (Tranchants, Contondants ou Perforants, au choix).' },
  abilityDamage: { label: '+1 aux dégâts d\'une Aptitude', description: 'Une Aptitude qui inflige déjà des dégâts.' },
  skill: { label: '+5 à une compétence', description: 'De chaque leçon on peut tirer quelque chose.' },
  resistances: { label: '+5 en Endurance, Résolution et Résistance magique', description: 'Le châtiment constant de Ker Nethalas vous a endurci.' },
}

const benefit = ref<KnLevelBenefitKey | undefined>()
const skill = ref<KnSkillKey | undefined>()
const damageType = ref<(typeof KN_PHYSICAL_DAMAGE_TYPES)[number] | undefined>()
const ability = ref<string | undefined>()

const benefitItems: RadioGroupItem[] = KN_LEVEL_BENEFITS.map(key => ({ value: key, ...LABELS[key] }))
const skillItems: SelectItem[] = KN_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key }))
const damageItems: SelectItem[] = KN_PHYSICAL_DAMAGE_TYPES.map(key => ({ label: t(`ker_nethalas.damageTypes.${key}`), value: key }))

// Les Aptitudes débloquées, amulette comprise ; une seule d'entre elles reçoit le +1.
const abilityItems = computed<SelectItem[]>(() => {
  if (!props.masteries) return []
  return knMasteryEntries(character.value.masteryPicks, character.value.amulets).flatMap((entry) => {
    const mastery = props.masteries?.find(candidate => candidate.key === entry.key)
    return (mastery?.abilities ?? [])
      .filter(candidate => candidate.tier <= entry.tiers)
      .map(candidate => ({ label: `${mastery!.name} : ${candidate.name}`, value: `${entry.key}:${candidate.tier}` }))
  })
})

const choice = computed(() => ({ benefit: benefit.value, skill: skill.value, damageType: damageType.value, ability: ability.value }))
const issues = computed(() => knLevelChoiceIssues(choice.value))

function confirm() {
  if (!benefit.value) return
  const c = character.value
  const result = knLevelUp(c, {
    benefit: benefit.value,
    ...(benefit.value === 'skill' ? { skill: skill.value } : {}),
    ...(benefit.value === 'physicalDamage' ? { damageType: damageType.value } : {}),
    ...(benefit.value === 'abilityDamage' ? { ability: ability.value } : {}),
  })
  if ('error' in result) {
    toast.add({ title: 'Passage de niveau impossible', color: 'warning' })
    return
  }
  Object.assign(c, result.patch)
  toast.add({ title: `Niveau ${c.level}`, description: `${result.summary} · +1 Point d'Aptitude`, color: 'success' })
  emit('close')
}
</script>
