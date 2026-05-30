<template>
  <div
    v-if="maxUses"
    class="flex items-center flex-wrap gap-1.5"
    @click.stop
  >
    <!-- Pastilles de charges -->
    <button
      v-for="i in maxUses"
      :key="i"
      type="button"
      class="size-4 rounded-full border-2 transition-colors"
      :class="i <= currentUses
        ? 'bg-primary/60 border-primary hover:bg-primary/80'
        : 'bg-transparent border-muted hover:border-default'"
      :aria-label="i <= currentUses ? 'Charge dépensée' : 'Charge disponible'"
      @click="toggle(i)"
    />

    <span class="text-xs text-muted font-mono ml-0.5">
      {{ maxUses - currentUses }}/{{ maxUses }}
    </span>

    <UBadge
      v-if="rechargeType"
      :label="rechargeLabel"
      variant="soft"
      size="md"
      class="ml-0.5"
    />

    <!-- Recharge -->
    <template v-if="currentUses > 0">
      <!-- Recharge complète : un clic remet à plein -->
      <UButton
        v-if="!rechargeDice"
        icon="i-heroicons:arrow-path"
        size="xs"
        variant="soft"
        color="primary"
        @click="emitUses(0)"
      >
        Recharger
      </UButton>

      <!-- Recharge partielle : jet de dés (auto ou saisie IRL) -->
      <UPopover v-else v-model:open="popoverOpen">
        <UButton
          icon="i-heroicons:arrow-path"
          size="xs"
          variant="soft"
          color="primary"
        >
          Recharger ({{ rechargeDice }})
        </UButton>

        <template #content>
          <div class="p-3 space-y-3 w-64">
            <p class="text-sm font-medium">
              Recharge — {{ rechargeDice }}
            </p>
            <p class="text-xs text-muted">
              Lance les dés (ou saisis ton jet réel), les charges sont ajoutées
              (max {{ maxUses }}).
            </p>

            <UButton
              icon="i-game-icons:rolling-dices"
              size="sm"
              block
              color="primary"
              @click="rollRecharge"
            >
              Lancer {{ rechargeDice }}
            </UButton>

            <div class="flex items-center gap-2">
              <span class="text-xs text-muted">ou</span>
              <UInput
                v-model.number="manualAmount"
                type="number"
                :min="1"
                :max="maxUses"
                size="sm"
                placeholder="jet IRL"
                class="flex-1"
              />
              <UButton
                size="sm"
                variant="soft"
                :disabled="!manualAmount || manualAmount < 1"
                @click="applyRecharge(manualAmount || 0)"
              >
                Valider
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { InventoryEntry } from '~/composables/character/useCharacterInventory'

const props = defineProps<{
  entry: InventoryEntry
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const emit = defineEmits<{
  'update:currentUses': [value: number]
}>()

const maxUses = computed(() => props.entry.item?.maxUses ?? 0)
const currentUses = computed(() => props.entry.currentUses ?? 0)
const rechargeType = computed(() => props.entry.item?.rechargeType ?? null)
const rechargeDice = computed(() => props.entry.item?.rechargeDice ?? null)

const rechargeLabel = computed(() => ({
  short_rest: 'Repos court',
  long_rest: 'Repos long',
  dawn: 'À l\'aube',
}[rechargeType.value ?? ''] ?? ''))

const popoverOpen = ref(false)
const manualAmount = ref<number | null>(null)

function emitUses(newUses: number) {
  emit('update:currentUses', Math.max(0, Math.min(maxUses.value, newUses)))
}

// Clic sur une pastille : dépense/rend les charges jusqu'à cet index (comme les features).
function toggle(slot: number) {
  emitUses(slot <= currentUses.value ? slot - 1 : slot)
}

// Recharge partielle : ajoute `amount` charges (réduit les charges dépensées).
function applyRecharge(amount: number) {
  if (amount < 1) return
  emitUses(currentUses.value - amount)
  manualAmount.value = null
  popoverOpen.value = false
}

function parseDice(expr: string): { count: number, sides: number, modifier: number } {
  const m = expr.match(/^(\d+)d(\d+)([+-]\d+)?$/)
  if (!m) return { count: 1, sides: 6, modifier: 0 }
  return { count: Number(m[1]), sides: Number(m[2]), modifier: m[3] ? Number(m[3]) : 0 }
}

function rollRecharge() {
  if (!rechargeDice.value) return
  const { count, sides, modifier } = parseDice(rechargeDice.value)
  const label = `Recharge — ${props.entry.item?.name ?? 'objet'}`
  let total: number
  if (props.roll) {
    total = props.roll(label, modifier, sides, count)
  }
  else {
    total = modifier
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1
  }
  applyRecharge(total)
}
</script>
