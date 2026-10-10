<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Fin de combat
      </h2>
      <p class="text-sm text-muted">
        Remet à zéro les aptitudes « une fois par combat ». Une victoire donne aussi l'expérience du livre et les gains de vos
        Maîtrises.
      </p>
    </template>

    <div class="flex flex-wrap gap-3">
      <UButton @click="win('combat')">
        Combat remporté (+{{ KN_COMBAT_XP.combat }} XP)
      </UButton>
      <UButton
        variant="soft"
        @click="win('overseer')"
      >
        Overseer vaincu (+{{ KN_COMBAT_XP.overseer }} XP)
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        @click="endCombat"
      >
        Combat terminé sans victoire
      </UButton>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_COMBAT_XP, knApplySelfEffects, knCombatWonEffects } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

const props = defineProps<{
  masteries: KnMastery[] | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()

const endCombat = () => {
  character.value.status = knResetUses(character.value.status, ['combat'])
}

// Le trait d'une Maîtrise vaut « pour chaque rencontre de combat vaincue » : l'Overseer, rencontre à part dans la liste de
// l'expérience du livre, n'en déclenche pas (hypothèse).
function win(kind: keyof typeof KN_COMBAT_XP) {
  const c = character.value
  c.xp = Math.min(KN_BOUNDS.xp.max, c.xp + KN_COMBAT_XP[kind])

  const effects = kind === 'combat' && props.masteries
    ? knCombatWonEffects(props.masteries, knMasteryEntries(c.masteryPicks, c.amulets))
    : []
  if (effects.length) {
    const { state } = knApplySelfEffects(effects, {
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
    c.toughnessCurrent = state.toughness
    c.healthCurrent = state.health
    c.sanityCurrent = state.sanity
    c.aetherCurrent = state.aether
    c.status = state.status
  }

  endCombat()
  toast.add({
    title: kind === 'combat' ? 'Combat remporté' : 'Overseer vaincu',
    description: `+${KN_COMBAT_XP[kind]} XP${effects.length ? ' · gains de Maîtrise appliqués' : ''}`,
    color: 'success',
  })
}
</script>
