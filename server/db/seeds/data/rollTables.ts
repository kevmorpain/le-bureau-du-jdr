import type { Ruleset } from '~~/shared/rules/ruleset'
import type { RollTable, RollTableKey } from '~~/shared/rules/rollTables'

export type RollTableDef = RollTable & {
  key: RollTableKey
  ruleset?: Ruleset
}

export const rollTables: RollTableDef[] = [
  {
    // https://www.aidedd.org/regles/classes/ensorceleur/ — texte repris tel quel.
    key: 'wild_magic_surge',
    name: 'Pic de magie sauvage',
    die: 100,
    entries: [
      { min: 1, max: 2, text: 'Au début de vos prochains tours, refaites un jet de Pic de magie sauvage (ignorez ce résultat sur des jets consécutifs). Cet effet dure une minute.' },
      { min: 3, max: 4, text: 'Pendant une minute, vous pouvez voir toutes les créatures invisibles tant qu\'elles sont dans votre champs de vision.' },
      { min: 5, max: 6, text: 'Un modron (créature artificielle) choisi et contrôlé par le MD apparaît dans un espace inoccupé à 1,50 mètre de vous. Il disparaît une minute plus tard.' },
      { min: 7, max: 8, text: 'Vous lancez le sort boule de feu de niveau 3 centré sur vous.' },
      { min: 9, max: 10, text: 'Vous lancez un sort projectile magique de niveau 5.' },
      { min: 11, max: 12, text: 'Lancez un d10. Votre taille varie de 2,50 cm x le résultat du jet. Si le résultat est paire vous grandissez, s\'il est impair, vous rapetissez.' },
      { min: 13, max: 14, text: 'Vous lancez le sort confusion centré sur vous-même.' },
      { min: 15, max: 16, text: 'Pendant une minute, vous regagnez 5 points de vie au début de chacun de vos tours.' },
      { min: 17, max: 18, text: 'Une longue barbe faite de plumes vous pousse soudainement. Celle-ci s\'évanouit dans un nuage de plumes lorsque vous éternuez.' },
      { min: 19, max: 20, text: 'Vous lancez le sort graisse centré sur vous-même.' },
      { min: 21, max: 22, text: 'Les créatures ont un désavantage à leur jets de sauvegarde contre le prochain sort que vous lancez dans la minute qui suit.' },
      { min: 23, max: 24, text: 'Votre peau devient bleu. Un sort de délivrance des malédictions peut mettre fin à cet effet.' },
      { min: 25, max: 26, text: 'Un oeil apparaît sur votre front pendant une minute. Pendant cette durée, vous avez un avantage à vos jets de Sagesse (Perception) qui se basent sur la vue.' },
      { min: 27, max: 28, text: 'Pendant une minute, tout vos sorts dont le temps d\'incantation est d\'1 action ont un temps d\'incantation d\'1 action bonus.' },
      { min: 29, max: 30, text: 'Vous vous téléportez à 18 mètres dans un espace inoccupé que vous pouvez voir.' },
      { min: 31, max: 32, text: 'Vous êtes transporté dans le Plan Astral jusqu\'à la fin de votre prochain tour, après quoi vous retournez à votre position d\'origine, dans l\'espace inoccupé le plus proche.' },
      { min: 33, max: 34, text: 'Le prochain sort que vous lancez dans la minute qui suit fait le maximum de dégâts.' },
      { min: 35, max: 36, text: 'Lancez un d10. Votre âge varie d\'un nombre d\'années équivalent au résultat du jet. Si le résultat est pair, vous vieillissez, sinon vous rajeunissez (minimum 1 an).' },
      { min: 37, max: 38, text: '1d6 flumphs contrôlés par le MD apparaissent dans un périmètre de 18 mètres et ont peur de vous. Ils disparaissent au bout d\'une minute.' },
      { min: 39, max: 40, text: 'Vous regagnez 2d10 points de vie.' },
      { min: 41, max: 42, text: 'Vous vous transformez en plante en pot jusqu\'au début de votre prochain tour. Sous cette forme, vous êtes incapable d\'agir et avez la vulnérabilité à tous les types de dégâts. Si vous tombez à 0 point de vie, votre pot casse et vous retrouvez votre forme d\'origine.' },
      { min: 43, max: 44, text: 'Pendant une minute, vous pouvez utiliser à chaque tour votre action bonus pour vous téléporter dans un rayon de 6 mètres.' },
      { min: 45, max: 46, text: 'Vous lancez le sort lévitation sur vous.' },
      { min: 47, max: 48, text: 'Une licorne contrôlée par le MD apparaît à 1,50 mètre de vous puis disparaît une minute plus tard.' },
      { min: 49, max: 50, text: 'Vous ne pouvez plus parler pendant une minute. Chaque fois que vous essayez, des bulles roses sortent de votre bouche.' },
      { min: 51, max: 52, text: 'Un bouclier spectral vous entoure pendant une minute, vous faisant bénéficier d\'un bonus de +2 à la CA et de l\'immunité au sort projectile magique.' },
      { min: 53, max: 54, text: 'Vous êtes immunisé à l\'intoxication par l\'alcool pour les 5d6 prochains jours.' },
      { min: 55, max: 56, text: 'Vos cheveux tombent puis repoussent progressivement durant les prochaines 24 h.' },
      { min: 57, max: 58, text: 'Pour la prochaine minute, tout objet inflammable que vous touchez qui n\'est ni porté ni équipé par une autre créature prend feu.' },
      { min: 59, max: 60, text: 'Vous regagnez votre emplacement de sort dépensé le plus faible.' },
      { min: 61, max: 62, text: 'Pendant une minute, vous criez lorsque vous essayez de parler.' },
      { min: 63, max: 64, text: 'Vous lancez le sort nappe de brouillard centré sur vous-même.' },
      { min: 65, max: 66, text: 'Jusqu\'à 3 créatures, que vous choisissez, situées à 9 mètres ou moins de vous, prennent 4d10 dégâts de foudre.' },
      { min: 67, max: 68, text: 'Vous êtes effrayé par la créature la plus proche de vous jusqu\'à la fin de votre prochain tour.' },
      { min: 69, max: 70, text: 'Toutes les créatures dans un rayon de 9 mètres deviennent invisibles pendant une minute. L\'invisibilité prend fin lorsque la créature attaque ou lance un sort.' },
      { min: 71, max: 72, text: 'Vous obtenez la résistance à tous les dégâts pendant une minute.' },
      { min: 73, max: 74, text: 'Une créature aléatoire située dans un rayon de 18 mètres est empoisonnée pendant 1d4 heures.' },
      { min: 75, max: 76, text: 'Vous vous mettez à briller dans un rayon de 9 mètres pendant une minute. Toute créature finissant son tour à 1,50 mètre de vous est aveuglée jusqu\'à la fin de son prochain tour.' },
      { min: 77, max: 78, text: 'Vous lancez le sort métamorphose sur vous-même. Si vous ratez votre jet de sauvegarde, vous vous transformez en mouton pour la durée du sort.' },
      { min: 79, max: 80, text: 'Des illusions de papillons et de pétales de fleur flottent autour de vous dans un rayon de 3 mètres pendant une minute.' },
      { min: 81, max: 82, text: 'Vous obtenez 1 action supplémentaire immédiatement.' },
      { min: 83, max: 84, text: 'Toutes les créatures à 9 mètres ou moins prennent 1d10 de dégâts nécrotiques. Vous regagnez autant de points de vie que de dégâts infligés.' },
      { min: 85, max: 86, text: 'Vous lancez le sort image miroir.' },
      { min: 87, max: 88, text: 'Vous lancez le sort vol sur une créature aléatoire dans un rayon de 18 mètres.' },
      { min: 89, max: 90, text: 'Vous devenez invisible pendant une minute. Pendant ce temps, les autres créatures ne peuvent pas vous entendre. L\'invisibilité prend fin lorsque vous attaquez ou lancez un sort.' },
      { min: 91, max: 92, text: 'Si vous mourrez dans la minute qui suit, vous revenez immédiatement à la vie comme si vous étiez touché par le sort résurrection.' },
      { min: 93, max: 94, text: 'Votre taille augmente d\'une catégorie pendant une minute.' },
      { min: 95, max: 96, text: 'Vous et toutes les créatures dans un rayon de 9 mètres obtenez la vulnérabilité aux dégâts perforants pendant une minute.' },
      { min: 97, max: 98, text: 'Vous êtes entouré d\'une faible musique éthérée pendant une minute.' },
      { min: 99, max: 100, text: 'Vous regagnez tous vos points de sorcellerie.' },
    ],
  },
]
