export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'purple',
      neutral: 'zinc',
      warning: 'orange',
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
