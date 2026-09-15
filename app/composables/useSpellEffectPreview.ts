import { slotScalingEntries, type ScalableSpell } from '~~/shared/rules/spellScaling'

/**
 * Libellé de ce qu'un sort donne à un niveau d'emplacement donné (« 5d4+5 force », « 3d8 points de
 * vie récupérés », « 3 × Rayon »). Partagé par les deux modales qui font choisir un niveau —
 * `CastSpellModal` (l'emplacement qu'on dépense) et `RollDamageModal` (le niveau auquel on jette
 * les dégâts) — pour que le même choix se lise de la même façon aux deux endroits.
 *
 * Le modificateur d'incantation n'est PAS ajouté : il est déjà rendu sur la fiche (« + mod »), et
 * l'afficher ici ferait croire à un second bonus.
 */
export const useSpellEffectPreview = () => {
  const { t } = useI18n()

  const previewAt = (spell: ScalableSpell, slotLevel: number): string =>
    slotScalingEntries(spell, slotLevel)
      .map((entry) => {
        if (entry.kind === 'attacks') return `${entry.count} × ${entry.label}`
        const count = isNumeric(entry.die) ? Number(entry.die) : 0
        const type = entry.kind === 'damage'
          ? t(`damage_types.${entry.damageType}`, count)
          : t(`heal_types.${entry.healType}`, count)
        return `${entry.die} ${type}`
      })
      .join(' + ')

  return { previewAt }
}
