export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task'
  },
  async run() {
    console.log('Running DB seed task...')
    const spells = [
      {
        name: 'Aide',
        level: 2,
        castingTime: '1 action',
        range: 9,
        components: 'V, S, M (un petit bout de vêtement blanc)',
        duration: '8 heures',
        description: `
          Votre sort emplit vos alliés de robustesse et de résolution. Choisissez jusqu'à trois créatures à portée. Le maximum de points de vie et les points de vie actuels de chaque cible augmentent de 5 pour la durée du sort.
          Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les points de vie de chaque cible augmentent de 5 pour chaque niveau d'emplacement au-delà du niveau 2.
        `,
      },
      {
        name: 'Lumière',
        level: 0,
        castingTime: '1 action',
        range: 1.5,
        components: 'V, S, M (une luciole ou de la mousse phosphorescente)',
        duration: '1 heure',
        description: `
          Vous touchez un objet qui ne dépasse pas 3 mètres dans toutes les dimensions. Jusqu'à la fin du sort, l'objet émet une lumière vive dans un rayon de 6 mètres et une lumière faible sur 6 mètres supplémentaires. La lumière est de la couleur que vous voulez. Couvrir complètement l'objet avec quelque chose d'opaque bloque la lumière. Le sort se termine si vous le lancez de nouveau ou si vous le dissipez par une action.
          Si vous ciblez un objet tenu ou porté par une créature hostile, cette créature doit réussir un jet de sauvegarde de Dextérité pour éviter le sort.
        `,
      }
    ]
    await useDrizzle().insert(tables.spells).values(spells)
    return { result: 'success' }
  }
})