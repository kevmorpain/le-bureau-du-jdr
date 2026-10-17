<template>
  <section class="space-y-3 rounded-md border border-lime-700/40 bg-lime-900/10 p-3">
    <h3 class="font-medium text-lime-500">
      La Pourriture
    </h3>

    <div class="flex items-center gap-3">
      <div class="flex gap-1.5">
        <button
          v-for="n in KN_ROT_MAX_STAGE"
          :key="n"
          type="button"
          class="size-5 rounded-full border-2 transition-colors cursor-pointer"
          :class="n <= status.rotStage
            ? 'bg-lime-700/70 border-lime-600 hover:bg-lime-600/80'
            : 'bg-transparent border-muted hover:border-lime-600'"
          :aria-label="`La Pourriture : stade ${n}`"
          @click="status.rotStage = status.rotStage === n ? n - 1 : n"
        />
      </div>
      <span class="text-sm text-muted">
        {{ status.rotStage > 0 ? `Stade ${status.rotStage}` : 'Aucun stade' }}
      </span>
    </div>

    <ul
      v-if="status.rotStage > 0"
      class="space-y-1 text-sm"
    >
      <li
        v-for="n in status.rotStage"
        :key="n"
      >
        <span class="font-medium text-lime-500">Stade {{ n }}</span>
        — {{ $t(`ker_nethalas.rot.stage${n}`) }}
      </li>
    </ul>
  </section>

  <section class="space-y-3 rounded-md border border-violet-500/30 bg-violet-500/10 p-3">
    <h3 class="font-medium text-violet-400">
      Folie
    </h3>

    <KnAddPicker
      :items="madnessItems"
      placeholder="Ajouter une folie"
      class="w-full sm:w-72"
      @pick="add"
    />

    <ul
      v-if="activeCounters.length || status.madness.lostSkills.length"
      class="space-y-2"
    >
      <li
        v-for="key in activeCounters"
        :key
        class="flex items-center gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2"
      >
        <span class="min-w-0 flex-1">
          <span class="block font-medium">
            {{ $t(`ker_nethalas.madnessNames.${key}`) }}
            <span class="text-sm font-normal text-muted">(D10 : {{ KN_MADNESS_D10[key] }})</span>
          </span>
          <span class="block text-xs text-muted">{{ effectText(key) }}</span>
        </span>
        <UButton
          icon="i-heroicons:minus"
          variant="soft"
          size="sm"
          :aria-label="`Retirer un cumul : ${$t(`ker_nethalas.madnessNames.${key}`)}`"
          @click="status.madness.counters[key]--"
        />
        <span class="w-6 text-center tabular-nums">{{ status.madness.counters[key] }}</span>
        <UButton
          icon="i-heroicons:plus"
          variant="soft"
          size="sm"
          :disabled="status.madness.counters[key] >= KN_STATUS_BOUNDS.counter.max"
          :aria-label="`Ajouter un cumul : ${$t(`ker_nethalas.madnessNames.${key}`)}`"
          @click="status.madness.counters[key]++"
        />
      </li>

      <li
        v-for="(entry, index) in status.madness.lostSkills"
        :key="`lostSkill-${index}`"
        class="flex items-center gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2"
      >
        <span class="flex-1">
          {{ $t('ker_nethalas.madnessNames.lostSkill') }}
          <span class="text-sm text-muted">(D10 : {{ KN_MADNESS_D10.lostSkill }}, −10)</span>
        </span>
        <USelect
          v-model="entry.skill"
          :items="skillItems"
          placeholder="Choisir une compétence"
          class="w-56"
          aria-label="Compétence bloquée"
        />
        <UButton
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          aria-label="Retirer ce souvenir bloqué"
          @click="status.madness.lostSkills.splice(index, 1)"
        />
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import { KN_MADNESS_COUNTER_KEYS, KN_MADNESS_D10, type KnMadnessCounterKey } from '~~/shared/ker-nethalas/catalog/madness'
import { KN_ROT_MAX_STAGE } from '~~/shared/ker-nethalas/catalog/rot'
import { KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'
import { KN_STATUS_BOUNDS, type KnStatus } from '~~/shared/ker-nethalas/status'

const status = defineModel<KnStatus>('status', { required: true })

const { t } = useI18n()

const LOST_SKILL = 'lostSkill'

// L'effet d'un cumul, sans le nom qui le précède dans le libellé.
const effectText = (key: KnMadnessCounterKey) =>
  t(`ker_nethalas.madness.${key}`, { count: status.value.madness.counters[key] }).split(' : ').slice(1).join(' : ')

const activeCounters = computed(() => KN_MADNESS_COUNTER_KEYS.filter(key => status.value.madness.counters[key] > 0))

const madnessItems = computed<SelectItem[]>(() =>
  [...KN_MADNESS_COUNTER_KEYS, LOST_SKILL].map(key => ({
    label: `${t(`ker_nethalas.madnessNames.${key}`)} (D10 : ${KN_MADNESS_D10[key as keyof typeof KN_MADNESS_D10]})`,
    value: key,
  })),
)

const skillItems = computed<SelectItem[]>(() =>
  KN_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key })),
)

function add(key: string | number) {
  if (key === LOST_SKILL) {
    if (status.value.madness.lostSkills.length < KN_STATUS_BOUNDS.lostSkills) status.value.madness.lostSkills.push({})
    return
  }
  if (!KN_MADNESS_COUNTER_KEYS.includes(key as KnMadnessCounterKey)) return
  const counter = key as KnMadnessCounterKey
  if (status.value.madness.counters[counter] < KN_STATUS_BOUNDS.counter.max) status.value.madness.counters[counter]++
}
</script>
