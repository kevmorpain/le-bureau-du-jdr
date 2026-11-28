export type SheetWindow = 'rail' | 'hitPoints' | 'deathSaves' | 'rest' | 'effects' | 'combatStart'

export type HitPointsMode = 'damage' | 'heal'

// One panel at a time, in state shared by the rail, the phone header and the window host: opening a window
// from the rail's bottom sheet on a phone closes that sheet.
export const useSheetWindows = (characterSheet: Ref<CharacterSheet>) => {
  const { isDying, isDead } = useCharacterSheet(characterSheet)

  const active = useState<SheetWindow | null>(`sheet-windows-${characterSheet.value.id}`, () => null)
  const hitPointsMode = useState<HitPointsMode>(`sheet-windows-hp-mode-${characterSheet.value.id}`, () => 'damage')

  const openModel = (window: SheetWindow) => computed({
    get: () => active.value === window,
    set: (isOpen: boolean) => {
      if (isOpen) active.value = window
      else if (active.value === window) active.value = null
    },
  })

  const open = (window: SheetWindow) => {
    active.value = window
  }

  const openHitPoints = (mode: HitPointsMode) => {
    hitPointsMode.value = mode
    open('hitPoints')
  }

  const openVitals = () => {
    if (isDying.value && !isDead.value) open('deathSaves')
    else openHitPoints('damage')
  }

  return { openModel, open, openHitPoints, openVitals, hitPointsMode: readonly(hitPointsMode) }
}
