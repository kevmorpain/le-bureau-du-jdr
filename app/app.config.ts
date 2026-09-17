export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'purple',
      neutral: 'zinc',
      warning: 'orange',
      // Couleurs par classe : alias vers des palettes Tailwind distinctes.
      barbarian: 'red',
      bard: 'amber',
      cleric: 'lime',
      druid: 'green',
      fighter: 'rose',
      monk: 'purple',
      paladin: 'yellow',
      ranger: 'emerald',
      rogue: 'zinc',
      sorcerer: 'orange',
      warlock: 'violet',
      wizard: 'blue',
    },

    input: {
      slots: {
        root: 'w-full',
      },
    },

    inputNumber: {
      slots: {
        base: 'field-sizing-content',
      },
    },

    textarea: {
      slots: {
        root: 'w-full',
      },
    },

    select: {
      slots: {
        base: 'w-full',
      },
    },
  },
})
