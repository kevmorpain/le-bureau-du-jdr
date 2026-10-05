-- Fiche de sort (lot 8 : #167 S2, #168 S3, #169 S4, #170 S5, #239 D5). Ajoute le type d'attaque de sort explicite
-- (`attack_type`), la zone d'effet (`area_of_effect`) et la composante matérielle chiffrée ou consommée
-- (`material_cost`), corrige les composantes matérielles dont le seed divergeait d'AideDD, et structure les descriptions
-- (paragraphes, puces, gras : Markdown léger, formulation inchangée). Pendant du seed : server/db/seeds/data/spells.ts,
-- gardé par test/nuxt/spellSheetMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) ; les UPDATE posent des valeurs fixes, donc rejouables. Limitée à l'édition 2014 ; tolérante base
-- vierge : rien n'est posé si le sort n'existe pas encore, le seed s'en charge alors. Jamais BEGIN (D1).

ALTER TABLE `spells` ADD `material_cost` text;
ALTER TABLE `spells` ADD `attack_type` text;
ALTER TABLE `spells` ADD `area_of_effect` text;

UPDATE `spells` SET description = 'Un rayonnement semblable à des flammes descend sur une créature que vous pouvez voir dans la portée du sort. La cible doit réussir un jet de sauvegarde de Dextérité ou subir 1d8 dégâts radiants. La cible ne gagne aucun bénéfice d''abri pour ce jet de sauvegarde.

Les dégâts du sort augmentent de 1d8 lorsque vous atteignez le niveau 5 (2d8), le niveau 11 (3d8), et le niveau 17 (4d8).' WHERE name = 'Flamme sacrée' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous pointez une créature que vous pouvez voir à portée, et le son douloureux d''une cloche emplit l''air autour d''elle pendant un moment. La cible doit réussir un jet de sauvegarde de Sagesse ou subir 1d8 dégâts nécrotiques. Si la cible n''est pas à son maximum de points de vie, elle subit 1d12 de dégâts nécrotiques.

Les dégâts du sort augmentent de un dé lorsque vous atteignez le niveau 5 (2d8 ou 2d12), le niveau 11 (3d8 ou 3d12) et le niveau 17 (4d8 ou 4d12).' WHERE name = 'Glas' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous touchez un objet qui ne dépasse pas 3 mètres dans toutes les dimensions. Jusqu''à la fin du sort, l''objet émet une lumière vive dans un rayon de 6 mètres et une lumière faible sur 6 mètres supplémentaires. La lumière est de la couleur que vous voulez. Couvrir complètement l''objet avec quelque chose d''opaque bloque la lumière. Le sort se termine si vous le lancez de nouveau ou si vous le dissipez par une action.

Si vous ciblez un objet tenu ou porté par une créature hostile, cette créature doit réussir un jet de sauvegarde de Dextérité pour éviter le sort.' WHERE name = 'Lumière' AND ruleset = '5';

UPDATE `spells` SET description = 'Votre sort emplit vos alliés de robustesse et de résolution. Choisissez jusqu''à trois créatures à portée. Le maximum de points de vie et les points de vie actuels de chaque cible augmentent de 5 pour la durée du sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les points de vie de chaque cible augmentent de 5 pour chaque niveau d''emplacement au-delà du niveau 2.' WHERE name = 'Aide' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":100,"unit":"po"}', material = 'une perle d''une valeur d''au moins 100 po et une plume de hibou', description = 'Vous choisissez un objet que vous devez toucher durant toute la durée du sort. Si l''objet est magique ou imprégné de magie, vous apprenez ses propriétés et comment les utiliser, s''il requiert un lien pour être utilisé et le nombre de charges qu''il contient, le cas échéant. Vous apprenez si des sorts affectent l''objet et quels sont ces sorts. Si l''objet a été créé par un ou plusieurs sorts, vous apprenez quels sorts ont permis de le créer.

Si vous touchez une créature durant toute la durée du sort, au lieu d''un objet, vous apprenez quels sorts l''affectent actuellement, le cas échéant.' WHERE name = 'Identification' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous donnez un ordre d''un mot à une créature dans la portée du sort et que vous pouvez voir. La cible doit réussir un jet de sauvegarde de Sagesse ou suivre l''ordre lors de son prochain tour. Le sort n''a aucun effet si la cible est un mort-vivant, si elle ne comprend pas la langue, ou si votre ordre est directement nocif pour elle.

Des injonctions typiques et leurs effets suivent. Vous pouvez émettre un ordre autre que ceux décrits ici. Si vous le faites, le MD détermine comment la cible se comporte. Si la cible est empêchée de suivre votre ordre, le sort prend fin.

- **Approche.** La cible se déplace vers vous par le chemin le plus court et le plus direct, terminant son tour si elle arrive à 1,50 mètre ou moins de vous.
- **Lâche.** La cible lâche tout ce qu''elle tient et termine alors à son tour.
- **Fuis.** La cible s''éloigne de vous le plus rapidement possible.
- **Tombe.** La cible tombe au sol et termine alors à son tour.
- **Halte.** La cible ne bouge plus et n''entreprend aucune action.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous pouvez affecter une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 1. Les créatures que vous ciblez doivent toutes être dans un rayon de 9 mètres.' WHERE name = 'Injonction' AND ruleset = '5';

UPDATE `spells` SET description = 'Une créature que vous touchez récupère un nombre de points de vie égal à 1d8 + le modificateur de votre caractéristique d''incantation. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, la quantité de points de vie récupérés est augmentée de 1d8 pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Soins' AND ruleset = '5';

UPDATE `spells` SET description = 'Une créature visible de votre choix récupère des points de vie à hauteur de 1d4 + le modificateur de votre caractéristique d''incantation. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les points de vie récupérés augmentent de 1d4 pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Mot de guérison' AND ruleset = '5';

UPDATE `spells` SET description = 'Pour la durée du sort, vous percevez la présence de magie à 9 mètres ou moins de vous. Si vous percevez de la magie de cette manière, vous pouvez utiliser votre action pour discerner une faible aura enveloppant une créature ou un objet visible dans la zone qui présente de la magie. Vous déterminez aussi l''école de magie, le cas échéant.

Le sort peut outrepasser la plupart des obstacles mais il est bloqué par 30 cm de pierre, 2,50 cm de métal ordinaire, une mince feuille de plomb ou 90 cm de bois ou de terre.' WHERE name = 'Détection de la magie' AND ruleset = '5';

UPDATE `spells` SET description = 'Pour la durée du sort, vous savez si une aberration, un céleste, un élémentaire, une fée, un fiélon ou un mort-vivant est présent dans un rayon de 9 mètres autour de vous. Vous pouvez aussi déterminer sa localisation. De la même manière, vous savez si un objet ou un lieu à 9 mètres ou moins de vous a été consacré ou profané.

Le sort peut outrepasser la plupart des obstacles mais il est bloqué par 30 cm de pierre, 2,50 cm de métal ordinaire, une mince feuille de plomb ou 90 cm de bois ou de terre.' WHERE name = 'Détection du mal et du bien' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"consumed":true}', description = 'Jusqu''à ce que le sort prenne fin, une créature consentante que vous touchez est protégée contre certains types de créatures : les aberrations, les célestes, les élémentaires, les fées, les fiélons et les morts-vivants.

