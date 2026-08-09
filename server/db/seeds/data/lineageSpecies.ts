import type { LineageSpeciesData } from '../lib/seedLineages'
import { elf } from './elf'
import { dwarf } from './dwarf'
import { halfling } from './halfling'
import { gnome } from './gnome'
import { tiefling } from './tiefling'
import { dragonborn } from './dragonborn'

/**
 * Registre des espèces « base + lignées » (chantier lignée, D17). Le seed générique
 * (`seedLineages`, via le wrapper `lineages.ts` / `?only=lineages`) itère cette liste. Ajouter une
 * espèce au rollout = 1 fichier `data/<espèce>.ts` + 1 entrée ici. Ordre indifférent (chaque espèce
 * est indépendante ; idempotent).
 */
export const LINEAGE_SPECIES: LineageSpeciesData[] = [
  elf,
  dwarf,
  halfling,
  gnome,
  tiefling,
  dragonborn,
]
