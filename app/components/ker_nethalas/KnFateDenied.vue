<template>
  <UCard
    v-if="character.healthCurrent <= 0"
    class="border border-error"
  >
    <template #header>
      <KnCardHeader title="Le survivant est mort">
        Règle optionnelle « Destin refusé » : au lieu de repartir avec un nouveau survivant, il se relève, au prix de deux Aptitudes
        de Maîtrise.
      </KnCardHeader>
    </template>

    <div class="space-y-3">
      <ul class="list-disc space-y-1 pl-5 text-sm">
        <li>Il récupère 2D6 Santé mentale, 2D6 Santé et toute sa Robustesse.</li>
        <li>S'il est mort au combat, ses adversaires le croient mort et s'éloignent : le combat s'arrête et la pièce est vidée.</li>
        <li>Il perd {{ count === 1 ? '1 Aptitude' : `${count} Aptitudes` }} de son choix, jamais sous une Aptitude par Maîtrise.</li>
      </ul>

      <div
        v-if="count > 0"
        class="flex flex-wrap items-end gap-3"
      >
        <UFormField
          v-for="slot in count"
          :key="slot"
          :label="`Aptitude perdue ${slot}`"
        >
          <USelect
            v-model="choice[slot - 1]"
            :items="choiceItems"
            placeholder="Choisir une Maîtrise"
            class="w-64"
          />
        </UFormField>
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        Aucune Aptitude à perdre : chaque Maîtrise n'en a plus qu'une.
      </p>

      <p
        v-if="issues.length"
        class="text-sm text-warning"
      >
        {{ issues[0] }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          :color="confirming ? 'error' : 'neutral'"
          :variant="confirming ? 'solid' : 'soft'"
          :disabled="issues.length > 0"
          @click="confirm"
        >
          {{ confirming ? 'Confirmer : refuser le destin' : 'Refuser le destin' }}
        </UButton>
        <UButton
          v-if="confirming"
          variant="ghost"
          color="neutral"
          @click="confirming = false"
        >
          Annuler
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { knAbilitiesToLose, knApplyFateDenied, knFateDeniedIssues, knLossableAbilities } from '~~/shared/ker-nethalas/fateDenied'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  resolved: KnResolvedSheet
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()
const { cancelCombat } = useKnCombatEnd(character, () => props.resolved, () => props.masteries)

const entries = computed(() => knMasteryEntries(character.value.masteryPicks, character.value.amulets))
const count = computed(() => knAbilitiesToLose(entries.value))
const choice = ref<(string | undefined)[]>([])
const confirming = ref(false)

const nameOf = (key: string) => props.masteries?.find(mastery => mastery.key === key)?.name ?? key

const choiceItems = computed<SelectItem[]>(() => entries.value
  .filter(entry => knLossableAbilities(entry) > 0)
  .map(entry => ({ label: `${nameOf(entry.key)} (${entry.tiers} Aptitudes)${entry.amulet ? ', amulette' : ''}`, value: entry.key })))

const picked = computed(() => choice.value.slice(0, count.value).filter((key): key is string => !!key))
const issues = computed(() => knFateDeniedIssues(entries.value, picked.value))

function confirm() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  const c = character.value
  const max = props.resolved.maxVitals
  const result = knApplyFateDenied({
    healthCurrent: c.healthCurrent,
    healthMax: max.health.effective,
    sanityCurrent: c.sanityCurrent,
    sanityMax: max.sanity.effective,
    toughnessCurrent: c.toughnessCurrent,
    toughnessMax: max.toughness.effective,
    masteryPicks: c.masteryPicks,
    amulets: c.amulets,
  }, picked.value)
  if ('error' in result) return
  Object.assign(c, result.patch)
  if (c.run.combat) cancelCombat()
  choice.value = []
  confirming.value = false
  toast.add({ title: 'Destin refusé', description: result.lines.join(' · '), color: 'success' })
}
</script>
