import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { knEquipmentSources } from '~~/shared/ker-nethalas/equipment'
import { knMagicProvidesLight, knMagicSources } from '~~/shared/ker-nethalas/magicEffects'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knMasteryProvidesLight, knMasterySources } from '~~/shared/ker-nethalas/masteryEffects'
import { resolveKnSheet } from '~~/shared/ker-nethalas/resolve'

export function useKnResolved(character: Ref<KnCharacter | undefined | null>, masteries: Ref<KnMastery[] | null>) {
  return computed(() => {
    const c = character.value
    if (!c) return null

    const entries = masteries.value ? knMasteryEntries(c.masteryPicks, c.amulets) : []
    const sustained = c.status.sustained ?? []

    return resolveKnSheet({
      extraSources: [...(masteries.value ? knMasterySources(masteries.value, entries, sustained) : []), ...knEquipmentSources(c.inventory), ...knMagicSources(c.inventory)],
      lightProvided: (masteries.value ? knMasteryProvidesLight(masteries.value, entries, sustained) : false) || knMagicProvidesLight(c.inventory),
      skills: c.skills,
      extraSkills: c.extraSkills,
      resistances: c.resistances,
      exhaustion: c.exhaustion,
      maxVitals: { health: c.healthMax, toughness: c.toughnessMax, aether: c.aetherMax, sanity: c.sanityMax },
      status: c.status,
      run: c.run,
    })
  })
}
