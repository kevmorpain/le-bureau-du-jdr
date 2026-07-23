import type { Effect } from '../../schema/effects'
import type { FeaturePrerequisite } from '../../schema/features'

export interface FeatSeed {
  name: string // Nom FR canonique (PHB 2014, trad. AideDD)
  description: string
  // Slug stable utilisé par l'UI pour les mappings côté front (LU_FEATS).
  // Stocké uniquement dans le seed, pas en DB — la résolution côté serveur
  // se fait via le nom FR.
  slug: string
  effects: Effect[]
  // Prérequis de sélection (caractéristique minimale, maîtrise d'armure,
  // lanceur de sorts). null / absent = don sans prérequis.
  prerequisites?: FeaturePrerequisite | null
}

// Dons du PHB 2014 (FR, trad. AideDD). Chacun se traduit en feature
// `feature_type='feat'` au seed, avec ses effets mécaniques quand ils sont
// automatisables. Les 42 dons du Player's Handbook 2014 y figurent.
//
// Modélisation des effets :
// - `ability_increase` (carac fixe) : appliqué automatiquement par
//   useCharacterAbilities (ex. Comédien → Charisme).
// - `ability_increase_choice` (carac au choix) : résolu par le choix du joueur
//   à la sélection du don (ex. Athlète → For/Dex).
// - `proficiency` / `weapon_proficiency` / `language_proficiency_choice` /
//   `passive_skill_bonus` / `initiative_bonus` / `hp_per_level` : consommés par
//   la fiche (maîtrises, scores passifs, initiative, PV).
// - `other` : mécaniques situationnelles de combat que l'app ne simule pas
//   (attaques bonus, avantages conditionnels, riders de dégâts…) — purement
//   descriptives, sans consommateur front.
export const featsData: FeatSeed[] = [
  // ─── Alerte / Vigilant ──────────────────────────────────────────────────
  {
    slug: 'alert',
    name: 'Vigilant',
    description: 'Toujours sur vos gardes : +5 à l\'initiative ; vous ne pouvez pas être surpris tant que vous êtes conscient ; les créatures cachées ou invisibles n\'obtiennent pas l\'avantage à leurs jets d\'attaque contre vous.',
    effects: [
      { type: 'initiative_bonus', value: { amount: 5 } },
      { type: 'other', value: { kind: 'cannot_be_surprised_while_conscious' } },
      { type: 'other', value: { kind: 'no_hidden_attacker_advantage' } },
    ],
  },
  {
    slug: 'athlete',
    name: 'Athlète',
    description: '+1 en Force ou en Dextérité (max 20). Se relever ne coûte que 1,5 m de mouvement ; vous ne subissez pas de désavantage sur les sauts en longueur ou en hauteur avec élan ; escalader ne vous coûte pas de mouvement supplémentaire.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'dex'] } },
      { type: 'other', value: { kind: 'athlete_movement' } },
    ],
  },
  {
    slug: 'actor',
    name: 'Comédien',
    description: '+1 en Charisme (max 20). Avantage aux jets de Charisme (Tromperie) et (Représentation) pour vous faire passer pour quelqu\'un d\'autre, et vous pouvez imiter la voix ou les sons d\'une créature que vous avez écoutée suffisamment longtemps.',
    effects: [
      { type: 'ability_increase', value: { ability: 'cha', amount: 1 } },
      { type: 'other', value: { kind: 'actor_mimicry' } },
    ],
  },
  {
    slug: 'elemental-adept',
    name: 'Adepte élémentaire',
    description: 'Prérequis : savoir lancer au moins un sort. Choisissez un type de dégâts parmi acide, froid, feu, foudre ou tonnerre : vos sorts ignorent la résistance à ce type, et tout 1 obtenu sur un dé de dégâts de ce type est compté comme un 2. Peut être pris plusieurs fois, pour un type différent à chaque fois.',
    effects: [
      { type: 'other', value: { kind: 'elemental_adept' } },
    ],
    prerequisites: { requiresSpellcasting: true },
  },
  {
    slug: 'martial-adept',
    name: 'Adepte martial',
    description: 'Vous apprenez deux manœuvres de l\'archétype du Maître de guerre (Guerrier) et gagnez un dé de supériorité (d6), récupéré à la fin d\'un repos court ou long. Votre DD de manœuvre utilise votre Force ou votre Dextérité.',
    effects: [
      { type: 'other', value: { kind: 'martial_adept' } },
    ],
  },
  {
    slug: 'savage-attacker',
    name: 'Attaquant sauvage',
    description: 'Une fois par tour, quand vous lancez les dégâts d\'une attaque au corps à corps avec une arme, vous pouvez relancer les dés de dégâts de l\'arme et retenir le meilleur des deux résultats.',
    effects: [
      { type: 'other', value: { kind: 'savage_attacker' } },
    ],
  },
  {
    slug: 'tavern-brawler',
    name: 'Bagarreur de tavernes',
    description: '+1 en Force ou en Constitution (max 20). Vous maîtrisez les armes improvisées, vos coups à mains nues infligent 1d4 dégâts, et quand vous touchez une créature avec une arme improvisée ou une attaque à mains nues, vous pouvez tenter une empoignade en action bonus.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'con'] } },
      { type: 'weapon_proficiency', value: 'Armes improvisées' },
      { type: 'other', value: { kind: 'tavern_brawler' } },
    ],
  },
  {
    slug: 'charger',
    name: 'Expert de la charge',
    description: 'Quand vous utilisez l\'action Foncer et vous déplacez d\'au moins 3 mètres en ligne droite, vous pouvez enchaîner en action bonus soit une attaque de mêlée (+5 aux dégâts), soit une bousculade (repousse la cible de 3 mètres).',
    effects: [
      { type: 'other', value: { kind: 'charger' } },
    ],
  },
  {
    slug: 'lucky',
    name: 'Chanceux',
    description: 'Vous disposez de 3 points de chance par repos long. Avant ou après un jet d\'attaque, de sauvegarde ou de caractéristique, vous pouvez dépenser un point pour lancer un d20 supplémentaire et choisir le résultat.',
    effects: [
      { type: 'other', value: { kind: 'lucky_points_per_long_rest', amount: 3 } },
    ],
  },
  {
    slug: 'dual-wielder',
    name: 'Combattant à deux armes',
    description: '+1 à la CA quand vous tenez une arme de corps à corps différente dans chaque main. Vous pouvez combattre à deux armes avec des armes à une main non légères, et dégainer ou rengainer deux armes là où l\'on n\'en manipulerait qu\'une.',
    effects: [
      { type: 'other', value: { kind: 'dual_wielder' } },
    ],
  },
  {
    slug: 'mounted-combatant',
    name: 'Combattant monté',
    description: 'Tant que vous êtes monté et capable d\'agir : avantage aux attaques de mêlée contre une créature non montée plus petite que votre monture ; vous pouvez forcer une attaque visant votre monture à vous viser à la place ; votre monture ne subit aucun dégât sur un jet de sauvegarde de Dextérité réussi (et seulement la moitié en cas d\'échec).',
    effects: [
      { type: 'other', value: { kind: 'mounted_combatant' } },
    ],
  },
  {
    slug: 'defensive-duelist',
    name: 'Duelliste défensif',
    description: 'Prérequis : Dextérité 13. Quand vous tenez une arme de finesse que vous maîtrisez et qu\'une créature vous touche au corps à corps, vous pouvez utiliser votre réaction pour ajouter votre bonus de maîtrise à votre CA contre cette attaque, ce qui peut la faire échouer.',
    effects: [
      { type: 'other', value: { kind: 'defensive_duelist' } },
    ],
    prerequisites: { minAbilityScore: { abilities: ['dex'], score: 13 } },
  },
  {
    slug: 'skilled',
    name: 'Doué',
    description: 'Vous gagnez la maîtrise de trois compétences ou outils de votre choix, dans n\'importe quelle combinaison.',
    effects: [
      { type: 'other', value: { kind: 'skilled_choice' } },
    ],
  },
  {
    slug: 'durable',
    name: 'Endurant',
    description: '+1 en Constitution (max 20). Quand vous dépensez un dé de vie pour récupérer des points de vie, le minimum récupéré est égal à deux fois votre modificateur de Constitution (minimum 2).',
    effects: [
      { type: 'ability_increase', value: { ability: 'con', amount: 1 } },
      { type: 'other', value: { kind: 'durable_hit_dice' } },
    ],
  },
  {
    slug: 'keen-mind',
    name: 'Esprit affûté',
    description: '+1 en Intelligence (max 20). Vous savez toujours où se trouve le nord et combien d\'heures restent avant le prochain lever ou coucher de soleil, et vous vous rappelez avec précision tout ce que vous avez vu ou entendu au cours du dernier mois.',
    effects: [
      { type: 'ability_increase', value: { ability: 'int', amount: 1 } },
      { type: 'other', value: { kind: 'keen_mind' } },
    ],
  },
  {
    slug: 'dungeon-delver',
    name: 'Explorateur de donjons',
    description: 'Avantage aux jets de Perception et d\'Investigation pour repérer les portes secrètes, ainsi qu\'aux sauvegardes contre les pièges. Vous avez la résistance aux dégâts infligés par les pièges et pouvez chercher les pièges sans ralentir votre déplacement.',
    effects: [
      { type: 'other', value: { kind: 'dungeon_delver' } },
    ],
  },
  {
    slug: 'grappler',
    name: 'Lutteur',
    description: 'Prérequis : Force 13. Vous avez l\'avantage aux jets d\'attaque contre une créature que vous avez empoignée, et vous pouvez utiliser votre action pour l\'immobiliser : vous et elle êtes alors entravés jusqu\'à la fin de votre prochain tour.',
    effects: [
      { type: 'other', value: { kind: 'grappler' } },
    ],
    prerequisites: { minAbilityScore: { abilities: ['str'], score: 13 } },
  },
  {
    slug: 'mage-slayer',
    name: 'Tueur de mages',
    description: 'Quand une créature à 1,5 m lance un sort, vous pouvez utiliser votre réaction pour l\'attaquer en mêlée. Avantage aux jets de sauvegarde contre les sorts lancés par une créature à 1,5 m. Quand vous infligez des dégâts à une créature concentrée, elle a un désavantage à son jet de sauvegarde de concentration.',
    effects: [
      { type: 'other', value: { kind: 'mage_slayer' } },
    ],
  },
  {
    slug: 'war-caster',
    name: 'Mage de guerre',
    description: 'Prérequis : savoir lancer au moins un sort. Avantage aux jets de sauvegarde de Constitution pour maintenir votre concentration quand vous subissez des dégâts. Vous pouvez accomplir les composantes somatiques avec vos mains occupées (arme/bouclier), et lancer un sort à 1 action en guise d\'attaque d\'opportunité.',
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration_after_damage' } },
      { type: 'other', value: { kind: 'war_caster_somatic_with_full_hands' } },
      { type: 'other', value: { kind: 'war_caster_spell_as_opportunity_attack' } },
    ],
    prerequisites: { requiresSpellcasting: true },
  },
  {
    slug: 'spell-sniper',
    name: 'Mage offensif',
    description: 'Prérequis : savoir lancer au moins un sort. La portée de vos sorts nécessitant un jet d\'attaque est doublée, ces attaques ignorent les abris à demi et aux trois quarts, et vous apprenez un tour de magie d\'attaque au choix (Barde, Clerc, Druide, Ensorceleur, Magicien ou Occultiste).',
    effects: [
      { type: 'other', value: { kind: 'spell_sniper' } },
    ],
    prerequisites: { requiresSpellcasting: true },
  },
  {
    slug: 'ritual-caster',
    name: 'Magie rituelle',
    description: 'Prérequis : Intelligence ou Sagesse 13. Choisissez une classe de lanceur de sorts : vous obtenez un livre de rituels contenant deux sorts de niveau 1 à propriété rituelle, que vous pouvez lancer en rituel, et vous pouvez y consigner d\'autres rituels que vous découvrez.',
    effects: [
      { type: 'other', value: { kind: 'ritual_caster' } },
    ],
    prerequisites: { minAbilityScore: { abilities: ['int', 'wis'], score: 13 } },
  },
  {
    slug: 'crossbow-expert',
    name: 'Maître-arbalétrier',
    description: 'Vous ignorez la propriété chargement des arbalètes que vous maîtrisez. Se trouver à 1,5 m ou moins d\'un ennemi n\'impose pas de désavantage à vos attaques à distance. Quand vous attaquez avec une arme à une main, vous pouvez faire une attaque bonus avec une arbalète de poing que vous tenez.',
    effects: [
      { type: 'other', value: { kind: 'crossbow_expert' } },
    ],
  },
  {
    slug: 'weapon-master',
    name: 'Maître d\'armes',
    description: '+1 en Force ou en Dextérité (max 20). Vous gagnez la maîtrise de quatre armes de votre choix, chacune devant être une arme courante ou une arme de guerre.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'dex'] } },
      { type: 'other', value: { kind: 'weapon_master_choice' } },
    ],
  },
  {
    slug: 'polearm-master',
    name: 'Maître d\'hast',
    description: 'Avec une coutille, une hallebarde, un bâton ou une lance, vous pouvez faire en action bonus une attaque de crosse infligeant 1d4 dégâts contondants. De plus, les créatures provoquent une attaque d\'opportunité lorsqu\'elles entrent dans votre allonge tant que vous maniez l\'une de ces armes.',
    effects: [
      { type: 'other', value: { kind: 'polearm_master' } },
    ],
  },
  {
    slug: 'great-weapon',
    name: 'Maître des armes à deux mains',
    description: 'Avant une attaque de mêlée avec une arme lourde dont vous êtes maître, vous pouvez subir −5 au jet d\'attaque pour gagner +10 aux dégâts. Quand vous obtenez un coup critique ou réduisez une créature à 0 PV avec une arme de mêlée, vous pouvez faire une attaque bonus avec la même arme.',
    effects: [
      { type: 'other', value: { kind: 'great_weapon_master_bonus_attack' } },
      { type: 'other', value: { kind: 'great_weapon_master_power_attack' } },
    ],
  },
  {
    slug: 'medium-armor-master',
    name: 'Maître des armures intermédiaires',
    description: 'Prérequis : maîtrise des armures intermédiaires. Porter une armure intermédiaire n\'impose pas de désavantage à vos jets de Discrétion, et si votre Dextérité est de 16 ou plus, vous pouvez ajouter jusqu\'à +3 (au lieu de +2) à votre CA avec ce type d\'armure.',
    effects: [
      { type: 'other', value: { kind: 'medium_armor_master' } },
    ],
    prerequisites: { requiredArmorProficiency: 'medium' },
  },
  {
    slug: 'heavy-armor-master',
    name: 'Maître des armures lourdes',
    description: 'Prérequis : maîtrise des armures lourdes. +1 en Force (max 20). Tant que vous portez une armure lourde, les dégâts contondants, perforants et tranchants des armes non magiques que vous subissez sont réduits de 3.',
    effects: [
      { type: 'ability_increase', value: { ability: 'str', amount: 1 } },
      { type: 'other', value: { kind: 'heavy_armor_master' } },
    ],
    prerequisites: { requiredArmorProficiency: 'heavy' },
  },
  {
    slug: 'shield-master',
    name: 'Maître des boucliers',
    description: 'Tant que vous portez un bouclier : si vous prenez l\'action Attaquer, vous pouvez tenter une bousculade au bouclier en action bonus ; vous ajoutez le bonus du bouclier à vos sauvegardes de Dextérité contre les effets ne visant que vous ; et vous pouvez utiliser votre réaction pour ne subir aucun dégât sur une sauvegarde de Dextérité réussie qui n\'en inflige normalement que la moitié.',
    effects: [
      { type: 'other', value: { kind: 'shield_master' } },
    ],
  },
  {
    slug: 'inspiring-leader',
    name: 'Meneur exaltant',
    description: 'Prérequis : Charisme 13. En passant 10 minutes à galvaniser vos alliés, vous octroyez à un maximum de six créatures (vous compris) dans un rayon de 9 m des points de vie temporaires égaux à votre niveau + votre modificateur de Charisme.',
    effects: [
      { type: 'other', value: { kind: 'inspiring_leader' } },
    ],
    prerequisites: { minAbilityScore: { abilities: ['cha'], score: 13 } },
  },
  {
    slug: 'mobile',
    name: 'Mobile',
    description: 'Votre vitesse augmente de 3 m. Quand vous utilisez l\'action Foncer, le terrain difficile ne vous coûte aucun mouvement supplémentaire ce tour. Quand vous attaquez une créature en mêlée, elle ne provoque pas d\'attaque d\'opportunité de votre part ce tour.',
    effects: [
      { type: 'walking_speed', value: 3 },
      { type: 'other', value: { kind: 'mobile_no_opportunity_attacks' } },
    ],
  },
  {
    slug: 'observant',
    name: 'Observateur',
    description: '+1 en Intelligence ou en Sagesse (max 20). +5 à votre Perception passive et à votre Investigation passive. Vous pouvez lire sur les lèvres en observant attentivement une créature qui parle une langue que vous comprenez.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['int', 'wis'] } },
      { type: 'passive_skill_bonus', value: { skill: 'perception', amount: 5 } },
      { type: 'passive_skill_bonus', value: { skill: 'investigation', amount: 5 } },
      { type: 'other', value: { kind: 'observant_lip_reading' } },
    ],
  },
  {
    slug: 'moderately-armored',
    name: 'Protection intermédiaire',
    description: 'Prérequis : maîtrise des armures légères. +1 en Force ou en Dextérité (max 20). Vous gagnez la maîtrise des armures intermédiaires et des boucliers.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'dex'] } },
      { type: 'proficiency', value: 'medium_armor' },
      { type: 'proficiency', value: 'shield' },
    ],
    prerequisites: { requiredArmorProficiency: 'light' },
  },
  {
    slug: 'lightly-armored',
    name: 'Protection légère',
    description: '+1 en Force ou en Dextérité (max 20). Vous gagnez la maîtrise des armures légères.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'dex'] } },
      { type: 'proficiency', value: 'light_armor' },
    ],
  },
  {
    slug: 'heavily-armored',
    name: 'Protection lourde',
    description: 'Prérequis : maîtrise des armures intermédiaires. +1 en Force (max 20). Vous gagnez la maîtrise des armures lourdes.',
    effects: [
      { type: 'ability_increase', value: { ability: 'str', amount: 1 } },
      { type: 'proficiency', value: 'heavy_armor' },
    ],
    prerequisites: { requiredArmorProficiency: 'medium' },
  },
  {
    slug: 'resilient',
    name: 'Résilient',
    description: 'Choisissez une caractéristique : +1 dans celle-ci (max 20) et vous gagnez la maîtrise des jets de sauvegarde correspondants.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1 } },
      { type: 'other', value: { kind: 'resilient_saving_throw_proficiency_choice' } },
    ],
  },
  {
    slug: 'tough',
    name: 'Robuste',
    description: 'Vos points de vie maximum augmentent de 2 par niveau de personnage. Chaque fois que vous gagnez un niveau par la suite, vos PV maximum augmentent de 2 supplémentaires.',
    effects: [
      { type: 'hp_per_level', value: { amount: 2 } },
    ],
  },
  {
    slug: 'sentinel',
    name: 'Sentinelle',
    description: 'Quand vous portez une attaque d\'opportunité, la vitesse de la cible tombe à 0 jusqu\'à la fin du tour. Les créatures provoquent une attaque d\'opportunité même en se Désengageant. Quand une créature à 1,5 m attaque une cible autre que vous, vous pouvez utiliser votre réaction pour l\'attaquer en mêlée.',
    effects: [
      { type: 'other', value: { kind: 'sentinel' } },
    ],
  },
  {
    slug: 'healer',
    name: 'Soigneur',
    description: 'Quand vous stabilisez une créature mourante avec une trousse de soins, elle récupère 1 point de vie. En une action, vous pouvez dépenser une utilisation d\'une trousse de soins pour rendre à une créature 1d6 + 4 points de vie, plus autant de points que son nombre de dés de vie ; elle ne peut plus en bénéficier avant un repos court ou long.',
    effects: [
      { type: 'other', value: { kind: 'healer_kit' } },
    ],
  },
  {
    slug: 'sharpshooter',
    name: 'Tireur d\'élite',
    description: 'Les attaques à distance à longue portée ne subissent pas de désavantage. Vos attaques à distance ignorent les abris à demi et aux trois quarts. Avant une attaque à distance avec une arme dont vous êtes maître, vous pouvez subir −5 au jet d\'attaque pour gagner +10 aux dégâts.',
    effects: [
      { type: 'other', value: { kind: 'sharpshooter' } },
    ],
  },
  {
    slug: 'linguist',
    name: 'Linguiste',
    description: '+1 en Intelligence (max 20). Vous apprenez trois langues supplémentaires et pouvez rédiger des messages codés que l\'on ne peut déchiffrer sans la clé ou une réussite exceptionnelle.',
    effects: [
      { type: 'ability_increase', value: { ability: 'int', amount: 1 } },
      { type: 'language_proficiency_choice', value: { count: 3 } },
      { type: 'other', value: { kind: 'linguist_ciphers' } },
    ],
  },
  {
    slug: 'magic-init',
    name: 'Initié à la magie',
    description: 'Choisissez une classe (Barde, Clerc, Druide, Ensorceleur, Magicien ou Occultiste). Vous apprenez 2 tours de magie de cette classe et 1 sort de niveau 1 que vous pouvez lancer une fois par repos long sans dépenser d\'emplacement (ou en dépensant un emplacement de la classe si vous en avez).',
    effects: [
      { type: 'other', value: { kind: 'magic_initiate_choice' } },
    ],
  },
  {
    slug: 'skulker',
    name: 'Discret',
    description: 'Prérequis : Dextérité 13. Vous pouvez tenter de vous cacher lorsque vous n\'êtes que légèrement obscurci. Rater une attaque à distance ne révèle pas votre position. La faible luminosité n\'impose pas de désavantage à vos jets de Sagesse (Perception) basés sur la vue.',
    effects: [
      { type: 'other', value: { kind: 'skulker' } },
    ],
    prerequisites: { minAbilityScore: { abilities: ['dex'], score: 13 } },
  },
]
