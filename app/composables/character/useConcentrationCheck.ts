import type { RollFn } from '../useDiceRoller'
import { concentrationSaveDc } from '~~/shared/rules/damage'

export interface ConcentrationCheck {
  damage: number
  dc: number
}

// The pending saves live in shared state so the window that applied the damage and the one that asks for the save agree.
export const useConcentrationCheck = (characterSheet: Ref<CharacterSheet>) => {
  const { t } = useI18n()
  const toaster = useToast()
  const { isConcentrating, concentrationName, setConcentration, savingThrows } = useCharacterSheet(characterSheet)

  const queue = useState<number[]>(`concentration-checks-${characterSheet.value.id}`, () => [])

  const current = computed<ConcentrationCheck | null>(() => {
    const damage = queue.value[0]
    return damage === undefined || !isConcentrating.value ? null : { damage, dc: concentrationSaveDc(damage) }
  })

  const saveModifier = computed(() => savingThrows.value.con?.modifier ?? 0)

  const enqueue = (damages: number[]) => {
    queue.value = [...queue.value, ...damages.filter(damage => damage > 0)]
  }

  const breakConcentration = (reason?: string) => {
    const name = concentrationName.value
    setConcentration(null)
    queue.value = []
    toaster.add({
      title: t('hit_points.concentration.lost'),
      description: [name ? t('hit_points.concentration.lost_spell', { name }) : null, reason].filter(Boolean).join(' ') || undefined,
      color: 'error',
    })
  }

  const dismiss = () => {
    queue.value = queue.value.slice(1)
  }

  const succeed = () => {
    dismiss()
    toaster.add({ title: t('hit_points.concentration.kept'), color: 'success' })
  }

  const fail = () => breakConcentration()

  const rollSave = (roll: RollFn) => {
    const check = current.value
    if (!check) return null
    const result = roll(
      t('hit_points.concentration.roll_label', { dc: check.dc }),
      saveModifier.value,
      20,
      1,
      { d20: { type: 'save', ability: 'con', situations: ['concentration', 'concentration_after_damage'] } },
    )
    if (result >= check.dc) succeed()
    else fail()
    return result
  }

  return { current, saveModifier, enqueue, dismiss, succeed, fail, rollSave, breakConcentration }
}
