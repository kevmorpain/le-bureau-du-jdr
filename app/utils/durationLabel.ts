export const countdownLabel = ({ rounds, remaining }: { rounds: number, remaining: number }): string =>
  remaining === 0
    ? 'Expiré'
    : `Reste ${remaining} round${remaining > 1 ? 's' : ''} sur ${rounds}`
