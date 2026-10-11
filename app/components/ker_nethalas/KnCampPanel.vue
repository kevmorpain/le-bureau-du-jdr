<template>
  <div class="space-y-4 rounded-md border border-default p-3">
    <div class="flex items-center gap-2">
      <h3 class="flex-1 font-medium">
        Établir le camp
      </h3>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        @click="emit('close')"
      >
        Fermer
      </UButton>
    </div>

    <div
      v-if="report"
      class="space-y-2 rounded-md border border-success p-3"
    >
      <p class="text-sm font-medium">
        Camp terminé
      </p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="(line, index) in report"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>
    </div>

    <div class="space-y-3">
      <p class="text-sm text-muted">
        Choisissez les activités faites au camp ; le test de Camp se lance une seule fois, quand vous avez fini. Établir le camp consomme 1 Ration.
      </p>

      <ul class="space-y-3">
        <li
          v-for="key in KN_CAMP_ACTIVITY_KEYS"
          :key="key"
          class="flex flex-wrap items-center gap-3"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">
              {{ $t(`ker_nethalas.camp.activities.${key}.name`) }}
            </p>
            <p class="text-xs text-muted">
              {{ $t(`ker_nethalas.camp.activities.${key}.hint`) }}
            </p>
          </div>
          <KnNumberField
            v-model="plan.activities[key]"
            :aria-label="`${$t(`ker_nethalas.camp.activities.${key}.name`)} : ${$t(`ker_nethalas.camp.activities.${key}.unit`)}`"
            :min="0"
            :max="KN_CAMP_QUANTITY_MAX"
            class="w-28"
          />
        </li>
      </ul>

      <ul
        v-if="context.traitActivities.length"
        class="space-y-3 border-t border-default pt-3"
      >
        <li
          v-for="{ key, activity } in context.traitActivities"
          :key
          class="flex flex-wrap items-center gap-3"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">
              {{ activity.name }}
            </p>
            <p class="text-xs text-muted">
              {{ traitHint(activity) }}
            </p>
          </div>
          <KnNumberField
            :model-value="plan.traitActivities[key] ?? 0"
            :aria-label="`${activity.name} : ${activity.quantity ? 'quantité' : '0 ou 1'}`"
            :min="0"
            :max="activity.quantity ? KN_CAMP_QUANTITY_MAX : 1"
            class="w-28"
            @update:model-value="plan.traitActivities = { ...plan.traitActivities, [key]: $event }"
          />
        </li>
      </ul>

      <div class="flex flex-wrap items-center gap-3">
        <UCheckbox
          v-model="plan.sleep"
          :label="$t('ker_nethalas.camp.sleep.name')"
        />
        <p class="flex-1 text-xs text-muted">
          {{ $t('ker_nethalas.camp.sleep.hint') }}
        </p>
      </div>

      <KnNumberField
        v-model="plan.modifier"
        label="Autre modificateur du test de Camp (objet, aptitude)"
        :min="-99"
        :max="99"
        class="w-40"
      />
    </div>

    <ul class="space-y-1 text-sm">
      <li>
        Épuisement des activités : <span class="font-medium">+{{ preview.exhaustionCost }}</span>
      </li>
      <li>
        Test de Camp : D20 {{ signed(preview.checkModifier) }}, il faut {{ KN_CAMP_CHECK.target }} ou plus.
        <span
          v-if="context.checkPenalty"
          class="text-muted"
        >
          (dont −{{ context.checkPenalty }} d'événements de l'Obscurité Grandissante)
        </span>
        <span
          v-if="context.traitCheckBonus"
          class="text-muted"
        >
          (dont {{ signed(context.traitCheckBonus) }} d'aptitudes de Maîtrise)
        </span>
      </li>
      <li :class="preview.hasRation ? '' : 'text-warning'">
        {{ preview.hasRation ? 'Une Ration sera consommée.' : 'Aucune Ration : tous les bénéfices du camp seront réduits de moitié (cuisinez pour en avoir).' }}
      </li>
    </ul>

    <ul
      v-if="preview.issues.length"
      class="space-y-1 text-sm text-error"
    >
      <li
        v-for="(issue, index) in preview.issues"
        :key="index"
      >
        {{ issueText(issue) }}
      </li>
    </ul>

    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="Résultat du D20">
        <UInputNumber
          v-model="roll"
          :min="1"
          :max="KN_CAMP_CHECK.die"
          :increment="false"
          :decrement="false"
          aria-label="Résultat du D20 du test de Camp"
          class="w-28"
        />
      </UFormField>
      <UButton
        variant="soft"
        @click="rollCheck"
      >
        Lancer le D20
      </UButton>
      <p
        v-if="roll !== null && total !== undefined"
        class="pb-2 text-sm"
      >
        Total {{ total }} :
        <span :class="total >= KN_CAMP_CHECK.target ? 'font-bold text-success' : 'font-bold text-error'">
          {{ total >= KN_CAMP_CHECK.target ? 'réussi' : 'raté, bénéfices réduits de moitié' }}
        </span>
      </p>
    </div>

    <UButton
      :disabled="preview.issues.length > 0 || roll === null"
      @click="finish"
    >
      Terminer le camp
    </UButton>
  </div>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import {
  KN_CAMP_ACTIVITY_KEYS,
  KN_CAMP_CHECK,
  KN_CAMP_QUANTITY_MAX,
  emptyKnCampPlan,
  knCampContext,
  knFinishCamp,
  knPreviewCamp,
  type KnCampIssue,
} from '~~/shared/ker-nethalas/camp'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnCampActivity, KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knApplySelfEffects, knCampRecoverEffects, knCampTraits } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCurrentDomain, knRollDie } from '~~/shared/ker-nethalas/run'
import { knRest } from '~~/shared/ker-nethalas/vitals'

