import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { resolveKnSheet } from '~~/shared/ker-nethalas/resolve'

export function useKnResolved(character: Ref<KnCharacter | undefined | null>) {
  return computed(() => {
    const c = character.value
    if (!c) return null

    return resolveKnSheet({
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
