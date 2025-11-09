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
        root: 'w-full',
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
