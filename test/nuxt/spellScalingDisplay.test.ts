import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DamageSection from '../../app/components/spells/DamageSection.vue'
import HealSection from '../../app/components/spells/HealSection.vue'
import UpcastSection from '../../app/components/spells/UpcastSection.vue'
import SpellCard from '../../app/components/spells/SpellCard.vue'
import CastSpellModal from '../../app/components/character_sheet/CastSpellModal.vue'

// Garde-fou de rendu pour U10 (docs/fonctionnalites-manquantes.md) : l'affichage d'un sort doit
// dire la même chose que le jet. Les sections rendent le niveau de BASE, et la montée en puissance
// — la table `*_at_slot_level`, dont seule la première ligne était lue — est rendue par
// `UpcastSection`. La résolution elle-même est testée en isolation (test/unit/spellScaling.test.ts).

const magicMissile = {
  id: 1,
  name: 'Projectile magique',
  level: 1,
  damages: [{
    damage_type: 'force',
    damage_at_slot_level: { 1: '3d4+3', 2: '4d4+4', 3: '5d4+5' },
  }],
}

const cureWounds = {
  id: 2,
  name: 'Soin des blessures',
  level: 1,
  heal: {
    heal_type: 'hit_points',
    heal_at_slot_level: { 1: '1d8', 2: '2d8', 3: '3d8' },
    isSpellcastingModifierAdded: true,
  },
}

// Sans emplacement dépensé : la progression par niveau de personnage, elle, suit le personnage.
const eldritchBlast = {
  id: 3,
  name: 'Décharge occulte',
  level: 0,
  damages: [{
    damage_type: 'force',
    damage_at_character_level: { 1: '1d10', 5: '2d10', 11: '3d10' },
  }],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSpell = (spell: object) => spell as any

describe('affichage de la montée en puissance des sorts', () => {
  it('rend les dégâts au niveau de base du sort', async () => {
    const wrapper = await mountSuspended(DamageSection, { props: { spell: asSpell(magicMissile) } })
    expect(wrapper.text()).toContain('3d4+3')
    expect(wrapper.text()).not.toContain('5d4+5')
  })

  it('rend le soin au niveau de base du sort', async () => {
    const wrapper = await mountSuspended(HealSection, { props: { spell: asSpell(cureWounds) } })
    expect(wrapper.text()).toContain('1d8')
  })

  it('liste chaque palier supérieur de la table, et pas seulement sa première ligne', async () => {
    const wrapper = await mountSuspended(UpcastSection, { props: { spell: asSpell(magicMissile) } })
    const text = wrapper.text()
    expect(text).toContain('Aux niveaux supérieurs')
    expect(text).toContain('niv. 2')
    expect(text).toContain('4d4+4')
    expect(text).toContain('niv. 3')
    expect(text).toContain('5d4+5')
  })

  it('n\'affiche aucun encart pour un tour de magie (aucun emplacement dépensé)', async () => {
    const wrapper = await mountSuspended(UpcastSection, { props: { spell: asSpell(eldritchBlast) } })
    expect(wrapper.text()).toBe('')
  })
})

// La carte et la modale sont les deux surfaces où le joueur lit la montée en puissance : la carte
// pour la table complète, la modale au moment où il choisit l'emplacement qu'il va dépenser.
describe('surfaces de lecture', () => {
  const cardSpell = asSpell({
    ...magicMissile,
    castingTime: '1 action',
    range: 36,
    duration: 'Instantanée',
    components: ['V', 'S'],
    description: 'Vous créez trois fléchettes.',
    school: { name: 'Evocation' },
  })

  it('la carte de sort porte l\'encart des niveaux supérieurs', async () => {
    const wrapper = await mountSuspended(SpellCard, {
      props: { spell: cardSpell },
      // UTooltip attend le contexte fourni par `<UApp>`, absent d'un montage isolé.
      global: { stubs: { UTooltip: { template: '<span><slot /></span>' } } },
    })
    expect(wrapper.text()).toContain('Aux niveaux supérieurs')
    expect(wrapper.text()).toContain('5d4+5')
  })

  it('la modale de lancement annonce ce que donne chaque emplacement', async () => {
    const slot = { max: 2, current: 2 }
    const wrapper = await mountSuspended(CastSpellModal, {
      props: {
        spell: cardSpell,
        spellSlots: {
          spellcasting: { 1: slot, 2: slot, 3: slot },
          pact_magic: {},
        },
        open: true,
      },
    })
    const text = document.body.textContent ?? wrapper.text()
    expect(text).toContain('3d4+3')
    expect(text).toContain('5d4+5')
  })
})
