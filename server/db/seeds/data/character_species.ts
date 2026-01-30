import { CreatureSize } from '../../schema/character_species'

const highElf = {
  name: 'Haut-elfe',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Dextérité augmente de 2.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'dex',
            amount: 2,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Habitué aux forêts vespérales et au ciel nocturne, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        {
          type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Sens aiguisés',
      description: `Vous avez la maîtrise de la compétence Perception.`,
      effects: [
        {
          type: 'skill_proficiency',
          value: 'perception',
        },
      ],
    },
    {
      name: 'Ascendance féérique',
      description: `Vous êtes avantagé aux jets de sauvegarde contre l'état charmé, et la magie ne peut pas vous endormir.`,
      effects: [
        {
          type: 'advantage',
          value: {
            ability: 'saving_throws',
            condition: 'charmed',
          },
        },
        {
          type: 'immunity',
          value: 'sleep_magic',
        },
      ],
    },
    {
      name: 'Entraînement martial elfique',
      description: `Vous avez la maîtrise de l'épée longue, de l'épée courte, de l'arc court et de l'arc long.`,
      effects: [
        {
          type: 'weapon_proficiency',
          value: 'longsword',
        },
        {
          type: 'weapon_proficiency',
          value: 'shortsword',
        },
        {
          type: 'weapon_proficiency',
          value: 'shortbow',
        },
        {
          type: 'weapon_proficiency',
          value: 'longbow',
        },
      ],
    },
    {
      name: 'Transe',
      description: `Les elfes n'ont pas besoin de dormir. En lieu et place de sommeil, ils méditent profondément dans un état de conscience partielle, pendant 4 heures par jour. (Cette méditation est communément appelée « transe »). Elle peut s'accompagner de songes personnalisés qui sont en vérité des exercices mentaux, devenus au fil des ans une seconde nature. Une fois que vous terminez un tel repos, vous recevez les mêmes bénéfices qu'un humain émergeant de 8 heures de sommeil.`,
      effects: [],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et l'elfique. Cette langue fluide mêle intonations subtiles et grammaire complexe. La littérature elfique, riche et variée, a produit de nombreux chants et poèmes célèbres chez d'autres cultures.
      De nombreux bardes apprennent cette langue pour pouvoir ajouter des ballades elfiques à leur répertoire.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'elvish',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur d'Intelligence augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'int',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Sort mineur',
      description: `Vous connaissez un sort mineur de la liste de sorts du magicien (au choix). L'Intelligence est la caractéristique d'incantation correspondante.`,
      effects: [
        {
          type: 'spell_choice',
          value: {
            class: 'wizard',
            level: 0,
            spellcastingAbility: 'int',
            count: 1,
          },
        },
      ],
    },
    {
      name: 'Langue supplémentaire',
      description: `Vous parlez, lisez et écrivez une langue supplémentaire de votre choix.`,
      effects: [
        {
          type: 'language_proficiency_choice',
          value: {
            count: 1,
          },
        },
      ],
    },
  ],
}

