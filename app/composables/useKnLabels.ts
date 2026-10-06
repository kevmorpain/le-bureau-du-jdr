import type { KnSourceLabel } from '~~/shared/ker-nethalas/effects'

export function useKnLabels() {
  const { t } = useI18n()

  const labelText = (label: KnSourceLabel): string => {
    if (label.text !== undefined) return label.text

    const params = Object.fromEntries(
      Object.entries(label.params ?? {}).map(([name, value]) => [
        name,
        typeof value === 'string' && value.startsWith('ker_nethalas.') ? t(value) : value,
      ]),
    )
    return t(label.key!, params)
  }

  const signed = (amount: number) => amount > 0 ? `+${amount}` : `${amount}`

  return { labelText, signed }
}
