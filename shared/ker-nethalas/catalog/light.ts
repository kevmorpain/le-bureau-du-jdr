import type { KnActiveSource } from '../effects'
import { KN_CONDITIONS } from './conditions'

// Sans source de lumière : Aveuglé, avec un test de Résolution par salle sous peine de perdre 1 de Santé mentale.
export const knNoLightSource = (): KnActiveSource => ({
  id: 'light',
  label: { key: 'ker_nethalas.sources.noLight' },
  effects: KN_CONDITIONS.blinded.effects(0),
  reminders: [
    { label: { key: 'ker_nethalas.conditions.blinded.reminder' }, severity: 'info' },
    { label: { key: 'ker_nethalas.reminders.noLight' }, severity: 'warning' },
  ],
})