const hillDwarf = {
  name: 'Nain des collines',
  size: CreatureSize.Medium,
  speed: 7.5,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Constitution augmente de 2.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'con',
            amount: 2,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 7,50 m. Votre vitesse n'est pas réduite par le port d'une armure lourde.`,
      effects: [
        {
          type: 'walking_speed',
          value: 7.5,
        },
        {
          type: 'equipment_penalty',
          value: {
            penalty: 'speed',
            armor_type: 'heavy',
            modifier: 'none',
            override: true,
          },
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Habitué à vivre sous terre, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        {
          type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Résistance naine',
      description: `Vous êtes avantagé aux jets de sauvegarde contre le poison et bénéficiez de la résistance aux dégâts de poison`,
      effects: [
        {
          type: 'advantage',
          value: {
            ability: 'saving_throws',
            condition: 'poison',
          },
        },
        {
          type: 'damage_resistance',
          value: {
            damageType: 'poison',
          },
        },
      ],
    },
    {
      name: 'Entraînement martial nain',
      description: `Vous avez la maîtrise de la hache d'armes, de la hachette, du marteau léger et du marteau de guerre.`,
      effects: [
        {
          type: 'weapon_proficiency',
          value: 'battleaxe',
        },
        {
          type: 'weapon_proficiency',
          value: 'handaxe',
        },
        {
          type: 'weapon_proficiency',
          value: 'light_hammer',
        },
        {
          type: 'weapon_proficiency',
          value: 'warhammer',
        },
      ],
    },
    {
      name: `Maîtrise d'outils`,
      description: `Vous recevez la maîtrise des outils d'artisan de votre choix parmi : outils de forgeron, matériel de brasseur, outils de maçon.`,
      effects: [
        {
          type: 'tool_proficiency_choice',
          value: [
            'artisan_tools',
            'brewer_tools',
            'mason_tools',
          ],
        },
      ],
    },
    {
      name: 'Connaissance de la pierre',
      description: `Chaque fois que vous effectuez un test d'Intelligence (Histoire) lié aux origines d'un travail de maçonnerie, on considère que vous avez la maîtrise de la compétence Histoire et vous appliquez le double de votre bonus de maîtrise au test, au lieu du simple bonus.`,
      effects: [
        {
          type: 'skill_bonus',
          value: {
            skill: 'history',
            bonusType: 'proficiency',
            multiplier: 2,
            condition: 'masonry_origins',
          },
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et le nain. Le nain est une langue gutturale et percussive, ce qui se retrouve dans l'accent des nains, quel que soit l'idiome parlé.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'dwarvish',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Sagesse augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'wis',
            amount: 1,
          },
        },
      ],
    },
  ],
}

const lightfootHalfling = {
  name: 'Halfelin pied-léger',
  size: CreatureSize.Small,
  speed: 7.5,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Dextérité augmente de 2.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'dex',
            amount: 2,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 7,50 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 7.5,
        },
      ],
    },
    {
      name: 'Chanceux',
      description: `Lorsque vous obtenez un 1 sur le d20 d'un jet d'attaque, d'un test de caractéristique ou d'un jet de sauvegarde, vous pouvez relancer ce dé, auquel cas c'est le second résultat qui s'applique.`,
      effects: [
        {
          type: 'reroll',
          value: {
            rollType: 'd20',
            trigger: 1,
          },
        },
      ],
    },
    {
      name: 'Brave',
      description: `Vous avez l'avantage aux jets de sauvegarde contre l'état effrayé.`,
      effects: [
        {
          type: 'advantage',
          value: {
            ability: 'saving_throws',
            condition: 'frightened',
          },
        },
      ],
    },
    {
      name: 'Agilité halfeline',
      description: `Vous pouvez vous déplacer à travers l'espace de toute créature dont la catégorie de taille est supérieure à la vôtre.`,
      effects: [],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et le halfelin. Cette langue n'a rien de secret, mais les halfelins n'aiment guère la partager. Leur littérature est plutôt pauvre, car ils écrivent finalement très peu. Leur tradition orale s'avère en revanche très riche. Tous les halfelins ou presque recourent au commun pour converser avec la population des contrées qu'ils habitent ou qu'ils traversent.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'halfling',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Charisme augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'cha',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Discrétion naturelle',
      description: `Il vous suffit d'être derrière une créature dont la catégorie de taille est d'au moins un cran supérieure à la vôtre pour pouvoir tenter de vous cacher`,
      effects: [],
    },
  ],
}