La protection confère un certain nombre de bénéfices. Les créatures de ces types ont un désavantage à leurs jets d''attaque effectués contre la cible. De plus, elles ne peuvent ni effrayer, ni charmer, ni posséder la cible. Si la cible est déjà charmée, effrayée, ou possédée par une telle créature, la cible a un avantage à tout nouveau jet de sauvegarde qu''elle effectuerait contre l''effet en question.' WHERE name = 'Protection contre le mal et le bien' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Un éclair silencieux fonce sur une créature de votre choix dans la portée du sort. Faites une attaque à distance avec un sort contre la cible. Si elle réussit, la cible subit 4d6 dégâts radiants et le prochain jet d''attaque effectué contre cette cible avant la fin du votre prochain tour bénéficie d''un avantage grâce à la lumière faible mystique qui illumine alors la cible.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts infligés augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Éclair traçant' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous bénissez jusqu''à trois créatures de votre choix, dans la portée du sort. À chaque fois qu''une cible fait un jet d''attaque ou de sauvegarde avant la fin du sort, la cible peut lancer un d4 et ajouter le résultat au jet d''attaque ou de sauvegarde.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Bénédiction' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'melee', description = 'Faites une attaque au corps à corps avec un sort contre une créature que vous pouvez toucher. En cas de réussite, la cible prend 3d10 dégâts nécrotiques.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d10 chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Blessure' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":25,"unit":"po"}', description = 'Que ce soit en jetant des bâtonnets incrustés de gemmes ou des osselets de dragon, en retournant des cartes ornées ou en usant d''autres outils divinatoires, vous recevez un présage de la part d''une entité surnaturelle à propos du résultat des actions que vous planifiez d''entreprendre au cours des 30 prochaines minutes. Le MD choisit de répondre à l''aide des présages suivants :

- **Fortune** : l''action a de bonnes chances d''être bénéfique.
- **Péril** : l''action aura des répercussions néfastes.
- **Péril et fortune** : les deux sont possibles.
- **Rien** : dans le cas où l''action ne devrait pas avoir de conséquences favorables ou néfastes.

Le sort ne considère pas les circonstances qui pourraient changer l''issue de la divination, comme l''incantation additionnelle de sorts ou la perte ou le gain d''un nouveau compagnon.

Si vous incantez le sort plus d''une fois avant la fin de votre prochain repos long, il y a une probabilité cumulative de 25 % de recevoir une réponse aléatoire, et ce, à chaque incantation après la première. Le MD fait ce jet en secret.' WHERE name = 'Augure' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous proposez un plan d''activité (limitée à une phrase ou deux) et influencez magiquement une créature que vous pouvez voir dans la portée du sort et qui peut vous entendre et vous comprendre. Les créatures qui ne peuvent pas être charmées sont à l''abri de cet effet. La suggestion doit être formulée de manière que la réalisation de l''action semble raisonnable. Demander à la créature de se poignarder, de s''empaler sur une lance, de s''immoler ou tout autre acte qui lui serait dommageable met un terme au sort.

La cible doit faire un jet de sauvegarde de Sagesse. En cas d''échec, elle poursuit le cours de l''action que vous avez décrit au mieux de ses possibilités. Le plan d''action proposé peut se poursuivre pendant toute la durée du sort. Si l''activité qui est suggérée peut être réalisée en un temps plus court, le sort prend fin lorsque le sujet termine ce qu''il lui a été demandé de faire.

Vous pouvez également spécifier des conditions qui déclencheront une activité spéciale pendant la durée du sort. Par exemple, vous pourriez suggérer à un chevalier de donner son cheval de bataille au premier mendiant qu''il rencontre. Si la condition n''est pas remplie avant que le sort expire, l''activité n''est pas effectuée.

Si vous, ou un de vos compagnons, blessez la cible, le sort se termine.' WHERE name = 'Suggestion' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'melee', description = 'Vous créez une arme spectrale qui flotte dans l''air, dans la portée et pour la durée du sort ou jusqu''à ce que vous incantiez ce sort à nouveau. Lorsque vous lancez ce sort, vous pouvez faire une attaque au corps à corps avec un sort contre une créature à 1,50 mètre ou moins de l''arme. Une attaque réussie inflige des dégâts de force équivalents à 1d8 + le modificateur de votre caractéristique d''incantation.

En tant qu''action bonus lors de votre tour, vous pouvez déplacer l''arme jusqu''à 6 mètres et réitérer l''attaque contre une créature à 1,50 mètre ou moins de l''arme.

L''arme peut prendre la forme de votre choix. Les clercs d''une divinité associée à une arme particulière (tel que Saint-Cuthbert connu pour sa masse d''armes ou Thor pour son marteau) peuvent faire en sorte que l''effet du sort prenne la forme de l''arme en question.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts infligés augmentent de 1d8 pour chaque niveau d''emplacement pair supérieur au niveau 2.' WHERE name = 'Arme spirituelle' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous pouvez aveugler ou assourdir un ennemi. Choisissez une créature que vous pouvez voir dans la portée du sort. Celle-ci doit réussir un jet de sauvegarde de Constitution sans quoi elle est soit aveuglée, soit assourdie (selon votre choix) pour la durée du sort. À la fin de chacun de ses tours, la cible effectue un jet de sauvegarde de Constitution. En cas de réussite, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 2.' WHERE name = 'Cécité/Surdité' AND ruleset = '5';

UPDATE `spells` SET description = 'Choisissez un humanoïde visible dans la portée du sort. La cible doit réussir un jet de sauvegarde de Sagesse ou être paralysée pour la durée du sort. À la fin de chacun de ses tours, la cible peut faire un autre jet de sauvegarde de Sagesse. Si elle réussit, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, vous pouvez cibler un humanoïde supplémentaire pour chaque niveau d''emplacement au-delà du niveau 2. Les humanoïdes doivent être situés à 9 mètres ou moins les uns des autres.' WHERE name = 'Immobilisation de personne' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":50,"unit":"po"}', description = 'Ce sort protège une créature consentante que vous touchez et crée une connexion mystique entre vous et la cible jusqu''à ce que le sort se termine. Aussi longtemps que la cible n''est pas éloignée de plus de 18 mètres de vous, elle gagne un bonus de +1 à la CA, +1 aux jets de sauvegarde et obtient une résistance à tous les dégâts. De plus, chaque fois qu''elle subit des dégâts, vous recevez la même quantité de dégâts.

Le sort se termine si vous tombez à 0 point de vie ou si vous et la cible êtes séparés de plus de 18 mètres de distance. Le sort prend également fin s''il est lancé à nouveau sur l''une des créatures connectées. Vous pouvez également rompre le sort au prix d''une action.' WHERE name = 'Lien de protection' AND ruleset = '5';

UPDATE `spells` SET description = 'Décrivez ou nommez un objet qui vous est familier. Vous ressentez la direction de la position de l''objet, tant que cet objet se trouve à 300 mètres de vous maximum. Si l''objet est en déplacement, vous apprenez la direction de son mouvement.

Ce sort peut localiser un objet spécifique que vous connaissez, à condition que vous l''ayez déjà vu de près (à 9 mètres ou moins de vous) au moins une fois. Vous pouvez sinon faire en sorte que le sort localise l''objet le plus proche d''un type particulier, comme un type spécifique de vêtement, de bijoux, de meuble, d''objet ou d''arme.

Ce sort ne peut pas localiser un objet si une épaisseur de plomb, même une mince feuille, s''interpose sur la ligne de mire qui vous sépare vous et l''objet.' WHERE name = 'Localisation d''objet' AND ruleset = '5';

UPDATE `spells` SET description = 'Jusqu''à six créatures de votre choix visibles dans la portée du sort récupèrent chacune des points de vie équivalant à 2d8 + le modificateur de votre caractéristique d''incantation. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les points de vie récupérés augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 2.' WHERE name = 'Prière de guérison' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous touchez une créature. Si elle est empoisonnée, vous neutralisez le poison. Si plus d''un poison affecte la cible, vous neutralisez un des poisons dont vous êtes conscient de la présence, sinon vous neutralisez l''un des poisons au hasard.

