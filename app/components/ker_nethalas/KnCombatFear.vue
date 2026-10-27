<template>
  <div
    v-if="fear && !fear.resolved"
    class="space-y-2 rounded-md border border-warning p-3"
  >
    <p class="font-medium">
      Créature {{ fear.loss >= KN_FEAR_LOSS.horrifying ? 'Terrifiante' : 'Effrayante' }} : test de Résolution
    </p>
    <p class="text-sm text-muted">
      À faire au début du combat, une seule fois pour toute la rencontre. Un échec coûte {{ fear.loss }} Santé mentale.
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        size="sm"
        :variant="checkOpen ? 'solid' : 'outline'"
        icon="i-heroicons:cube"
        @click="checkOpen = !checkOpen"
      >
        Tester
      </UButton>
      <UButton
        size="sm"
        variant="soft"
        @click="finish(true)"
      >
        Réussi
      </UButton>
      <UButton
        size="sm"
        color="error"
        variant="outline"
        @click="finish(false)"
      >
        Raté : −{{ fear.loss }} Santé mentale
      </UButton>
    </div>
    <KnInlineCheck
      v-if="checkOpen"
      :request="{ id: 'resistance:resolve', difficulty: 'normal', note: 'Résister à la peur' }"
      @rolled="finish"
      @close="checkOpen = false"
    />
  </div>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_FEAR_LOSS } from '~~/shared/ker-nethalas/creatures'
import { knResolveCombatFear } from '~~/shared/ker-nethalas/run'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { applyEffects } = useKnApplyEffects(character, () => props.resolved)
const toast = useToast()

const fear = computed(() => character.value.run.combat?.fear)
const checkOpen = ref(false)

function finish(success: boolean) {
  const loss = fear.value?.loss
  if (!loss) return
  if (!success) applyEffects([{ kind: 'vital', vital: 'sanity', dice: { count: 0, sides: 0, bonus: loss }, sign: 'loss' }], 'Peur')
  else toast.add({ title: 'Peur', description: 'Test de Résolution réussi : aucune perte.', color: 'success' })
  character.value.run = knResolveCombatFear(character.value.run)
  checkOpen.value = false
}
</script>
