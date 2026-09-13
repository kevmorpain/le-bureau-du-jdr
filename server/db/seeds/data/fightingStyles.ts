import type { FeatureDef, ProgressionDef } from '../lib/seedClass'
import type { Effect } from '../../schema/effects'

// ─────────────────────────────────────────────────────────────────────────────
// Styles de combat — point de choix `progression` commun aux classes martiales (F2, même
// principe que la sous-classe et les invocations).
//
// « Décision → choix » (rules-engine.md §3/§4) : chaque style est une feature-OPTION
// (`feature_type='fighting_style'`, taguée `fighting_style`), et la feature « Style de combat »
// de la classe porte la `progression` `kind:'fighting_style'` (`optionSource:{feature_group}`).
// Le style CHOISI est matérialisé sur la fiche (comme une invocation) ; les autres restent au
// catalogue.
//
// Décision (utilisateur) : les options sont DUPLIQUÉES par classe (une feature « Défense » par
// classe qui la propose) plutôt que partagées, car chaque classe offre un sous-ensemble différent
// (Guerrier 6, Paladin 4, Rôdeur 4) et `buildCatalog` filtre `feature_group` par classe propriétaire.
//
// Source : PHB FR 2014 / https://www.aidedd.org/regles/. Le Rôdeur inclut **Duel** (le blob front
// `app/data/character-builder.ts` l'omettait — bug corrigé quand le front lira le catalogue).
//
// Aucune dépendance runtime `hub:db` (imports de type seuls) → testable en unit.
// ─────────────────────────────────────────────────────────────────────────────

/** Discriminant du style, consommé par la fiche (effet `fighting_style_modifier`). */
export type FightingStyleKind = 'archery' | 'two_weapon' | 'defense' | 'dueling' | 'great_weapon' | 'protection'

interface FightingStyleDef {
  kind: FightingStyleKind
  name: string
  description: string
}

/** Les 6 styles du PHB 2014 (nom d'affichage + texte de règle). */
export const FIGHTING_STYLE_DEFS: FightingStyleDef[] = [
  { kind: 'archery', name: 'Archerie', description: '+2 aux jets d\'attaque avec les armes à distance.' },
  { kind: 'two_weapon', name: 'Combat à deux armes', description: 'Quand vous combattez avec deux armes, vous pouvez ajouter votre modificateur de caractéristique aux dégâts de la seconde attaque (arme légère).' },
  { kind: 'defense', name: 'Défense', description: '+1 à la CA quand vous portez une armure.' },
  { kind: 'dueling', name: 'Duel', description: '+2 aux jets de dégâts quand vous maniez une arme de corps à corps à une main sans autre arme.' },
  { kind: 'great_weapon', name: 'Grande arme', description: 'Relancez un 1 ou un 2 obtenu sur un dé de dégâts d\'une arme de corps à corps à deux mains ou polyvalente (gardez le nouveau résultat).' },
  { kind: 'protection', name: 'Protection', description: 'Réaction : quand une créature attaque une cible autre que vous à portée, imposez le désavantage à ce jet d\'attaque (bouclier requis).' },
]

/** Sous-ensemble de styles offert par chaque classe (par NOM de classe en base, PHB 2014). */
export const FIGHTING_STYLES_BY_CLASS: Record<string, FightingStyleKind[]> = {
  Guerrier: ['archery', 'two_weapon', 'defense', 'dueling', 'great_weapon', 'protection'],
  Paladin: ['defense', 'dueling', 'great_weapon', 'protection'],
  Rôdeur: ['archery', 'two_weapon', 'defense', 'dueling'],
}

/** Niveau d'accès au style de combat par classe (= `levelRequired` de la feature owner). */
export const FIGHTING_STYLE_LEVEL_BY_CLASS: Record<string, number> = {
  Guerrier: 1,
  Paladin: 2,
  Rôdeur: 2,
}

/** Nom de la feature de classe qui ouvre le choix de style (porte la progression). */
export const FIGHTING_STYLE_OWNER_NAME = 'Style de combat'

/** Progression `kind:'fighting_style'` posée sur la feature owner « Style de combat ». */
export const fightingStyleProgression: ProgressionDef = {
  kind: 'fighting_style',
  count: { op: 'fixed', value: 1 },
  optionSource: { type: 'feature_group', group: 'fighting_style' },
  replaceable: false,
}

const defByKind = new Map(FIGHTING_STYLE_DEFS.map(d => [d.kind, d]))

/**
 * Features-options du style de combat pour une classe (`feature_type='fighting_style'`, taguées,
 * chacune portant son effet `fighting_style_modifier`). Injectées par `seedClass` — jamais
 * matérialisées par les sweeps (comme les invocations). `[]` si la classe n'a pas de style.
 */
export function fightingStyleOptionFeatures(className: string): FeatureDef[] {
  const kinds = FIGHTING_STYLES_BY_CLASS[className]
  if (!kinds) return []
  return kinds.map((kind): FeatureDef => {
    const def = defByKind.get(kind)!
    return {
      name: def.name,
      description: def.description,
      featureType: 'fighting_style',
      tag: 'fighting_style',
      effects: [{ type: 'fighting_style_modifier', value: { kind } } as Effect],
    }
  })
}
