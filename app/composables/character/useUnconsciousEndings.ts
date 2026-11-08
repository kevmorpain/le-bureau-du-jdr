import { useClassResources } from './useClassResources'

// Une capacité active qui prend fin à l'inconscience (Rage) s'arrête dès que le personnage y tombe, quelle que soit la façon :
// dégâts, PV saisis à la main, état Inconscient.
export const useUnconsciousEndings = (
  characterSheet: Ref<CharacterSheet>,
  { unconscious, ending }: { unconscious: Ref<boolean>, ending: Ref<{ id: number, name: string }[]> },
) => {
  const toaster = useToast()
  const { setActive } = useClassResources(characterSheet)

  watch(unconscious, async (now) => {
    if (!now) return
    const ended = ending.value.map(({ id, name }) => ({ id, name }))
    if (!ended.length) return
    for (const { id } of ended) await setActive(id, false, undefined)
    toaster.add({
      title: `${ended.map(e => e.name).join(', ')} : terminée`,
      description: 'Vous êtes inconscient.',
      color: 'warning',
      actions: [{
        label: 'Rétablir (sans coût)',
        color: 'neutral',
        variant: 'outline',
        onClick: () => { for (const { id } of ended) void setActive(id, true, undefined) },
      }],
    })
  })
}
