<template>
  <section class="space-y-3">
    <h3 class="font-medium">
      Domaine en cours
    </h3>

    <div class="space-y-2">
      <p class="text-sm font-medium">
        Influences de l'Overseer
      </p>
      <KnAddPicker
        :items="overseerItems"
        placeholder="Ajouter une influence"
        class="w-full"
        :disabled="status.domain.overseerInfluences.length >= KN_STATUS_BOUNDS.overseerInfluences"
        @pick="addInfluence"
      />
      <ul
        v-if="status.domain.overseerInfluences.length"
        class="space-y-2"
      >
        <li
          v-for="(influence, index) in status.domain.overseerInfluences"
          :key="index"
          class="flex items-center gap-3"
        >
          <span class="flex-1 text-sm">{{ $t(`ker_nethalas.overseer.${influence}`) }}</span>
          <UButton
            icon="i-heroicons:trash"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Retirer l'influence : ${$t(`ker_nethalas.overseer.${influence}`)}`"
            @click="status.domain.overseerInfluences.splice(index, 1)"
          />
        </li>
      </ul>
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium">
        Obscurité Grandissante
      </p>
      <KnAddPicker
        :items="eventItems"
        placeholder="Ajouter un événement"
        class="w-full"
        :disabled="status.domain.growingDarkness.length >= KN_STATUS_BOUNDS.growingDarkness"
        @pick="addEvent"
      />
      <p class="text-xs text-muted">
        Un même événement peut être ajouté plusieurs fois : ses effets se cumulent.
      </p>
    </div>

    <ul
      v-if="status.domain.growingDarkness.length"
      class="space-y-3"
    >
      <li
        v-for="(entry, index) in status.domain.growingDarkness"
        :key="index"
        class="space-y-2 rounded-md border border-default p-3"
      >
        <div class="flex items-start gap-3">
          <p class="flex-1 text-sm">
            <span class="font-medium">{{ rangeLabel(entry.key) }}</span>
            {{ labelText({ key: `ker_nethalas.growing_darkness.${entry.key}`, params: { value: entry.value ?? 0, skill: skillText(entry.skill) } }) }}
          </p>
          <UBadge
            :color="knGrowingDarknessDef(entry.key).kind === 'immediate' ? 'warning' : 'neutral'"
            variant="subtle"
            size="xs"
            :label="knGrowingDarknessDef(entry.key).kind === 'immediate' ? 'Immédiat' : 'En cours'"
          />
          <UButton
            icon="i-heroicons:trash"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Retirer l'événement ${rangeLabel(entry.key)}`"
            @click="status.domain.growingDarkness.splice(index, 1)"
          />
        </div>

        <KnNumberField
          v-if="knGrowingDarknessDef(entry.key).param === 'maxAetherLoss' || knGrowingDarknessDef(entry.key).param === 'maxToughnessLoss'"
          :model-value="entry.value ?? 0"
          label="Valeur tirée"
          :min="KN_STATUS_BOUNDS.growingDarknessValue.min"
          :max="KN_STATUS_BOUNDS.growingDarknessValue.max"
          class="w-40"
          @update:model-value="entry.value = $event"
        />

        <UFormField
          v-if="knGrowingDarknessDef(entry.key).param === 'skill'"
          label="Compétence réduite"
        >
          <USelect
            v-model="entry.skill"
            :items="skillItems"
            placeholder="Choisir une compétence"
            class="w-full sm:w-72"
          />
        </UFormField>
      </li>
    </ul>

    <p
      v-if="missingInfluences > 0"
      class="text-sm text-warning"
    >
      {{ missingInfluences === 1 ? 'Un événement 81-100 est actif' : `${missingInfluences} événements 81-100 sont actifs` }} :
      une influence d'Overseer est à ajouter ci-dessus pour chacun.
    </p>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import {
  KN_GROWING_DARKNESS_KEYS,
  knGrowingDarknessDef,
  type KnGrowingDarknessKey,
} from '~~/shared/ker-nethalas/catalog/growingDarkness'
import { KN_OVERSEER_INFLUENCE_KEYS, type KnOverseerInfluenceKey } from '~~/shared/ker-nethalas/catalog/overseerInfluence'
import { KN_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import { KN_STATUS_BOUNDS, type KnStatus } from '~~/shared/ker-nethalas/status'

const status = defineModel<KnStatus>('status', { required: true })

const { t } = useI18n()
const { labelText } = useKnLabels()

const pad = (n: number) => String(n).padStart(2, '0')

function rangeLabel(key: KnGrowingDarknessKey) {
  const [from, to] = knGrowingDarknessDef(key).range
  return `${pad(from)}-${to === 100 ? '100' : pad(to)}`
}

const skillText = (skill: KnSkillKey | undefined) =>
  skill ? `ker_nethalas.skills.${skill}` : 'ker_nethalas.reminders.noSkillChosen'

const overseerItems = computed<SelectItem[]>(() =>
  KN_OVERSEER_INFLUENCE_KEYS.map(key => ({ label: t(`ker_nethalas.overseer.${key}`), value: key })),
)

const eventItems = computed<SelectItem[]>(() =>
  KN_GROWING_DARKNESS_KEYS.map(key => ({
    label: `${rangeLabel(key)} — ${t(`ker_nethalas.growing_darkness.${key}`, { value: 'X', skill: t('ker_nethalas.reminders.noSkillChosen') })}`,
    value: key,
  })),
)

const skillItems = computed<SelectItem[]>(() =>
  KN_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key })),
)

const missingInfluences = computed(() =>
  status.value.domain.growingDarkness.filter(e => e.key === 'gd_81_100').length - status.value.domain.overseerInfluences.length,
)

function addInfluence(key: string | number) {
  if (KN_OVERSEER_INFLUENCE_KEYS.includes(key as KnOverseerInfluenceKey)) {
    status.value.domain.overseerInfluences.push(key as KnOverseerInfluenceKey)
  }
}

function addEvent(key: string | number) {
  if (!KN_GROWING_DARKNESS_KEYS.includes(key as KnGrowingDarknessKey)) return
  const event = key as KnGrowingDarknessKey
  const param = knGrowingDarknessDef(event).param
  status.value.domain.growingDarkness.push(
    param === 'maxAetherLoss' || param === 'maxToughnessLoss' ? { key: event, value: 0 } : { key: event },
  )
}
</script>
