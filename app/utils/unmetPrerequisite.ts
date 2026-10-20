import { ABILITY_SHORT } from '~/data/character-builder'
import type { UnmetPrerequisite } from '~~/shared/rules/resolve'
import type { PactBoon } from '~~/shared/rules/pactBoon'

export const PACT_BOON_LABELS: Record<PactBoon, string> = { chain: 'Chaîne', blade: 'Lame', tome: 'Tome' }

const ARMOR_LABELS = { light: 'légère', medium: 'intermédiaire', heavy: 'lourde' } as const

/** Ce qu'il manque à une option, tel que le joueur le lit sous sa carte. */
export function unmetPrerequisiteLabel(unmet: UnmetPrerequisite): string {
  switch (unmet.type) {
    case 'level': return `Niveau ${unmet.level} de la classe requis`
    case 'pact_boon': return `Pacte de la ${PACT_BOON_LABELS[unmet.pactBoon]} requis`
    case 'spell': return `Sort « ${unmet.name} » requis`
    case 'invocation': return `Manifestation « ${unmet.name} » requise`
    case 'ability_score': return `${unmet.abilities.map(a => ABILITY_SHORT[a]).join(' ou ')} ${unmet.score} requis`
    case 'armor_proficiency': return `Maîtrise des armures ${ARMOR_LABELS[unmet.armor]}s requise`
    case 'spellcasting': return 'Capacité de lancer des sorts requise'
  }
}
