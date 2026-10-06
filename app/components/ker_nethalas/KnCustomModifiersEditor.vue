<template>
  <section class="space-y-3">
    <h3 class="font-medium">
      Modificateurs libres
    </h3>
    <p class="text-sm text-muted">
      Pour ce que les tables ne couvrent pas : équipement, Capacités de Maîtrise, bénédictions.
    </p>

    <div
      v-for="(modifier, index) in status.custom"
      :key="modifier.id"
      class="space-y-3 rounded-md border border-default p-3"
    >
      <div class="flex items-center gap-3">
        <UInput
          :model-value="modifier.name"
          :maxlength="100"
          class="flex-1"
          aria-label="Nom du modificateur"
          @update:model-value="rename(modifier, $event)"
        />
        <USwitch
          v-model="modifier.active"
          :aria-label="`${modifier.name} : actif`"
        />
        <UButton
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Supprimer ${modifier.name}`"
          @click="status.custom.splice(index, 1)"
        />
      </div>

      <div
        v-for="(entry, entryIndex) in modifier.entries"
        :key="entryIndex"
        class="flex flex-wrap items-center gap-2"
      >
        <USelect
          :model-value="entry.kind"
          :items="kindItems"
          class="w-48"
          :aria-label="`Type d'effet ${entryIndex + 1}`"
          @update:model-value="setKind(modifier, entryIndex, $event)"
        />
        <USelect
          v-if="entry.kind === 'maxVital'"
          v-model="entry.vital"
          :items="vitalItems"
          class="w-44"
          aria-label="Jauge"
        />
        <USelect
          v-else
          v-model="entry.target"
          :items="targetItems"
          class="w-64"
          aria-label="Cible"
        />
        <KnNumberField
          v-if="entry.kind === 'modifier' || entry.kind === 'maxVital'"
          v-model="entry.amount"
          aria-label="Valeur"
          :min="KN_STATUS_BOUNDS.customAmount.min"
          :max="KN_STATUS_BOUNDS.customAmount.max"
          class="w-24"
        />
        <UButton
          icon="i-heroicons:x-mark"
          variant="ghost"
          size="sm"
          :aria-label="`Retirer l'effet ${entryIndex + 1}`"
          @click="modifier.entries.splice(entryIndex, 1)"
        />
      </div>

      <UButton
        icon="i-heroicons:plus"
        variant="soft"
        size="sm"
        :disabled="modifier.entries.length >= KN_STATUS_BOUNDS.customEntries"
        @click="modifier.entries.push({ kind: 'modifier', target: 'allSkills', amount: 0 })"
      >
        Ajouter un effet
      </UButton>

      <UInput
        :model-value="modifier.note ?? ''"
        :maxlength="500"
        placeholder="Note affichée dans les rappels"
        class="w-full"
        aria-label="Note"
        @update:model-value="modifier.note = String($event)"
      />
    </div>

    <UButton
      icon="i-heroicons:plus"
      variant="soft"
      :disabled="status.custom.length >= KN_STATUS_BOUNDS.custom"
      @click="add"
    >
      Ajouter un modificateur
    </UButton>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import { KN_TARGET_GROUPS, KN_VITAL_KEYS } from '~~/shared/ker-nethalas/effects'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'
import { KN_STATUS_BOUNDS, type KnCustomModifier, type KnStatus } from '~~/shared/ker-nethalas/status'

const status = defineModel<KnStatus>('status', { required: true })

const { t } = useI18n()

const kindItems = computed<SelectItem[]>(() =>
  (['modifier', 'advantage', 'disadvantage', 'maxVital'] as const).map(kind => ({ label: t(`ker_nethalas.customKinds.${kind}`), value: kind })),
)

const vitalItems = computed<SelectItem[]>(() =>
  KN_VITAL_KEYS.map(vital => ({ label: t(`ker_nethalas.vitals.${vital}`), value: vital })),
)

const targetItems = computed<SelectItem[]>(() => [
  ...KN_TARGET_GROUPS.map(group => ({ label: t(`ker_nethalas.targets.${group}`), value: group })),
  ...KN_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key })),
  ...KN_RESISTANCE_KEYS.map(key => ({ label: t(`ker_nethalas.resistances.${key}`), value: key })),
])

function add() {
  status.value.custom.push({ id: crypto.randomUUID(), name: 'Nouveau modificateur', active: true, entries: [] })
}

// Un nom vidé en cours de frappe n'est pas écrit : le schéma le refuserait et l'auto-save échouerait.
function rename(modifier: KnCustomModifier, value: string | number | null | undefined) {
  if (typeof value === 'string' && value.trim() !== '') modifier.name = value
}

function setKind(modifier: KnCustomModifier, index: number, kind: unknown) {
  const previous = modifier.entries[index]!
  const target = 'target' in previous ? previous.target : 'allSkills'

  if (kind === 'modifier') modifier.entries[index] = { kind, target, amount: 0 }
  else if (kind === 'advantage' || kind === 'disadvantage') modifier.entries[index] = { kind, target }
  else if (kind === 'maxVital') modifier.entries[index] = { kind, vital: 'toughness', amount: 0 }
}
</script>
