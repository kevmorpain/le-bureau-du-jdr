-- Corrections de six descriptions de sorts hors socle (#176) : un passage perdait une règle ou l'inventait
-- (avantage de la Lame d'ombres limité à l'épée, taille TP du Serviteur miniature, lanceur de la dissipation
-- du Bosquet des druides, sens du repoussement de Saute de vent, créature qui attaque avec Pierre magique, début d'Épine mentale).
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_{0,2,3,6}.ts, gardé par test/nuxt/spellDescriptionFixesMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente et limitée à l'édition 2014 : la description n'est réécrite que si le passage
-- fautif y figure encore, donc ni une description corrigée à la main, ni une base vierge ou déjà au bon texte ne bougent. Jamais BEGIN (D1).
-- Les migrations 0171, 0173, 0174 et 0177 portent déjà le texte corrigé : celle-ci ne sert qu'aux bases qui les ont appliquées avant.

-- Saute de vent
UPDATE spells SET description = 'Vous saisissez l''air pour produire, en un point que vous voyez à portée, l''un de ces effets :

- Une créature de taille M ou inférieure que vous choisissez doit réussir un jet de sauvegarde de Force, sans quoi elle est repoussée de 1,50 mètre en s''éloignant de vous.
- Une brève explosion d''air repousse de 3 mètres, en l''éloignant de vous, un objet non tenu ni porté pesant 2,5 kg au plus, sans force suffisante pour blesser.
- Un effet sensoriel inoffensif, comme faire bruisser des feuilles, claquer des volets ou onduler des vêtements.'
WHERE name = 'Saute de vent' AND ruleset = '5' AND instr(description, 'Une brève explosion d''air déplace') > 0;

-- Pierre magique
UPDATE spells SET description = 'Vous imprégnez de magie un à trois cailloux que vous touchez. Vous, ou une autre créature, pouvez attaquer avec l''un d''eux par une attaque à distance avec un sort, en le jetant (portée de 18 mètres) ou en le lançant avec une fronde. Une autre créature ajoute à son jet d''attaque le modificateur de votre caractéristique d''incantation, pas le sien. En cas de réussite, la cible subit 1d6 dégâts contondants + le modificateur de votre caractéristique d''incantation. Quoi qu''il arrive, le caillou perd sa magie après l''attaque.

Si vous relancez ce sort, la magie des cailloux encore imprégnés prend fin.'
WHERE name = 'Pierre magique' AND ruleset = '5' AND instr(description, 'Un autre lanceur ajoute') > 0;

-- Lame d'ombres
UPDATE spells SET description = 'Vous tissez des fils d''ombre en une épée de ténèbres solidifiées dans votre main, qui dure jusqu''à la fin du sort. Elle compte comme une arme courante de corps à corps que vous maîtrisez, inflige 2d8 dégâts psychiques si vous touchez, et possède les propriétés finesse, légère et lancer (portée 6/18). Quand vous attaquez avec l''épée une cible située dans une lumière faible ou dans les ténèbres, vous avez l''avantage au jet d''attaque. Si vous lâchez ou lancez l''épée, elle se dissipe à la fin du tour ; tant que le sort dure, vous pouvez utiliser une action bonus pour la faire réapparaître dans votre main.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou 4, les dégâts passent à 3d8 ; avec un emplacement de niveau 5 ou 6, à 4d8 ; avec un emplacement de niveau 7 ou plus, à 5d8.'
WHERE name = 'Lame d''ombres' AND ruleset = '5' AND instr(description, 'Vous attaquez avec avantage une cible') > 0;

-- Épine mentale
UPDATE spells SET description = 'Vous atteignez l''esprit d''une créature que vous voyez à portée. Elle doit effectuer un jet de sauvegarde de Sagesse : en cas d''échec, elle subit 3d8 dégâts psychiques, et la moitié en cas de réussite. En cas d''échec, vous connaissez sa position jusqu''à la fin du sort tant que vous êtes tous deux sur le même plan d''existence ; elle ne peut alors pas se cacher de vous, et si elle est invisible, elle n''en tire aucun avantage contre vous.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 2.'
WHERE name = 'Épine mentale' AND ruleset = '5' AND instr(description, 'Vous plantez une épine') > 0;

-- Serviteur miniature
UPDATE spells SET description = 'Vous touchez un objet non magique de taille TP, qui n''est ni attaché à un autre objet ou à une surface, ni porté ou transporté par une créature. Il s''anime, de minuscules jambes et bras lui poussent, et il devient une créature sous votre contrôle jusqu''à la fin du sort ou jusqu''à ce que ses points de vie tombent à 0. Il utilise les statistiques d''un serviteur miniature.

Par une action bonus, vous pouvez lui donner mentalement un ordre s''il est à 36 mètres ou moins de vous (avec plusieurs créatures issues de ce sort, vous pouvez donner un ordre à chacune ou à toutes). Vous décidez de son action et de son déplacement au prochain tour, ou vous donnez un ordre général (aller chercher une clé, monter la garde, ranger des livres). Sans ordre, le serviteur reste inactif et se défend seulement contre les créatures hostiles. Il suit un ordre jusqu''à son accomplissement.

À 0 point de vie, il reprend sa forme d''origine en gardant les dégâts physiques subis.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, vous pouvez animer deux objets de plus par niveau d''emplacement au-delà du niveau 3.'
WHERE name = 'Serviteur miniature' AND ruleset = '5' AND instr(description, 'Vous touchez un objet non magique, qui') > 0;

-- Bosquet des druides
UPDATE spells SET description = 'Vous invoquez les esprits de la nature pour protéger une zone, en extérieur ou sous terre, en forme de cube de 9 à 27 mètres de côté. Constructions et structures ne sont pas affectées. Si vous lancez ce sort chaque jour dans la même zone pendant 1 an, ses effets deviennent permanents jusqu''à dissipation. Lors de l''incantation, vous pouvez désigner des créatures immunisées aux effets du sort, ainsi qu''un mot de passe qui, prononcé à voix haute, rend immunisé quiconque le dit. Toute la zone irradie la magie : une *dissipation de la magie* réussie ne retire qu''un seul effet, au choix du lanceur de la dissipation, et le sort ne se dissipe que lorsque tous ses effets ont disparu.

**Brouillard épais**. Vous pouvez emplir de brouillard épais n''importe quel carré de 1,50 mètre de côté de la zone, ce qui réduit la visibilité. Il s''élève jusqu''à 3 mètres de haut, et chaque déplacement de 1,50 mètre dedans coûte 3 mètres de déplacement de plus. Pour une créature immunisée, il ne gêne pas la vue et ressemble à une légère brume parsemée de petites particules vertes.

**Liane agrippante**. Vous pouvez emplir d''herbes et de lianes agrippantes tout carré de 1,50 mètre de côté non occupé par le brouillard, comme le sort *enchevêtrement*. Pour une créature immunisée, elles sont souples et peuvent former un siège ou un lit temporaire.

**Gardiens du bosquet**. Vous pouvez animer jusqu''à quatre arbres de la zone, qui se déracinent. Ils ont les statistiques d''un arbre éveillé, mais ne parlent pas et leur écorce porte des symboles druidiques. Si une créature non immunisée entre dans la zone, les gardiens l''attaquent jusqu''à ce que les intrus soient repoussés ou éliminés. Ils obéissent à vos ordres tant que vous êtes dans la zone (sans action) ; sans ordre et sans intrus, ils restent inactifs. Ils ne peuvent pas quitter la zone. À la fin du sort, leur animation disparaît et ils reprennent racine sur place si possible.

**Effets supplémentaires**. Vous pouvez ajouter dans la zone l''un de ces effets magiques :

- Une *bourrasque* constante à deux endroits de votre choix.
- Une *croissance d''épines* à un endroit de votre choix.
- Un *mur de vent* à deux endroits de votre choix.

Pour une créature immunisée, les vents sont une douce brise parfumée et les épines sont inoffensives.'
WHERE name = 'Bosquet des druides' AND ruleset = '5' AND instr(description, 'que choisit le lanceur du sort') > 0;