const human = {
  name: 'Humain',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Chacune de vos valeurs de caractéristique augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'str',
            amount: 1,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'dex',
            amount: 1,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'con',
            amount: 1,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'int',
            amount: 1,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'wis',
            amount: 1,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'cha',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et une langue supplémentaire de votre choix. Les humains apprennent généralement la langue des peuples qu'ils côtoient le plus, qui peut être un dialecte obscur. Ils adorent émailler leur discours de mots empruntés à d'autres langues : jurons orcs, termes musicaux elfiques, formules militaires naines, etc.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'common',
        },
        {
          type: 'language_proficiency_choice',
          value: { count: 1 },
        },
      ],
    },
  ],
}

const dragonborn = {
  name: 'Drakéide',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Force augmente de 2 et votre valeur de Charisme augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'str',
            amount: 2,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'cha',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Ascendance draconique',
      description: `Vous avez des ancêtres draconiques. Choisissez un type de dragon dans la table Ascendance draconique. Ce choix détermine votre souffle et votre résistance aux dégâts, comme indiqué dans la table.`,
      effects: [
        {
          type: 'choice',
          value: 'draconic_ancestry',
        },
      ],
    },
    {
      name: 'Souffle',
      description: `Vous pouvez consacrer votre action à exhaler une vague d'énergie destructrice. Votre ascendance draconique détermine la taille, la forme et le type de dégâts de ce souffle. Quand vous utilisez votre souffle, chaque créature dans la zone d'effet effectue un jet de sauvegarde dont le type est déterminé par votre ascendance draconique. Le DD du jet de sauvegarde contre ce souffle est égal à 8 + votre modificateur de Constitution + votre bonus de maîtrise. Une créature subit 2d6 dégâts en cas d'échec, la moitié en cas de réussite. La quantité de dégâts passe à 3d6 au niveau 6, à 4d6 au niveau 11 et à 5d6 au niveau 16. Une fois votre souffle utilisé, vous ne pouvez plus y recourir avant d'avoir terminé un repos court ou long.`,
      effects: [
        {
          type: 'action',
          value: {
            type: 'breathe_weapon',
            countPerRest: 1,
            damage: {
              damageType: 'draconic_ancestry',
              areaOfEffect: 'draconic_ancestry',
              damageAtCharacterLevel: {
                1: '2d6',
                6: '3d6',
                11: '4d6',
                16: '5d6',
              },
              savingThrowAbility: 'draconic_ancestry',
              saveDcBase: 8,
              saveDcModifiers: ['con', 'proficiency'],
              halfOnSave: true,
            },
          },
        },
      ],
    },
    {
      name: 'Résistance aux dégâts',
      description: `Vous bénéficiez de la résistance au type de dégâts associé à votre ascendance draconique.`,
      effects: [
        {
          type: 'damage_resistance',
          value: 'draconic_ancestry',
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et le draconique. Le draconique, considéré comme l'une des langues les plus anciennes, est souvent utilisé pour étudier la magie. Comprenant de nombreuses consonnes dures et autres sifflements, cette langue heurte les tympans de nombre des créatures qui ne la parlent pas.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'draconic',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
  ],
}

const rockGnome = {
  name: 'Gnome des rochers',
  size: CreatureSize.Small,
  speed: 7.5,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur d'Intelligence augmente de 2.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'int',
            amount: 2,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 7,50 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 7.5,
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Habitué à vivre sous terre, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        {
          type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Ruse gnome',
      description: `Vous êtes avantagé à tous les jets de sauvegarde d'Intelligence, de Sagesse et de Charisme contre la magie.`,
      effects: [
        {
          type: 'advantage',
          value: {
            type: 'saving_throw',
            ability: 'int',
            condition: 'magic',
          },
        },
        {
          type: 'advantage',
          value: {
            type: 'saving_throw',
            ability: 'wis',
            condition: 'magic',
          },
        },
        {
          type: 'advantage',
          value: {
            type: 'saving_throw',
            ability: 'cha',
            condition: 'magic',
          },
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et le gnome. La langue gnome, qui recourt à l'alphabet nain, est réputée pour ses traits techniques et ses encyclopédies consacrées au monde naturel.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'gnomish',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Constitution augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'con',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Connaissances en ingénierie',
      description: `Chaque fois que vous effectuez un test d'Intelligence (Histoire) relatif aux objets magiques, alchimiques ou technologiques, vous ajoutez le double de votre bonus`,
      effects: [
        {
          type: 'skill_bonus',
          value: {
            skill: 'history',
            bonusType: 'proficiency',
            multiplier: 2,
            condition: 'magical_alchemical_technological_origins',
          },
        },
      ],
    },
    {
      name: 'Bricoleur',
      description: `Vous avez la maîtrise des outils d'artisan (outils de bricoleur). Au moyen de ces outils et pour peu que vous passiez 1 heure et dépensiez 10 po de matériaux, vous construisez un mécanisme de taille TP (CA 5, 1 pv). Ce mécanisme cesse de fonctionner au bout de 24 heures (sauf si vous consacrez 1 heure à le réparer pour le maintenir en état de marche) ou si vous consacrez votre action à le démanteler. Vous pouvez alors récupérer les matériaux qui ont servi à sa création. Vous pouvez avoir jusqu'à trois mécanismes de ce type fonctionnant en même temps.
      Quand vous créez un appareil, choisissez l'une des options suivantes :
      - Boîte à musique. Quand elle est ouverte, cette boîte à musique joue une mélodie à un volume sonore modéré. La boîte à musique cesse de jouer lorsqu'elle atteint la fin de la chanson ou si elle est refermée. 
      - Boutefeu. L'appareil produit une petite flamme qui permet d'allumer une bougie, une torche ou un feu de camp. Utiliser cet appareil nécessite que vous y consacriez votre action. 
      - Jouet mécanique. Ce jouet est un animal, un monstre ou une personne mécanique : une grenouille, une souris, un oiseau, un dragon ou un soldat, par exemple. Placé au sol, le jouet se déplace de 1,50 m à chacun de vos tours dans une direction aléatoire. Il émet un bruit en rapport avec la créature qu'il représente.`,
      effects: [],
    },
  ],
}

const halfElf = {
  name: 'Demi-elfe',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Charisme augmente de 2. La valeur de deux autres caractéristiques de votre choix augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'cha',
            amount: 2,
          },
        },
        {
          type: 'ability_increase_choice',
          value: {
            count: 2,
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Grâce à votre ascendance elfique, vous possédez une excellente vision dans le noir et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        { type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Ascendance féérique',
      description: `Vous êtes avantagé aux jets de sauvegarde contre l'état charmé, et la magie ne peut pas vous endormir.`,
      effects: [
        {
          type: 'advantage',
          value: {
            ability: 'saving_throws',
            condition: 'charmed',
          },
        },
        {
          type: 'immunity',
          value: 'sleep_magic',
        },
      ],
    },
    {
      name: 'Polyvalence',
      description: `Vous recevez la maîtrise de deux compétences de votre choix.`,
      effects: [
        {
          type: 'skill_proficiency_choice',
          value: {
            count: 2,
          },
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun, l'elfique et une langue supplémentaire de votre choix.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'common',
        },
        {
          type: 'language_proficiency',
          value: 'elvish',
        },
        {
          type: 'language_proficiency_choice',
          value: { count: 1 },
        },
      ],
    },
  ],
}

const halfOrc = {
  name: 'Demi-orc',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Force augmente de 2 et votre valeur de Constitution augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'str',
            amount: 2,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'con',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Grâce à votre ascendance orque, vous possédez une excellente vision dans le noir et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        { type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Menaçant',
      description: `Vous recevez la maîtrise de la compétence Intimidation.`,
      effects: [
        {
          type: 'skill_proficiency',
          value: {
            ability: 'intimidation',
          },
        },
      ],
    },
    {
      name: 'Acharnement',
      description: `Si vous tombez à 0 point de vie sans être tué sur le ocup, vous pouvez en fait vous retrouver à 1 point de vie. Une fois que vous avez utilisé cette aptitude, vous devez terminer un repos long pour pouvoir y recourir de nouveau.`,
      effects: [
        {
          type: 'action',
          value: {
            trigger: '0_hit_points',
            heal: 1,
            countPerLongRest: 1,
          },
        },
      ],
    },
    {
      name: 'Sauvagerie',
      description: `Quand vous obtenez un coup critique avec une attaque au corps à corps, vous pouvez lancer l'un des dés de dégâts de l'arme une fois de plus et en ajouter le résultat aux dégâts supplémentaires du coup critique.`,
      effects: [
        {
          type: 'extra_damage',
          value: {
            trigger: 'critical_hit',
            attackType: 'melee',
            extraDie: 1,
          },
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et l'orc. La langue orque est gutturale, certains sons se rapprochent du grincement. N'ayant pas d'alphabet propre, elle reprend celui des nains.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'orc',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
  ],
}

const tiefling = {
  name: 'Tieffelin',
  size: CreatureSize.Medium,
  speed: 9,
  traits: [
    {
      name: 'Augmentation de caractéristique',
      description: `Votre valeur de Charisme augmente de 2 et votre valeur d'Intelligence augmente de 1.`,
      effects: [
        {
          type: 'ability_increase',
          value: {
            ability: 'cha',
            amount: 2,
          },
        },
        {
          type: 'ability_increase',
          value: {
            ability: 'int',
            amount: 1,
          },
        },
      ],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [
        {
          type: 'walking_speed',
          value: 9,
        },
      ],
    },
    {
      name: 'Vision dans le noir',
      description: `Grâce à votre ascendance infernale, vous possédez une excellente vision dans le noir et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
      effects: [
        { type: 'darkvision',
          value: { range: 18 },
        },
      ],
    },
    {
      name: 'Résistance infernale',
      description: `Vous bénéficiez de la résistance aux dégâts de feu.`,
      effects: [
        {
          type: 'damage_resistance',
          value: {
            damageType: 'fire',
          },
        },
      ],
    },
    {
      name: 'Ascendance infernale',
      description: `Vous connaissez le sort mineur Thaumaturgie. Lorsque vous atteignez le niveau 3, vous pouvez lancer une fois le sort Représailles infernales en tant que sort de 2e niveau par l'intermédiaire de ce trait et vous récupérez cette faculté en terminant un repos long. Lorsque vous atteignez le niveau 5, vous pouvez lancer le sort Ténèbres une fois par l'intermédiaire de ce trait et récupérez cette faculté en terminant un repos long. Le Charisme est la caractéristique d'incantation pour ces sorts.`,
      effects: [
        {
          type: 'spell_grant',
          value: {
            level: 0,
            spellcastingAbility: 'cha',
            spellName: 'thaumaturgy',
            countPerLongRest: Infinity,
          },
        },
        {
          type: 'spell_grant',
          value: {
            level: 2,
            spellcastingAbility: 'cha',
            spellName: 'hellish_rebuke',
            countPerLongRest: 1,
            unlockLevel: 3,
          },
        },
        {
          type: 'spell_grant',
          value: {
            level: 2,
            spellcastingAbility: 'cha',
            spellName: 'darkness',
            countPerLongRest: 1,
            unlockLevel: 5,
          },
        },
      ],
    },
    {
      name: 'Langues',
      description: `Vous parlez, lisez et écrivez le commun et l'infernal.`,
      effects: [
        {
          type: 'language_proficiency',
          value: 'infernal',
        },
        {
          type: 'language_proficiency',
          value: 'common',
        },
      ],
    },
  ],
}

export const characterSpecies = [
  highElf,
  hillDwarf,
  lightfootHalfling,
  human,
  dragonborn,
  rockGnome,
  halfElf,
  halfOrc,
  tiefling,
]
