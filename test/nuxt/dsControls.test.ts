import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DsSegmented from '../../app/components/ds/DsSegmented.vue'
import DsChips from '../../app/components/ds/DsChips.vue'
import DsCounter from '../../app/components/ds/DsCounter.vue'
import DsCheckbox from '../../app/components/ds/DsCheckbox.vue'
import DsNumberField from '../../app/components/ds/DsNumberField.vue'
import DsSelectField from '../../app/components/ds/DsSelectField.vue'
import DsTextField from '../../app/components/ds/DsTextField.vue'
import DsDeathSaves from '../../app/components/ds/DsDeathSaves.vue'
import DsHitDie from '../../app/components/ds/DsHitDie.vue'

const modes = [
  { value: 'damage', label: 'Dégâts' },
  { value: 'heal', label: 'Soins' },
  { value: 'temp', label: 'PV temporaires' },
]

describe('barre segmentée — choix exclusif', () => {
  it('expose un groupe radio dont seul le choix courant est coché', async () => {
    const wrapper = await mountSuspended(DsSegmented, { props: { options: modes, label: 'Mode', modelValue: 'heal' } })

    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Mode')
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.map(r => r.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
    expect(radios.map(r => r.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('un toucher sélectionne le segment', async () => {
    const wrapper = await mountSuspended(DsSegmented, { props: { options: modes, label: 'Mode', modelValue: 'damage' } })

    await wrapper.findAll('[role="radio"]')[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['temp']])
  })

  it('les flèches passent au segment voisin, en bouclant', async () => {
    const wrapper = await mountSuspended(DsSegmented, { props: { options: modes, label: 'Mode', modelValue: 'damage' } })

    await wrapper.findAll('[role="radio"]')[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['temp']])
  })
})

describe('puces — choix multiple', () => {
  const conditions = [
    { value: 'poisoned', label: 'Empoisonné' },
    { value: 'prone', label: 'À terre' },
    { value: 'frightened', label: 'Effrayé' },
  ]

  it('chaque puce se coche et se décoche sans toucher aux autres', async () => {
    const wrapper = await mountSuspended(DsChips, { props: { options: conditions, label: 'États', modelValue: ['poisoned'] } })
    const chips = wrapper.findAll('button')
    expect(chips.map(c => c.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])

    await chips[2]!.trigger('click')
    await chips[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['poisoned', 'frightened']], [['frightened']]])
  })
})

describe('compteur en cases', () => {
  it('affiche « 2 sur 6 » et une case par unité', async () => {
    const wrapper = await mountSuspended(DsCounter, { props: { label: 'Épuisement', max: 6, modelValue: 2, showCount: true } })

    expect(wrapper.text()).toContain('2 sur 6')
    const cells = wrapper.findAll('button')
    expect(cells).toHaveLength(6)
    expect(cells.map(c => c.attributes('aria-pressed'))).toEqual(['true', 'true', 'false', 'false', 'false', 'false'])
    expect(wrapper.get('[role="group"]').attributes('aria-labelledby')).toBeTruthy()
  })

  it('toucher une case remplit jusqu’à elle ; toucher la dernière pleine la vide', async () => {
    const wrapper = await mountSuspended(DsCounter, { props: { max: 3, modelValue: 2, ariaLabel: 'Emplacements' } })
    const cells = wrapper.findAll('button')

    await cells[2]!.trigger('click')
    await cells[2]!.trigger('click')
    await cells[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[3], [2], [1]])
  })

  it('montre les cases rendues puis les cases possibles', async () => {
    const wrapper = await mountSuspended(DsCounter, { props: { max: 4, modelValue: 2, regained: 1, possible: 1, readonly: true, ariaLabel: 'Emplacements' } })

    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.findAll('[data-state]').map(c => c.attributes('data-state'))).toEqual(['filled', 'regained', 'possible', 'empty'])
  })
})

describe('case à cocher losange', () => {
  it('repose sur une vraie case à cocher, liée à son libellé', async () => {
    const wrapper = await mountSuspended(DsCheckbox, { props: { label: 'A mangé et bu', modelValue: false } })

    expect(wrapper.text()).toContain('A mangé et bu')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('filled')
  })
})

describe('champs', () => {
  it('nombre : émet un nombre, null quand le champ est vidé, et signale une valeur hors bornes', async () => {
    const wrapper = await mountSuspended(DsNumberField, { props: { label: 'Dégâts', min: 0, modelValue: 9 } })
    const input = wrapper.get('input')
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('aria-label')).toBe('Dégâts')

    await input.setValue('12')
    await input.setValue('')
    expect(wrapper.emitted('update:modelValue')).toEqual([[12], [null]])

    const outOfRange = await mountSuspended(DsNumberField, { props: { label: 'Dégâts', min: 0, modelValue: -1 } })
    expect(outOfRange.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('menu : rend la valeur typée de l’option choisie', async () => {
    const options = [{ value: 1, label: 'Tranchant' }, { value: 2, label: 'Perforant' }]
    const wrapper = await mountSuspended(DsSelectField, { props: { label: 'Type de dégâts', options, modelValue: 1 } })

    await wrapper.get('select').setValue('2')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
  })

  it('texte libre : v-model sur le texte saisi', async () => {
    const wrapper = await mountSuspended(DsTextField, { props: { label: 'Effet', modelValue: '' } })

    await wrapper.get('input').setValue('Bénédiction')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Bénédiction']])
  })
})

describe('jets contre la mort', () => {
  it('succès et échecs se cochent séparément', async () => {
    const wrapper = await mountSuspended(DsDeathSaves, { props: { successes: 1, failures: 0 } })
    const success = wrapper.findAll('button').filter(b => b.attributes('aria-label')?.includes('succès'))
    const failure = wrapper.findAll('button').filter(b => b.attributes('aria-label')?.includes('échec'))

    expect(success.map(b => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    await success[1]!.trigger('click')
    await failure[0]!.trigger('click')
    expect(wrapper.emitted('update:successes')).toEqual([[2]])
    expect(wrapper.emitted('update:failures')).toEqual([[1]])
  })
})

describe('dé de vie', () => {
  it('affiche le dé, puis le résultat une fois choisi ; un dé dépensé est inactif', async () => {
    const available = await mountSuspended(DsHitDie, { props: { die: 'd8' } })
    expect(available.text()).toBe('d8')
    expect(available.attributes('aria-label')).toBe('Dé de vie d8 à dépenser')

    const chosen = await mountSuspended(DsHitDie, { props: { die: 'd8', chosen: true, value: 5 } })
    expect(chosen.text()).toBe('5')
    expect(chosen.attributes('aria-pressed')).toBe('true')

    const spent = await mountSuspended(DsHitDie, { props: { die: 'd8', spent: true } })
    expect(spent.attributes('disabled')).toBeDefined()
  })
})