Pour toute la durée du sort, la cible a un avantage à ses jets de sauvegarde effectués pour éviter d''être empoisonnée, et a une résistance aux dégâts de poison.' WHERE name = 'Protection contre le poison' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous ressentez la présence de tout piège se trouvant à portée et dans votre champ de vision. Un piège, dans la définition de ce sort, comprend tout ce qui pourrait infliger un effet soudain ou inattendu, effet que vous considérez comme nuisible ou indésirable, et qui a spécifiquement été conçu dans cette optique par son créateur. Par conséquent, le sort devrait sentir une zone soumise au sort alarme, un glyphe de protection ou un piège mécanique de type fosse, mais il ne pourrait pas révéler une fragilité dans le sol, un plafond instable, ou un gouffre caché.

Ce sort révèle simplement qu''un piège est présent. Vous n''apprenez pas l''emplacement de chaque piège, mais vous apprenez la nature générale du danger que représente le piège que vous avez détecté.' WHERE name = 'Sens des pièges' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":4.5}', description = 'Vous créez une zone magique qui protège de la tromperie dans une sphère de 4,50 mètres de rayon centrée sur un point de votre choix à portée. Jusqu''à la dissipation du sort, une créature qui pénètre dans la zone du sort pour la première fois lors d''un tour ou qui y débute son tour, doit effectuer un jet de sauvegarde de Charisme. En cas d''échec, une créature ne peut pas délibérément dire un mensonge tant qu''elle se trouve dans la zone. Vous savez par ailleurs si une créature a réussi ou non son jet de sauvegarde.

Une créature affectée est consciente du sort et peut ainsi éviter de répondre à des questions auxquelles elle aurait normalement répondu par un mensonge. Une telle créature peut rester évasive dans ses réponses tant qu''elles restent dans les limites de la vérité.' WHERE name = 'Zone de vérité' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cube","size":6}', description = 'Vous définissez une alarme contre toute intrusion indésirable. Choisissez une porte, une fenêtre ou une zone à portée qui ne peut pas être supérieure à un cube de 6 mètres de côté. Jusqu''à la fin du sort, une alarme vous alerte à chaque fois qu''une créature Taille Minuscule ou plus grande touche ou pénètre dans la zone protégée. Quand vous lancez ce sort, vous pouvez désigner des créatures qui ne déclencheront pas l''alarme. Vous choisissez également si l''alarme est mentale ou sonore.

Une alarme mentale vous alerte par un tintement dans votre esprit si vous vous trouvez à moins de 1,6 kilomètre de la zone protégée. Ce tintement vous réveille si vous dormez. Une alarme sonore émet le son d''une clochette retentissant pendant 10 secondes dans un rayon de 18 mètres.' WHERE name = 'Alarme' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Vous projetez une lueur de feu condensée sur une créature ou un objet à portée. Effectuez un jet d''attaque de sort à distance. En cas de réussite, la cible subit 1d10 dégâts de feu. Un objet inflammable touché par ce sort s''enflamme s''il n''est pas porté ni transporté.

Les dégâts augmentent de 1d10 lorsque vous atteignez le niveau 5 (2d10), le niveau 11 (3d10), et le niveau 17 (4d10).' WHERE name = 'Trait de feu' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged' WHERE name = 'Rayon affaiblissant' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Vous créez une main fantomatique et squelettique dans l''espace d''une créature à portée. Effectuez un jet d''attaque de sort à distance. En cas de réussite, la cible subit 1d8 dégâts nécrotiques et ne peut pas récupérer de points de vie jusqu''au début de votre prochain tour. Jusqu''à ce moment-là, la main s''accroche à la cible.

Si vous touchez un mort-vivant, il a également le désavantage aux jets d''attaque contre vous jusqu''à la fin de votre prochain tour.

Les dégâts augmentent de 1d8 lorsque vous atteignez le niveau 5 (2d8), le niveau 11 (3d8), et le niveau 17 (4d8).' WHERE name = 'Contact glacial' AND ruleset = '5';

UPDATE `spells` SET description = 'Ce sort est un tour de passe-passe mineur qu''apprennent les apprentis mages pour pratiquer leurs talents magiques. Vous créez l''un des effets magiques suivants dans la portée du sort :

