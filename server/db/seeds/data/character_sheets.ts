export const characterSheets = [
  {
    name: 'Ambroise',
    speciesId: 2, // TODO: résoudre dynamiquement par nom une fois la seed character_species réactivée
    classes: [
      { classId: 3, level: 6, isMain: true },
      { classId: 11, level: 2, isMain: false },
    ],
    abilityScores: [
      { abilityId: 'str', value: 12 },
      { abilityId: 'dex', value: 14 },
      { abilityId: 'con', value: 13 },
      { abilityId: 'int', value: 13 },
      { abilityId: 'wis', value: 15 },
      { abilityId: 'cha', value: 9 },
    ],
  },
]