const props = defineProps<{
  resolved: KnResolvedSheet
  masteries: KnMastery[] | null
}>()

const emit = defineEmits<{
  close: []
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const { signed } = useKnLabels()

const plan = ref(emptyKnCampPlan())
const roll = ref<number | null>(null)
const report = ref<string[] | null>(null)

const traits = computed(() => props.masteries
  ? knCampTraits(props.masteries, knMasteryEntries(character.value.masteryPicks, character.value.amulets))
  : { activities: [], checkBonus: 0 })
const context = computed(() => knCampContext(character.value.provisions, knCurrentDomain(character.value.run), traits.value))

const traitHint = (activity: KnCampActivity) => [
  activity.exhaustion ? `+${activity.exhaustion} Épuisement` : '',
  activity.check ? `test de Camp ${signed(activity.check)}` : '',
  ...Object.entries(activity.consumes ?? {}).map(([key, amount]) => `−${amount} ${t(`ker_nethalas.provisions.${key}`)}${activity.quantity ? ' par unité' : ''}`),
  ...Object.entries(activity.produces ?? {}).map(([key, amount]) => `+${amount} ${t(`ker_nethalas.provisions.${key}`)}${activity.quantity ? ' par unité' : ''}`),
].filter(Boolean).join(' · ')
const preview = computed(() => knPreviewCamp(plan.value, context.value))
const total = computed(() => roll.value === null ? undefined : roll.value + preview.value.checkModifier)

function issueText(issue: KnCampIssue) {
  if (issue.type === 'shortage') return `Il manque ${issue.missing} × ${t(`ker_nethalas.provisions.${issue.key}`)} : corrigez les provisions ou les quantités.`
  if (issue.type === 'sleepExclusive') return 'Dormir interdit toute autre activité, sauf Barricader.'
  return 'Un événement de l\'Obscurité Grandissante interdit l\'Harmonisation au camp.'
}

function rollCheck() {
  roll.value = knRollDie(KN_CAMP_CHECK.die)
}

const gain = (label: string, amount: number) => `${label} ${signed(amount)}`

function finish() {
  if (roll.value === null) return
  const c = character.value
  const used = plan.value
  const outcome = knFinishCamp(
    used,
    {
      toughness: c.toughnessCurrent,
      toughnessMax: props.resolved.maxVitals.toughness.effective,
      health: c.healthCurrent,
      healthMax: props.resolved.maxVitals.health.effective,
      sanity: c.sanityCurrent,
      sanityMax: props.resolved.maxVitals.sanity.effective,
      exhaustion: c.exhaustion,
      rotStage: c.status.rotStage,
    },
    context.value,
    roll.value,
  )
  if (!outcome) return

  c.toughnessCurrent = outcome.state.toughness
  c.healthCurrent = outcome.state.health
  c.sanityCurrent = outcome.state.sanity
  c.exhaustion = Math.min(KN_BOUNDS.exhaustion.max, outcome.state.exhaustion)
  c.provisions = outcome.provisions
  c.status = knRest(c.status, 'camp')

  // Les effets d'une activité de trait (Prier soigne la Santé mentale) ne sont pas des bénéfices du camp : pas de moitié.
  const recover = knCampRecoverEffects(context.value.traitActivities, used.traitActivities)
  const recovered = knApplySelfEffects(recover, {
    toughness: c.toughnessCurrent,
    toughnessMax: props.resolved.maxVitals.toughness.effective,
    health: c.healthCurrent,
    healthMax: props.resolved.maxVitals.health.effective,
    sanity: c.sanityCurrent,
    sanityMax: props.resolved.maxVitals.sanity.effective,
    aether: c.aetherCurrent,
    aetherMax: props.resolved.maxVitals.aether.effective,
    status: c.status,
  })
  c.toughnessCurrent = recovered.state.toughness
  c.healthCurrent = recovered.state.health
  c.sanityCurrent = recovered.state.sanity
  c.aetherCurrent = recovered.state.aether
  c.status = recovered.state.status

  const lines = [
    `Test de Camp : ${roll.value} ${signed(preview.value.checkModifier)} = ${outcome.total}, ${outcome.success ? 'réussi' : 'raté'}.`,
  ]
  if (outcome.halved) {
    lines.push(`Bénéfices réduits de moitié : ${[!outcome.success && 'test raté', !outcome.hasRation && 'aucune Ration'].filter(Boolean).join(' et ')}.`)
  }
  lines.push(
    [
      gain('Robustesse', outcome.gains.toughness),
      gain('Santé', outcome.gains.health),
      `${gain('Santé mentale', outcome.gains.sanity)} (D4 : ${outcome.sanityRoll})`,
      `${gain('Épuisement', outcome.gains.exhaustion)} (coûts des activités compris)`,
    ].join(' · ') + (outcome.rotHealthRoll === undefined ? '' : ` · D4 de Santé de la Pourriture : ${outcome.rotHealthRoll}`),
  )
  for (const { effect, label, roll: dice } of recovered.outcomes) {
    if (effect.kind === 'recover') lines.push(`${t(`ker_nethalas.vitals.${effect.vital}`)} +${dice.total} (${label} : ${dice.rolls.join(' + ') || dice.total}), activité de trait`)
  }
  if (!outcome.success) lines.push('Test raté : tirez dans la table des Rencontres (les bénéfices réduits sont déjà appliqués).')
  if (c.status.rotStage >= 1) lines.push('Pourriture : test d\'Endurance, sinon elle avance d\'un stade.')
  if (used.activities.healConditions > 0) lines.push('Retirez les Conditions soignées dans « Effets en cours ».')
  if (used.activities.attune > 0) lines.push('Pensez à noter les objets harmonisés dans l\'équipement.')

  report.value = lines
  plan.value = emptyKnCampPlan()
  roll.value = null
}
</script>