- vous créez un effet sensoriel instantané et inoffensif, tel qu''une douche d''étincelles, un coup de vent, de faibles notes de musique ou une odeur bizarre
- vous allumez ou éteignez instantanément une bougie, une torche ou un petit feu de camp
- vous nettoyez ou salissez instantanément un objet pas plus grand qu''un cube de 30 centimètres de côté
- vous refroidissez, réchauffez ou assaisonnez (jusqu''à 500 grammes de matière non vivante pendant 1 heure
- vous faites apparaître une couleur, une petite marque ou un symbole à la surface d''un objet ou d''une surface pendant 1 heure
- vous créez une babiole ou une image illusoire non magique qui peut tenir dans votre main et qui dure jusqu''à la fin de votre prochain tour.

Si vous lancez ce sort plusieurs fois, vous pouvez gérer simultanément jusqu''à trois effets non instantanés, et chaque effet peut être dissipé avec une action.' WHERE name = 'Prestidigitation' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous imprégniez d''une maudite énergie surnaturelle une créature que vous pouvez voir à portée. Jusqu''à la fin du sort, vous infligez 1d6 dégâts nécrotiques supplémentaires à la cible à chaque fois que vous la touchez avec une attaque. De plus, choisissez l''une des caractéristiques de la cible au moment où vous lancez le sort. La cible a le désavantage aux jets de caractéristique effectués avec la caractéristique choisie.

Si la cible tombe à 0 point de vie avant que ce sort ne prenne fin, vous pouvez utiliser une action bonus lors de votre tour suivant pour maudire une nouvelle créature.

Une dissipation de la magie peut mettre un terme à ce sort avant son expiration. Si vous lancez ce sort une nouvelle fois, la malédiction active prend fin prématurément.' WHERE name = 'Maléfice' AND ruleset = '5';

UPDATE `spells` SET description = 'Pendant la durée du sort, vous comprenez la signification littérale de tout langage parlé que vous entendez. Vous comprenez également tout langage écrit que vous voyez, mais vous devez toucher la surface sur laquelle les mots sont écrits. Il faut environ 1 minute pour lire une page de texte.

Ce sort ne décode pas les messages secrets dans un texte ni les glyphes qui ne font pas partie d''un langage écrit, comme les glyphes d''une rune de sort.' WHERE name = 'Compréhension des langues' AND ruleset = '5';

UPDATE `spells` SET description = 'Une force magique et protectrice vous entoure, se manifestant par un revêtement de givre spectral couvrant vous et vos vêtements. Vous gagnez 5 points de vie temporaires pour la durée du sort. Si une créature vous touche avec une attaque de corps à corps alors que vous avez ces points de vie temporaires, la créature subit 5 dégâts de froid.

Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les points de vie temporaires et les dégâts de froid augmentent tous les deux de 5 pour chaque niveau d''emplacement supérieur au niveau 1.' WHERE name = 'Armure d''Agathys' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cone","size":9}', description = 'Vous projetez une image fantasmagorique des pires craintes d''une créature. Chaque créature dans un cône de 9 mètres doit réussir un jet de sauvegarde de Sagesse. En cas d''échec, la créature lâche tout ce qu''elle tient et devient effrayée pour la durée du sort.

Une créature effrayée par ce sort doit prendre l''action Foncer et se déplacer à l''écart de vous par la route la plus rapide, à chaque tour, à moins qu''il n''y ait nulle part où aller. Si la créature finit son tour dans un endroit où elle ne peut pas vous voir, elle peut faire un jet de sauvegarde de Sagesse. En cas de réussite, le sort se termine pour elle.' WHERE name = 'Peur' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous touchez une créature consentante. La cible gagne une vitesse de vol de 18 mètres pour la durée du sort. Quand le sort se termine, si la cible est encore dans les airs, elle chute à moins qu''elle ne puisse interrompre la chute.

Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement supérieur au niveau 3.' WHERE name = 'Vol' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"square","size":6}', description = 'Des tentacules noirs et tordus tapissent le sol dans un rayon de 6 mètres centré sur un point à portée. Pendant la durée du sort, ces tentacules transforment le sol de la zone en terrain difficile.

Lorsqu''une créature pénètre dans la zone affectée pour la première fois lors d''un tour ou y commence son tour, elle doit réussir un jet de sauvegarde de Dextérité ou subir 3d6 dégâts contondants et être entravée par les tentacules jusqu''à la fin du sort. Une créature qui commence son tour dans la zone et est déjà entravée subit 3d6 dégâts contondants.

Une créature entravée par les tentacules peut utiliser son action pour faire un jet de Force ou de Dextérité (son choix) contre votre DD de sauvegarde de sorts. En cas de réussite, elle se libère.' WHERE name = 'Tentacules noirs d''Evard' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Un rayon de lumière crépitante jaillit vers une créature à portée. Effectuez une attaque de sort à distance contre la cible. Si l''attaque touche, la cible subit 1d10 dégâts de force.

Le sort crée plus de rayons quand vous montez en niveaux : deux rayons au niveau 5, trois rayons au niveau 11 et quatre rayons au niveau 17. Vous pouvez viser la même créature ou des créatures différentes avec ces rayons. Effectuez un jet d''attaque séparé pour chaque rayon.' WHERE name = 'Décharge occulte' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":1,"unit":"pa"}', description = 'Dans le cadre de l''action utilisée pour lancer ce sort, vous devez effectuer une attaque avec une arme de corps à corps contre une créature à portée, sinon le sort échoue. Si l''attaque touche, l''arme inflige ses dégâts normaux, et une flamme verte jaillit vers une seconde créature de votre choix à 1,50 m de la première. Cette seconde créature subit des dégâts de feu égaux à votre modificateur d''incantation.

À partir du niveau 5, l''attaque inflige 1d8 dégâts de feu supplémentaires à la cible initiale, et les dégâts à la seconde créature passent à 1d8 + votre modificateur d''incantation.' WHERE name = 'Lame aux flammes vertes' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous lancez une piqûre d''énergie psychique déstabilisante sur une créature que vous pouvez voir à portée. La cible doit réussir un jet de sauvegarde d''Intelligence ou subir 1d6 dégâts psychiques et soustraire 1d4 de son prochain jet de sauvegarde avant la fin de votre prochain tour.

Les dégâts augmentent de 1d6 quand vous atteignez le niveau 5 (2d6), le niveau 11 (3d6) et le niveau 17 (4d6).' WHERE name = 'Piqûre mentale' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous étendez la main vers une créature que vous pouvez voir à portée et projetez une bouffée de gaz nauséabond. La créature doit réussir un jet de sauvegarde de Constitution ou subir 1d12 dégâts de poison.

Les dégâts augmentent de 1d12 quand vous atteignez le niveau 5 (2d12), le niveau 11 (3d12) et le niveau 17 (4d12).' WHERE name = 'Bouffée de poison' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":1,"unit":"pa"}', description = 'Dans le cadre de l''action utilisée pour lancer ce sort, vous effectuez une attaque avec une arme de corps à corps contre une créature à portée. Si l''attaque touche, la cible subit les dégâts normaux de l''arme et est entourée d''une énergie tonique jusqu''au début de votre prochain tour. Si la cible se déplace volontairement d''au moins 1,50 m, elle subit 1d8 dégâts de tonnerre.

Au niveau 5 : les dégâts au mouvement passent à 2d8. Au niveau 11 : l''attaque inflige aussi 1d8 dégâts de tonnerre, les dégâts au mouvement passent à 3d8. Au niveau 17 : dégâts initiaux 2d8, dégâts au mouvement 4d8.' WHERE name = 'Lame retentissante' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"emanation","size":3}', description = 'Vous invoquez la puissance de Hadar et des tentacules de ténèbres obscures émanent de vous. Chaque créature dans un rayon de 3 mètres autour de vous doit effectuer un jet de sauvegarde de Force. En cas d''échec, elle subit 2d6 dégâts nécrotiques et ne peut pas prendre de réaction jusqu''à son prochain tour. En cas de réussite, elle subit la moitié des dégâts et n''est pas entravée.

**Aux niveaux supérieurs** : les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du 1er.' WHERE name = 'Tentacules de Hadar' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous façonnez une illusion dans l''esprit d''une créature que vous pouvez voir à portée. La cible doit effectuer un jet de sauvegarde d''Intelligence. En cas d''échec, vous créez un objet, une créature ou un phénomène fantasmagorique de taille G ou plus petite, perceptible uniquement par elle.

Tant qu''elle est affectée, la cible traite le fantasme comme réel. Elle peut utiliser son action pour examiner l''illusion (Intelligence/Investigation contre votre DD). En cas de réussite, le sort prend fin. Si le fantasme est dangereux, la cible subit 1d6 dégâts psychiques à chaque tour passé dans son espace.' WHERE name = 'Force fantasmagorique' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":6}', description = 'Vous ouvrez un portail vers l''obscurité glacée qui règne entre les étoiles. Une sphère de ténèbres absolues de 6 mètres de rayon apparaît, centrée sur un point à portée : aucune lumière, magique ou non, ne peut l''illuminer, et la zone devient un terrain difficile empli de murmures affamés.

Une créature qui commence son tour dans la zone subit 2d6 dégâts de froid, sans jet de sauvegarde. Une créature qui termine son tour dans la zone doit réussir un jet de sauvegarde de Dextérité, sous peine de subir 2d6 dégâts d''acide alors que des tentacules faméliques la lacèrent.' WHERE name = 'Voracité de Hadar' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cube","size":9}', description = 'Vous créez un motif lumineux et tourbillonnant dans une zone cubique de 9 mètres d''arête à portée. Chaque créature dans la zone qui peut le voir doit réussir un jet de sauvegarde de Sagesse. En cas d''échec, elle est charmée pour la durée : neutralisée et vitesse nulle.

Le sort prend fin pour une créature affectée si elle subit des dégâts ou si quelqu''un utilise son action pour la secouer.' WHERE name = 'Motif hypnotique' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous tentez de charmer une créature que vous pouvez voir à portée. Elle effectue un jet de sauvegarde de Sagesse avec avantage si vous ou vos alliés êtes en train de la combattre. En cas d''échec, elle est charmée par vous jusqu''à la fin du sort ou jusqu''à ce que vous ou vos alliés lui infligiez des dégâts.

**Aux niveaux supérieurs** : une créature supplémentaire pour chaque niveau d''emplacement au-delà du 4e.' WHERE name = 'Charme-monstre' AND ruleset = '5';

UPDATE `spells` SET description = 'L''énergie nécromantique envahit une créature à portée, lui suçant vie et humidité. La cible effectue un jet de sauvegarde de Constitution. En cas d''échec, elle subit 8d8 dégâts nécrotiques ; en cas de réussite, la moitié. Sans effet sur les morts-vivants ou les artificiels.

Si vous ciblez une plante ou une créature végétale, elle effectue son jet avec désavantage et le sort inflige le maximum de dégâts.

**Aux niveaux supérieurs** : les dégâts augmentent de 1d8 pour chaque niveau au-delà du 4e.' WHERE name = 'Flétrissement' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":6}' WHERE name = 'Perturbations synaptiques' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":10,"unit":"po","consumed":true}' WHERE name = 'Appel de familier' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous placez votre conscience en contact avec un demi-dieu, l''esprit d''un sage décédé, ou quelque autre entité mystérieuse depuis un autre plan d''existence. Le contact avec cette intellect aux pouvoirs extraplanaires est épuisant, voire mortel, et peut vous rendre fou.

Vous posez à l''entité jusqu''à cinq questions. Vous devez poser chaque question avant que le sort ne prenne fin. Le MD détermine la réponse à chaque question et peut répondre par une courte phrase, vous décrire une vision ou affirmer qu''il ne sait pas. Dans ce dernier cas, il n''y a pas d''effet négatif.

Si la communication s''interrompt prématurément, vous avez un taux d''échec de 1 sur un d6 pour chaque tentative de contact suivante.' WHERE name = 'Contact avec un autre plan' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":18}', material_cost = '{"amount":500,"unit":"po"}', description = 'Une sphère d''énergie négative déferle en une sphère de 18 mètres de rayon centrée sur un point à portée. Chaque créature dans la zone doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, elle subit 8d6 dégâts nécrotiques ; en cas de réussite, la moitié.

**Aux niveaux supérieurs** : les dégâts augmentent de 2d6 par niveau d''emplacement au-delà du 6e.' WHERE name = 'Cercle de mort' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous invoquez une créature féerique d''un facteur de puissance maximal de 6, ou un esprit féerique qui prend la forme d''une bête d''un facteur de puissance maximal de 6. Elle apparaît dans un espace inoccupé visible à portée et disparaît quand elle tombe à 0 PV ou que le sort prend fin.

La créature est amicale envers vous et vos compagnons. Lancez l''initiative pour la créature qui agit à son propre tour. Elle obéit à vos ordres verbaux (aucune action requise). Sans ordre, elle se défend mais n''agit pas autrement.

Si votre concentration est brisée, la créature ne disparaît pas mais devient hostile et vous attaque, vous et vos compagnons, pendant 1 heure avant de disparaître.

**Aux niveaux supérieurs** : le facteur de puissance augmente de 1 pour chaque niveau au-delà du 6e.' WHERE name = 'Invocation de fée' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":150,"unit":"po"}', material = 'un pot d''argile rempli de terre prélevée sur une tombe, un pot d''argile rempli d''eau croupie, et une pierre d''onyx noire valant au moins 150 po pour chaque cadavre', description = 'Lancé de nuit, ce sort cible jusqu''à trois cadavres d''humanoïdes de taille M ou P, situés à portée. Chaque cadavre devient une goule sous votre contrôle. Vous pouvez lui donner des ordres mentaux (action bonus) si elle est à 36 mètres ou moins. Vous gardez le contrôle pendant 24 heures, après quoi la créature cesse d''obéir. Vous pouvez maintenir le contrôle en relançant le sort sur la même créature avant l''écoulement des 24h.

**Aux niveaux supérieurs** : créatures plus nombreuses ou plus puissantes (goules niv 7, goules / ombres niv 8, goules / ombres / liches mineures niv 9). Précisions PHB.' WHERE name = 'Création de mort-vivant' AND ruleset = '5';

UPDATE `spells` SET description = 'Un fin rayon vert jaillit de votre doigt vers une cible à portée : créature, objet non magique de taille humanoïde ou inférieure, ou création magique de force (mur de force, etc.).

Une créature ciblée doit effectuer un jet de sauvegarde de Dextérité. En cas d''échec, elle subit 10d6 + 40 dégâts de force. Si ses PV tombent à 0, elle est désintégrée — il ne reste que de la poussière. Seul un souhait peut la ramener.

Un objet ou une création magique est entièrement désintégré.

**Aux niveaux supérieurs** : 3d6 dégâts supplémentaires par niveau au-delà du 6e.' WHERE name = 'Désintégration' AND ruleset = '5';

UPDATE `spells` SET description = 'Pour la durée du sort, vos yeux deviennent inhumains. À chaque tour, vous pouvez utiliser une action bonus pour cibler une créature visible à 18 mètres ou moins. Elle effectue un jet de sauvegarde de Sagesse. En cas d''échec, elle est affectée par l''un des effets suivants au choix, jusqu''à la fin du sort ou qu''elle réussisse son sauvegarde de nouveau à la fin de chacun de ses tours :

- **Asthénie** : désavantage aux jets d''attaque et de caractéristique. Pas de nouveau jet de sauvegarde.
- **Panique** : effrayée. Doit s''éloigner de vous à chaque tour ; pas d''action de Tirer profit ou de Foncer.
- **Sommeil** : tombe inconsciente. S''éveille en subissant des dégâts ou si quelqu''un la secoue.

Une créature peut être ciblée par un effet à la fois.' WHERE name = 'Mauvais oeil' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":25,"unit":"po","consumed":true}', material = 'une pommade pour les yeux coûtant 25 po ; elle est fabriquée à partir d''une poudre de champignon, de safran et de graisse, et est consommée par le sort' WHERE name = 'Vision suprême' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":1500,"unit":"po"}', description = 'Une prison immobile et invisible faite de force magique apparaît à portée et y demeure pour la durée. Vous choisissez : cage cubique de 6 m de côté avec des barreaux espacés de 1,3 cm, ou boîte solide de 3 m de côté.

Une créature entièrement à l''intérieur ne peut en sortir par aucun moyen non magique. Téléportation et déplacement entre les plans sont impossibles tant qu''elle reste dans la cage, sauf jet de sauvegarde de Charisme réussi (sort de niveau 1 ou plus). Échec → perdu, sort gaspillé.

La cage ne peut être dissipée par dissipation de la magie.' WHERE name = 'Cage de force' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous envoyez une énergie négative en parcourant le corps d''une créature à portée, lui infligeant souffrance déchirante. La cible effectue un jet de sauvegarde de Constitution. Échec : 7d8 + 30 dégâts nécrotiques. Réussite : la moitié.

Un humanoïde tué par ce sort se relève au début de votre prochain tour en tant que zombie sous votre contrôle permanent. Il suit vos ordres verbaux.' WHERE name = 'Doigt de mort' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous pénétrez dans la zone limite du Plan Éthéré, qui jouxte le Plan Matériel. Vous y restez pour la durée ou jusqu''à utiliser votre action pour dissiper le sort. Pendant ce temps, vous traversez les objets et la matière à votre vitesse normale, et vous êtes invisible pour les créatures hors du Plan Éthéré. Seules d''autres créatures éthérées peuvent vous voir et interagir avec vous.

**Aux niveaux supérieurs** (8e+) : ciblez jusqu''à trois créatures consentantes par niveau au-delà du 7e.' WHERE name = 'Forme éthérée' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'melee', material_cost = '{"amount":250,"unit":"po"}', material = 'une petite baguette fourchue en métal d''une valeur d''au moins 250 po, affiliée à un plan d''existence particulier' WHERE name = 'Changement de plan' AND ruleset = '5';

UPDATE `spells` SET description = 'Les créatures de votre choix que vous pouvez voir à portée et qui peuvent vous entendre doivent effectuer un jet de sauvegarde de Sagesse. Une cible est charmée pour la durée si elle rate son jet.

Jusqu''à la fin du sort, vous pouvez utiliser une action bonus à chacun de vos tours pour désigner une direction horizontale. Chaque cible affectée doit utiliser tout son mouvement possible dans cette direction lors de son prochain tour. Elle peut faire son action avant de se déplacer, puis effectuer un nouveau jet de sauvegarde à la fin de chaque tour de son déplacement pour mettre fin à l''effet sur elle. Une cible n''est pas contrainte de se déplacer vers une menace évidente, mais subit les attaques d''opportunité normalement.' WHERE name = 'Compulsion' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":25,"unit":"po","consumed":true}' WHERE name = 'Antidétection' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cylinder","size":3,"height":6}', material_cost = '{"amount":100,"unit":"po","consumed":true}', description = 'Vous tracez un cylindre de 3 mètres de rayon et de 6 mètres de haut, centré sur un point à portée, qui demeure pour la durée. Choisissez un ou plusieurs types de créatures parmi célestes, élémentaires, fées, fiélons et morts-vivants. Les créatures ainsi désignées ont un désavantage à leurs jets d''attaque contre les cibles à l''intérieur du cylindre ; elles ne peuvent ni les charmer, ni les effrayer, ni les posséder, et ne peuvent franchir la barrière qu''en réussissant un jet de sauvegarde de Charisme. Vous pouvez aussi inverser le sort pour piéger une créature à l''intérieur.

**Aux niveaux supérieurs**, la durée augmente d''une heure pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Cercle magique' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":100,"unit":"po"}' WHERE name = 'Clairvoyance' AND ruleset = '5';

UPDATE `spells` SET description = 'Choisissez une créature, un objet ou un effet magique à portée. Tout sort de niveau 3 ou inférieur qui l''affecte prend fin. Pour chaque sort de niveau 4 ou supérieur qui l''affecte, effectuez un test de votre caractéristique d''incantation (DD égal à 10 + le niveau de ce sort) : en cas de réussite, le sort prend fin.

**Aux niveaux supérieurs**, vous mettez automatiquement fin aux sorts dont le niveau est inférieur ou égal à celui de l''emplacement utilisé.' WHERE name = 'Dissipation de la magie' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"emanation","size":4.5}', description = 'Des esprits protecteurs se mettent à tournoyer dans un rayon de 4,50 mètres autour de vous pour la durée du sort. La zone devient un terrain difficile pour vos ennemis. Lorsqu''une créature hostile y pénètre pour la première fois à un tour ou y commence son tour, elle doit réussir un jet de sauvegarde de Sagesse ou subir 3d8 dégâts, radiants ou nécrotiques selon le choix fait à l''incantation ; en cas de réussite, elle n''en subit que la moitié.

**Aux niveaux supérieurs**, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Esprits gardiens' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":6}', material_cost = '{"amount":200,"unit":"po","consumed":true}', description = 'Vous inscrivez un glyphe piégé sur une surface ou dans un objet pouvant être refermé. Quand survient la condition de déclenchement que vous définissez, le glyphe s''active. En mode « runes explosives », il libère une déflagration de 6 mètres de rayon : chaque créature de la zone effectue un jet de sauvegarde de Dextérité et subit 5d8 dégâts (acide, feu, foudre, froid ou tonnerre, au choix) en cas d''échec, la moitié en cas de réussite. En mode « sort stocké », le glyphe recèle un sort de niveau 3 ou inférieur, lancé au déclenchement.

**Aux niveaux supérieurs**, les dégâts des runes explosives augmentent de 1d8 pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Glyphe de protection' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":18}' WHERE name = 'Lumière du jour' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous touchez une créature qui doit réussir un jet de sauvegarde de Sagesse sous peine d''être maudite pour la durée du sort. À l''incantation, choisissez la nature de la malédiction : désavantage aux jets utilisant une caractéristique de votre choix ; désavantage à ses jets d''attaque contre vous ; une chance sur deux de perdre son action à chaque tour ; ou vos attaques infligent 1d8 dégâts nécrotiques supplémentaires à la cible.

**Aux niveaux supérieurs**, la durée s''allonge (jusqu''à ne plus exiger de concentration) en fonction du niveau d''emplacement utilisé.' WHERE name = 'Malédiction' AND ruleset = '5';

UPDATE `spells` SET description = 'Jusqu''à six créatures de votre choix, visibles à portée, récupèrent chacune un nombre de points de vie égal à 1d4 + le modificateur de votre caractéristique d''incantation. Ce sort n''a aucun effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**, les points de vie récupérés augmentent de 1d4 pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Mot de guérison de groupe' AND ruleset = '5';

UPDATE `spells` SET material_cost = '{"amount":300,"unit":"po","consumed":true}' WHERE name = 'Retour à la vie' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous sacrifiez une part de votre force vitale. Vous subissez 4d8 dégâts nécrotiques, sans réduction possible, et une créature de votre choix visible à portée récupère un nombre de points de vie égal au double des dégâts que vous venez de subir.

**Aux niveaux supérieurs**, les dégâts (et donc les soins prodigués) augmentent de 1d8 pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Transfert de vie' AND ruleset = '5';

UPDATE `spells` SET description = 'Une pâle imitation nécromantique de la vie vous enveloppe : vous gagnez 1d4 + 4 points de vie temporaires pour la durée du sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous gagnez 5 points de vie temporaires de plus pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Simulacre de vie' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous modifiez votre apparence — vêtements, armure, armes et équipement compris — jusqu''à la fin du sort ou jusqu''à ce que vous y mettiez fin par une action. Vous pouvez paraître 30 centimètres plus grand ou plus petit, et plus mince ou plus corpulent, mais vous ne pouvez pas changer de morphologie : vos membres doivent rester disposés de la même façon.

L''illusion ne résiste pas à l''examen tactile : une main passe à travers un chapeau illusoire, par exemple. Une créature qui consacre son action à vous inspecter perce le déguisement si elle réussit un test d''Intelligence (Investigation) contre le DD de sauvegarde de vos sorts.' WHERE name = 'Déguisement' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous créez l''image d''un objet, d''une créature ou d''un phénomène visible, tenant dans un cube de 4,50 mètres d''arête, à un endroit de votre choix à portée. L''image est purement visuelle : ni son, ni odeur, ni autre effet sensoriel. Par une action, vous pouvez la déplacer n''importe où à portée et ajuster son apparence pour que le mouvement paraisse naturel.

Toute interaction physique révèle la supercherie, puisque les objets la traversent. Une créature qui consacre son action à l''examiner perce l''illusion si elle réussit un test d''Intelligence (Investigation) contre le DD de sauvegarde de vos sorts ; elle voit alors au travers.' WHERE name = 'Image silencieuse' AND ruleset = '5';

UPDATE `spells` SET description = 'Jusqu''à trois créatures visibles à portée doivent réussir un jet de sauvegarde de Charisme. Chaque cible qui échoue doit, jusqu''à la fin du sort, lancer 1d4 et soustraire le résultat de chacun de ses jets d''attaque et de ses jets de sauvegarde.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous ciblez une créature de plus pour chaque niveau d''emplacement au-delà du niveau 1.' WHERE name = 'Fléau' AND ruleset = '5';

UPDATE `spells` SET description = 'Une créature ou un objet non tenu, visible à portée, s''élève jusqu''à 6 mètres et reste en suspension pour la durée du sort ; le sort ne peut pas soulever plus de 250 kilogrammes. Une créature récalcitrante qui réussit un jet de sauvegarde de Constitution n''est pas affectée.

La cible ne peut se déplacer qu''en se poussant ou en se tirant sur un objet ou une surface à sa portée, comme si elle grimpait. À chacun de vos tours, vous pouvez la faire monter ou descendre de 6 mètres ; si vous n''êtes pas la cible, il vous faut une action pour la déplacer, et elle doit rester à portée. Quand le sort prend fin, la cible redescend doucement au sol.' WHERE name = 'Lévitation' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous endossez une nouvelle forme et choisissez à l''incantation l''une des trois options ci-dessous ; par une action, vous pouvez en changer tant que le sort dure.

Adaptation aquatique : vous développez branchies et palmures, vous respirez sous l''eau et gagnez une vitesse de nage égale à votre vitesse de marche.

Changement d''apparence : vous remodelez votre allure (taille, corpulence, traits du visage, voix, pilosité, teint…), y compris pour ressembler à un membre d''une autre race, sans rien gagner de ses traits. Votre catégorie de taille et votre morphologie de base ne changent pas.

Armes naturelles : vous vous dotez de griffes, crocs, cornes ou d''une arme naturelle équivalente. Votre attaque à mains nues inflige 1d6 dégâts contondants, perforants ou tranchants selon l''arme choisie, vous en avez la maîtrise, et elle compte comme une arme magique dotée d''un bonus de +1 aux jets d''attaque et de dégâts.' WHERE name = 'Modification d''apparence' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cube","size":12}', description = 'Vous distordez le temps autour de six créatures au maximum, choisies dans un cube de 12 mètres d''arête à portée. Chaque cible doit réussir un jet de sauvegarde de Sagesse ou être affectée pour la durée du sort.

Une créature affectée voit sa vitesse divisée par deux, subit un malus de -2 à sa CA et à ses jets de sauvegarde de Dextérité, et ne peut plus utiliser de réaction. À son tour, elle ne peut prendre qu''une action ou une action bonus, pas les deux, et ne peut effectuer qu''une seule attaque, quels que soient ses capacités ou ses objets magiques. Si elle lance un sort dont le temps d''incantation est d''une action, lancez 1d20 : sur 11 ou plus, le sort ne prend effet qu''à la fin de son tour suivant et elle doit y consacrer son action ; sinon, il est perdu.

À la fin de chacun de ses tours, une créature affectée peut refaire le jet de sauvegarde ; en cas de réussite, l''effet cesse pour elle.' WHERE name = 'Lenteur' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":3}', description = 'Vous assaillez les esprits dans une sphère de 3 mètres de rayon centrée sur un point à portée. Chaque créature de la zone doit réussir un jet de sauvegarde de Sagesse ou être affectée.

Une cible affectée ne peut plus réagir et lance 1d10 au début de chacun de ses tours pour déterminer son comportement : sur 1, elle emploie tout son mouvement à se déplacer dans une direction aléatoire (1d8) et n''agit pas ; de 2 à 6, elle ne bouge pas et n''agit pas ; sur 7 ou 8, elle attaque au corps à corps une créature à sa portée choisie au hasard, ou ne fait rien si aucune n''est à portée ; sur 9 ou 10, elle agit et se déplace normalement.

À la fin de chacun de ses tours, une cible peut refaire le jet de sauvegarde ; en cas de réussite, l''effet cesse pour elle.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, le rayon de la sphère augmente de 1,50 mètre pour chaque niveau d''emplacement au-delà du niveau 4.' WHERE name = 'Confusion' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous transformez une créature visible à portée. Une cible récalcitrante annule l''effet en réussissant un jet de sauvegarde de Sagesse ; le sort n''a aucune prise sur un métamorphe ou une créature à 0 point de vie.

La nouvelle forme est celle d''une bête dont le facteur de puissance ne dépasse pas celui de la cible (ou son niveau, à défaut de facteur de puissance). Les statistiques de la cible, y compris mentales, sont remplacées par celles de la bête ; elle conserve son alignement et sa personnalité, mais ne peut ni parler, ni lancer de sorts, ni rien entreprendre qui demande des mains ou la parole. Son équipement fusionne avec la nouvelle forme et devient inutilisable.

La cible adopte les points de vie de la bête et retrouve les siens en reprenant sa forme normale. Si elle y est ramenée par une chute à 0 point de vie, les dégâts excédentaires s''appliquent à sa forme normale ; tant qu''ils ne la réduisent pas elle-même à 0, elle ne tombe pas inconsciente.' WHERE name = 'Métamorphose' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous créez à portée un œil magique invisible qui flotte dans les airs pour la durée du sort. Vous en recevez une image mentale : il voit dans toutes les directions, avec une vision normale et une vision dans le noir jusqu''à 9 mètres.

Par une action, vous le déplacez de 9 mètres dans la direction de votre choix. Aucune distance maximale ne vous sépare de lui, mais il ne peut pas changer de plan d''existence. Les obstacles solides l''arrêtent, même s''il se faufile par toute ouverture d''au moins 2,50 centimètres de diamètre.' WHERE name = 'Oeil magique' AND ruleset = '5';

UPDATE `spells` SET description = 'Choisissez une créature visible à portée. Elle doit réussir un jet de sauvegarde de Sagesse ou être paralysée pour la durée du sort ; les morts-vivants y sont insensibles. À la fin de chacun de ses tours, la cible peut refaire le jet de sauvegarde et met fin au sort pour elle en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, vous ciblez une créature de plus pour chaque niveau d''emplacement au-delà du niveau 5 ; toutes les cibles doivent alors se trouver à 9 mètres les unes des autres.' WHERE name = 'Immobilisation de monstre' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous appelez un serviteur élémentaire. Désignez à portée un cube de 3 mètres d''arête empli d''air, de terre, de feu ou d''eau : un élémentaire de facteur de puissance 5 au plus, adapté à cet élément, apparaît dans un espace inoccupé à 3 mètres ou moins de cette zone. Il disparaît à 0 point de vie ou quand le sort prend fin.

L''élémentaire vous est amical, à vous et à vos compagnons, et joue ses propres tours ; il obéit aux ordres verbaux que vous lui donnez sans que cela vous coûte une action, et se contente de se défendre si vous ne lui en donnez aucun.

Si votre concentration est rompue, il ne disparaît pas mais vous échappe : il devient hostile, peut vous attaquer, ne peut plus être renvoyé et s''évanouit une heure après avoir été invoqué.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, le facteur de puissance de l''élémentaire augmente de 1 pour chaque niveau d''emplacement au-delà du niveau 5.' WHERE name = 'Invocation d''élémentaire' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Un rayon de lumière blanche et bleutée jaillit vers une créature à portée. Effectuez un jet d''attaque de sort à distance ; en cas de réussite, la cible subit 1d8 dégâts de froid et sa vitesse est réduite de 3 mètres jusqu''au début de votre prochain tour.

Les dégâts augmentent de 1d8 aux niveaux 5 (2d8), 11 (3d8) et 17 (4d8).' WHERE name = 'Rayon de givre' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous créez un son ou l''image d''un objet à portée, qui persiste pour la durée du sort. L''illusion prend fin si vous la dissipez par une action ou si vous relancez ce sort.

Un son a un volume allant du murmure au cri. Une image visuelle (objet, créature ou autre phénomène) doit tenir dans un cube de 1,50 mètre d''arête, reste muette et ne produit aucun autre effet sensoriel. Une créature peut, par une action, faire un test d''Intelligence (Investigation) contre votre DD de sauvegarde des sorts pour discerner la supercherie.' WHERE name = 'Illusion mineure' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous tentez de charmer une humanoïde que vous pouvez voir à portée. Elle effectue un jet de sauvegarde de Sagesse, avec avantage si vous ou vos compagnons êtes en train de la combattre. En cas d''échec, elle est charmée par vous jusqu''à la fin du sort ou jusqu''à ce que vous ou vos compagnons lui infligiez du mal. Elle vous considère alors comme une connaissance amicale ; quand le sort prend fin, elle sait qu''elle a été charmée.

**Aux niveaux supérieurs** : une cible supplémentaire par niveau d''emplacement au-delà du 1er (les cibles doivent être à 9 mètres les unes des autres).' WHERE name = 'Charme-personne' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"sphere","size":6}', description = 'Une traînée lumineuse jaillit de votre doigt vers un point à portée, où elle explose en une gerbe de flammes. Chaque créature dans une sphère de 6 mètres de rayon centrée sur ce point effectue un jet de sauvegarde de Dextérité : elle subit 8d6 dégâts de feu en cas d''échec, la moitié en cas de réussite. Le feu contourne les angles et embrase les objets inflammables non portés ni transportés.

**Aux niveaux supérieurs** : +1d6 dégâts pour chaque niveau d''emplacement au-delà du 3e.' WHERE name = 'Boule de feu' AND ruleset = '5';

UPDATE `spells` SET attack_type = 'ranged', description = 'Vous projetez une énergie chaotique et fluctuante vers une créature à portée. Effectuez un jet d''attaque de sort à distance ; en cas de réussite, la cible subit 2d8 + 1d6 dégâts. Lancez les deux d8 : le plus faible des deux détermine le type de dégâts (1 acide, 2 froid, 3 feu, 4 foudre, 5 poison, 6 psychique, 7 tonnerre, 8 force). Si les deux d8 donnent le même résultat, l''énergie rebondit après avoir infligé les dégâts vers une autre cible à 9 mètres ou moins ; relancez alors l''attaque, et ainsi de suite tant que les deux d8 restent identiques (chaque cible ne pouvant être touchée qu''une fois).

**Aux niveaux supérieurs** : le dé de rebond (1d6) gagne +1d6 par niveau d''emplacement au-delà du 1er.' WHERE name = 'Éclair de chaos' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cube","size":6}', description = 'Vous invoquez la magie facétieuse des fées dans un cube de 6 mètres d''arête à portée. Au début de chacun de vos tours, lancez un d4 pour déterminer l''effet aléatoire qui s''applique aux créatures de votre choix dans le cube :

1. désavantage aux jets d''attaque (fous rires)
2. jet de sauvegarde de Sagesse ou effrayée
3. jet de sauvegarde de Constitution ou incapable de parler autrement qu''en gloussant
4. jet de sauvegarde de Sagesse ou charmée par une illusion inoffensive.

Les effets à jet de sauvegarde utilisent votre DD de sauvegarde des sorts et durent jusqu''au début de votre prochain tour.' WHERE name = 'Espièglerie de nathair' AND ruleset = '5';

UPDATE `spells` SET area_of_effect = '{"shape":"cube","size":6}' WHERE name = 'Lueurs féeriques' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous agrandissez ou rapetissez une créature ou un objet à portée pour la durée du sort ; une cible non consentante peut y échapper avec un jet de sauvegarde de Constitution.

- **Agrandissement** : la cible passe à la catégorie de taille supérieure, ses dimensions doublent et son poids est multiplié par huit ; elle a l''avantage aux tests et jets de sauvegarde de Force, et ses attaques d''arme infligent 1d4 dégâts supplémentaires.
- **Rapetissement** : la cible passe à la catégorie de taille inférieure, ses dimensions sont réduites de moitié ; elle a le désavantage aux tests et jets de sauvegarde de Force, et ses attaques d''arme infligent 1d4 dégâts en moins (minimum 1).' WHERE name = 'Agrandissement/rapetissement' AND ruleset = '5';

UPDATE `spells` SET description = 'Vous murmurez une mélodie discordante que seule une créature de votre choix à portée peut entendre, et qui la tourmente atrocement. La cible effectue un jet de sauvegarde de Sagesse. En cas d''échec, elle subit 3d6 dégâts psychiques et doit immédiatement utiliser sa réaction, si elle en dispose, pour s''éloigner de vous aussi loin que sa vitesse le lui permet (sans traverser de terrain manifestement dangereux, comme un feu ou une fosse). En cas de réussite, elle subit la moitié des dégâts et n''a pas à s''éloigner. Une créature assourdie réussit automatiquement son jet de sauvegarde.

**Aux niveaux supérieurs** : +1d6 dégâts pour chaque niveau d''emplacement au-delà du 1er.' WHERE name = 'Murmures dissonants' AND ruleset = '5';

UPDATE `spells` SET description = 'Pour la durée du sort, vous pouvez lire les pensées de certaines créatures. Au moment de l''incantation, puis par une action à chacun de vos tours, vous pouvez concentrer votre esprit sur une créature que vous voyez à 9 mètres ou moins. Une créature d''Intelligence 3 ou moins, ou qui ne parle aucune langue, n''est pas affectée.

Vous percevez d''abord ses pensées superficielles, ce qui occupe son esprit à cet instant. Par une action, vous pouvez soit porter votre attention sur une autre créature, soit sonder plus profondément l''esprit de la même : elle effectue alors un jet de sauvegarde de Sagesse. En cas d''échec, vous accédez à son raisonnement, à son état émotionnel et à ce qui la préoccupe le plus (ses peurs, ses désirs, ce qu''elle aime ou déteste) ; en cas de réussite, le sort prend fin. Dans les deux cas, la cible sait que vous sondez son esprit et, à moins que vous ne portiez votre attention ailleurs, elle peut utiliser son action à son tour pour effectuer un test d''Intelligence opposé au vôtre ; si elle l''emporte, le sort prend fin. Les questions que vous lui posez oralement orientent naturellement le cours de ses pensées, ce qui rend le sort très efficace lors d''un interrogatoire.

Vous pouvez aussi utiliser le sort pour détecter la présence de créatures pensantes que vous ne voyez pas, dans un rayon de 9 mètres (hors Intelligence 3 ou moins et créatures sans langue). Le sort traverse la plupart des obstacles, mais il est bloqué par 60 centimètres de pierre, 5 centimètres de métal autre que le plomb ou une fine feuille de plomb. Vous ne pouvez pas lire les pensées d''une créature ainsi détectée, mais vous savez qu''elle est là ; une fois que vous la voyez, vous pouvez vous concentrer sur elle comme décrit plus haut.' WHERE name = 'Détection des pensées' AND ruleset = '5';

UPDATE `spells` SET description = 'Une créature que vous touchez devient invisible jusqu''à la fin du sort. Tout ce qu''elle porte ou transporte est invisible tant que cela reste sur elle. Le sort prend fin pour une cible dès qu''elle attaque ou lance un sort.

**Aux niveaux supérieurs** : une créature supplémentaire par niveau d''emplacement au-delà du 2e.' WHERE name = 'Invisibilité' AND ruleset = '5';

UPDATE `spells` SET description = 'Réaction déclenchée lorsqu''une créature que vous voyez à 18 mètres ou moins réussit un jet d''attaque, un jet de caractéristique ou un jet de sauvegarde.

Vous déstabilisez magiquement cette créature par une remarque cinglante : elle relance le d20 et doit conserver le plus faible des deux résultats. Choisissez ensuite une autre créature que vous voyez à portée (vous pouvez vous choisir) : elle a l''avantage lors du prochain jet d''attaque, jet de caractéristique ou jet de sauvegarde qu''elle effectue dans la minute qui suit. Une créature ne peut bénéficier que d''un seul avantage de ce sort à la fois.' WHERE name = 'Barbes argentées' AND ruleset = '5';
