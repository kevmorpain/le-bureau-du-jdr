<template>
  <div class="space-y-2">
    <URadioGroup
      v-if="originOptions.length > 2"
      v-model="selectedOrigin"
      :items="originOptions"
      value-key="value"
      orientation="horizontal"
      variant="table"
      indicator="hidden"
      size="xs"
      class="mb-2"
    />

    <ul class="space-y-1">
      <li
        v-for="feature in visibleFeatures"
        :key="`${feature.origin.kind}-${feature.id}`"
        class="rounded-lg bg-default ring ring-default p-2"
      >
        <UCollapsible>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <ActionTypeIcon
                v-if="feature.actionType && isValidActionType(feature.actionType)"
                :type="(feature.actionType as 'action' | 'bonus_action' | 'reaction' | 'free')"
              />
              <h3 class="font-semibold truncate">
                {{ feature.name }}
              </h3>
              <UBadge
                v-if="feature.origin.label"
                :label="feature.origin.label"
                :color="originColor(feature.origin.kind)"
                variant="soft"
                size="xs"
                class="shrink-0"
              />
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <UButton
                v-if="isASIFeature(feature)"
                variant="soft"
                size="sm"
                icon="i-lucide-sliders-horizontal"
                @click.stop="openASIModal(feature)"
              >
                Choisir
              </UButton>

              <div
                v-if="feature.maxUses !== null"
                class="flex items-center gap-1"
              >
                <button
                  v-for="i in feature.maxUses"
                  :key="i"
                  class="size-4 rounded-full border-2 transition-colors"
                  :class="i <= feature.currentUses
                    ? 'bg-primary/60 border-primary hover:bg-primary/80'
                    : 'bg-transparent border-muted'"
                  :aria-label="i <= feature.currentUses ? 'Utilisation dépensée' : 'Utilisation disponible'"
                  @click.stop="toggleUse(feature.id, feature.currentUses, feature.maxUses!, i)"
                />
                <UBadge
                  v-if="feature.rechargeType"
                  :label="rechargeLabel(feature.rechargeType)"
                  variant="soft"
                  size="xs"
                  class="ml-1"
                />
              </div>
            </div>
          </div>

          <template #content>
            <p class="text-sm text-muted mt-2 whitespace-pre-line">
              {{ feature.description }}
            </p>
            <div
              v-if="isASIFeature(feature)"
              class="mt-3 space-y-1"
            >
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                Vos améliorations
              </p>
              <ul
                v-if="asiSummary(feature).length"
                class="text-sm space-y-0.5"
              >
                <li
                  v-for="entry in asiSummary(feature)"
                  :key="entry.classLevel"
                  class="flex items-center justify-between gap-2"
                >
                  <span class="text-muted">Niveau {{ entry.classLevel }}</span>
                  <span class="font-mono">{{ entry.label }}</span>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted italic"
              >
                Aucune amélioration choisie.
              </p>
            </div>
          </template>
        </UCollapsible>
      </li>
    </ul>

    <EditASIModal
      v-if="asiModal.classId !== null"
      v-model:open="asiModal.open"
      :character-sheet-id="characterSheet.id"
      :class-id="asiModal.classId"
      :class-name="asiModal.className"
      :class-level="asiModal.classLevel"
      :all-improvements="characterSheet.abilityScoreImprovements ?? []"
      @saved="onASISaved"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Effect } from '~~/server/db/schema/effects'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const characterSheetRef = toRef(props, 'characterSheet')
const { allCharacterFeatures } = useCharacterSheet(characterSheetRef)

const toaster = useToast()

// ── Filtre par origine ─────────────────────────────────────────────────────

const selectedOrigin = ref<string>('all')

const originOptions = computed(() => {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const f of allCharacterFeatures.value) {
    if (f.origin.label && !seen.has(f.origin.label)) {
      seen.add(f.origin.label)
      labels.push(f.origin.label)
    }
  }
  return [
    { label: 'Toutes', value: 'all' },
    ...labels.map(l => ({ label: l, value: l })),
  ]
})

const visibleFeatures = computed(() =>
  selectedOrigin.value === 'all'
    ? allCharacterFeatures.value
    : allCharacterFeatures.value.filter(f => f.origin.label === selectedOrigin.value),
)

const originColor = (kind: 'species' | 'class' | 'subclass') => {
  if (kind === 'species') return 'success' as const
  if (kind === 'subclass') return 'info' as const
  return 'primary' as const
}

// ── ASI modal state ────────────────────────────────────────────────────────

const asiModal = reactive({
  open: false,
  classId: null as number | null,
  className: '',
  classLevel: 0,
})

const isASIFeature = (feature: { effects?: unknown[] }) =>
  (feature.effects as Effect[] | undefined)?.some(e => e?.type === 'asi_or_feat') ?? false

const abilityShortLabels: Record<string, string> = {
  str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA',
}

const asiSummary = (feature: { classId?: number | null }) => {
  const improvements = (props.characterSheet.abilityScoreImprovements ?? [])
    .filter(a => a.classId === feature.classId)
  const byLevel = new Map<number, typeof improvements>()
  for (const i of improvements) {
    if (!byLevel.has(i.classLevel)) byLevel.set(i.classLevel, [])
    byLevel.get(i.classLevel)!.push(i)
  }
  return Array.from(byLevel.entries())
    .sort(([a], [b]) => a - b)
    .map(([classLevel, rows]) => {
      const label = rows
        .map(r => `${abilityShortLabels[r.ability] ?? r.ability.toUpperCase()} +${r.amount}`)
        .join(', ')
      return { classLevel, label }
    })
}

const openASIModal = (feature: { classId?: number | null }) => {
  const cls = props.characterSheet.classes?.find(c => c.classId === feature.classId)
  if (!cls) return
  asiModal.classId = cls.classId
  asiModal.className = cls.class?.name ?? ''
  asiModal.classLevel = cls.level
  asiModal.open = true
}

const onASISaved = (improvements: { classId: number, classLevel: number, ability: string, amount: number }[]) => {
  ;(props.characterSheet as unknown as { abilityScoreImprovements?: unknown[] }).abilityScoreImprovements = improvements
}

const validActionTypes = new Set(['action', 'bonus_action', 'reaction', 'free'])
const isValidActionType = (t: string) => validActionTypes.has(t)

const rechargeLabel = (rechargeType: string) => {
  const labels: Record<string, string> = {
    short_rest: 'Repos court',
    long_rest: 'Repos long',
    dawn: 'À l\'aube',
  }
  return labels[rechargeType] ?? rechargeType
}

const toggleUse = async (featureId: number, currentUses: number, maxUses: number, slot: number) => {
  const newUses = slot <= currentUses ? slot - 1 : slot
  try {
    await $fetch(`/api/character_sheets/${props.characterSheet.id}/features`, {
      method: 'PUT',
      body: [{ featureId, currentUses: newUses }],
    })
    const cf = props.characterSheet.features?.find(f => f.featureId === featureId)
    if (cf) cf.currentUses = newUses
  } catch {
    toaster.add({ title: 'Erreur lors de la mise à jour', color: 'error' })
  }
}
</script>
