import type { LineageSpeciesData } from '../lib/seedLineages'
import { elf } from './elf'
import { dwarf } from './dwarf'
import { halfling } from './halfling'
import { gnome } from './gnome'
import { tiefling } from './tiefling'
import { dragonborn } from './dragonborn'

// Ajouter une espèce au rollout = 1 fichier `data/<espèce>.ts` + 1 entrée ici.
export const LINEAGE_SPECIES: LineageSpeciesData[] = [
  elf,
  dwarf,
  halfling,
  gnome,
  tiefling,
  dragonborn,
]
