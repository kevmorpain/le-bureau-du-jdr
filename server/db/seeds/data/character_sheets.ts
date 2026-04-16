export const characterSheets = [
  {
    name: 'Ambroise',
    speciesId: 2, // Nain des collines (ID 2 dans l'ordre de seed character_species)
    classes: [
      { classId: 11, level: 10, isMain: true }, // Occultiste (ID 11 dans l'ordre de seed classes)
    ],
    abilityScores: [
      { abilityId: 'str', value: 12 },
      { abilityId: 'dex', value: 14 },
      { abilityId: 'con', value: 13 },
      { abilityId: 'int', value: 13 },
      { abilityId: 'wis', value: 15 },
      { abilityId: 'cha', value: 9 },
    ],
    // Occultiste : jets de sauvegarde SAG + CHA
    skills: [
      { skillKey: 'wis_save', proficiencyLevel: 'proficient' as const, source: 'class' as const },
      { skillKey: 'cha_save', proficiencyLevel: 'proficient' as const, source: 'class' as const },
    ],
    // Features liées dynamiquement par le seed (nécessite que warlock seed ait été exécuté)
    className: 'Occultiste',
    subclassName: 'Grand Ancien',
    classLevel: 10,
  },
]
