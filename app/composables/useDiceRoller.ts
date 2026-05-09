export interface DiceRoll {
  id: number
  label: string
  rolls: number[]
  natural: number
  modifier: number
  result: number
  isCrit: boolean
  isFumble: boolean
}

export const useDiceRoller = () => {
  const toasts = useState<DiceRoll[]>('dice-toasts', () => [])

  const roll = (label: string, modifier: number, sides = 20, count = 1): number => {
    const rolls = Array.from({ length: count }, () => Math.ceil(Math.random() * sides))
    const natural = rolls.reduce((a, b) => a + b, 0)
    const result = natural + modifier
    const isCrit = sides === 20 && count === 1 && natural === 20
    const isFumble = sides === 20 && count === 1 && natural === 1

    const toast: DiceRoll = {
      id: Date.now() + Math.random(),
      label,
      rolls,
      natural,
      modifier,
      result,
      isCrit,
      isFumble,
    }

    toasts.value = [...toasts.value.slice(-4), toast]
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== toast.id)
    }, 4500)

    return result
  }

  return { toasts, roll }
}
