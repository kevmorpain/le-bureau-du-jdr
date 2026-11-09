-- Sorts de niveau 8 du socle (#176 D1) : les 18 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_8.ts, gardé par test/nuxt/spellsLevel8Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Aura sacrée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura sacrée', 8, '1 action', 0, '["V","S","M"]', 'un minuscule reliquaire contenant une relique sacrée, comme par exemple un bout de la robe d''un saint ou un fragment de texte sacré. Le reliquaire doit valoir au moins 1 000 po', '{"amount":1000,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une lumière divine émane de vous pour former une douce radiation dans un rayon de 9 mètres autour de vous. Les créatures de votre choix dans ce rayon au moment d''incanter émettent une lumière faible sur un rayon de 1,50 mètre et bénéficient d''un avantage à tous les jets de sauvegarde. Les autres créatures ont un désavantage aux jets d''attaque contre les créatures touchées par le sort. De plus, lorsqu''un fiélon ou un mort-vivant frappent une créature touchée par le sort avec une attaque au corps à corps, l''aura s''illumine d''une lumière vive. L''attaquant doit réussir un jet de sauvegarde de Constitution, sans quoi il est aveuglé jusqu''à la fin du sort.', 1, '{"ability":"con","success":"none"}', NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura sacrée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Aura sacrée' AND s.ruleset = '5';

-- Aversion/Attirance
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aversion/Attirance', 8, '1 heure', 18, '["V","S","M"]', 'soit un morceau d''aluminium trempé dans du vinaigre pour l''effet aversion, soit une goutte de miel pour l''effet attirance', NULL, 0, '10 jours', 'day', 10, 0, 'Ce sort attire ou repousse les créatures de votre choix. Vous ciblez quelque chose à portée, soit un objet de taille TG ou inférieure, soit une créature, soit une zone dont les dimensions maximales ne dépassent pas celles d''un cube de 60 mètres d''arête. Puis spécifiez une sorte de créature intelligente, comme les dragons rouges, les gobelins ou les vampires.

Vous conférez à la cible une aura qui va soit attirer, soit repousser les créatures spécifiées pour toute la durée du sort. Choisissez l''effet de l''aura, entre l''attirance et l''aversion.

**Aversion**. L''enchantement donne, aux créatures que vous avez désignées, le besoin urgent de quitter la zone et de fuir la cible. Lorsqu''une créature désignée peut voir la cible ou s''approche à 18 mètres ou moins d''elle, la créature doit réussir un jet de sauvegarde de Sagesse ou être effrayée. La créature reste effrayée tant qu''elle peut voir la cible ou qu''elle se trouve à 18 mètres ou moins d''elle. Tant qu''elle est effrayée par la cible, la créature doit utiliser son mouvement pour se déplacer vers l''endroit sûr le plus proche et duquel elle ne pourra pas voir la cible. Si la créature se déplace à plus de 18 mètres de la cible et qu''elle ne peut pas la voir, la créature n''est plus effrayée, mais elle redevient immédiatement effrayée si elle a de nouveau la cible en ligne de mire ou si elle se trouve de nouveau à 18 mètres ou moins de la cible.

**Attirance**. L''enchantement donne, aux créatures que vous avez désignées, le besoin urgent de s''approcher de la cible tant qu''elles se trouvent à 18 mètres ou moins d''elle ou qu''elles peuvent la voir. Lorsqu''une créature désignée peut voir la cible ou se trouve à 18 mètres ou moins d''elle, la créature doit réussir un jet de sauvegarde de Sagesse sous peine de devoir utiliser son mouvement, à chaque tour, pour entrer dans la zone ou se déplacer à portée de la cible. Une fois que la créature a agi de la sorte, elle ne peut s''éloigner volontairement de la cible.

Si la cible inflige des dégâts ou quelque autre tort à une créature affectée, la créature affectée peut effectuer un jet de sauvegarde de Sagesse pour mettre un terme à l''effet, comme décrit ci-dessous.

**Mettre un terme à l''effet**. Si une créature affectée termine son tour en étant à plus de 18 mètres de la cible et sans être capable de la voir, la créature effectue un jet de sauvegarde de Sagesse. En cas de réussite, la créature n''est plus affectée par la cible et se rend compte que son sentiment d''aversion ou d''attirance lui avait été magiquement inspiré. De plus, une créature affectée par le sort est autorisée à effectuer un autre de jet de sauvegarde de Sagesse toutes les 24 heures tant que le sort persiste.

Une créature qui réussit son jet de sauvegarde contre cet effet y est immunisée pour 1 minute, après quoi elle peut de nouveau être affectée.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aversion/Attirance' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Aversion/Attirance' AND s.ruleset = '5';

-- Bagou
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bagou', 8, '1 action', 0, '["V"]', NULL, NULL, 0, '1 heure', 'hour', 1, 0, 'Jusqu''à ce que le sort se termine, lorsque vous effectuez un jet de Charisme, vous pouvez remplacer le résultat du dé par un 15. De plus, peu importe vos propos, les magies qui permettent de savoir si vous dites la vérité ou non indiquent que ce que vous dites est vrai.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bagou' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Bagou' AND s.ruleset = '5';

-- Champ antimagie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Champ antimagie', 8, '1 action', 0, '["V","S","M"]', 'une pincée de poudre de fer ou quelques copeaux du même métal', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Une sphère invisible d''antimagie d''un rayon de 3 mètres vous englobe. Cet espace est dissocié de l''énergie magique qui s''étend dans le multivers. Dans la sphère, aucun sort ne peut être incanté, les créatures convoquées disparaissent et même les objets magiques deviennent ordinaires. Jusqu''à la fin du sort, la sphère reste centrée sur vous lors de vos mouvements.

Les sorts et les autres effets magiques, sauf ceux générés par un artéfact ou une divinité, sont réprimés à l''intérieur de la sphère et ils ne peuvent plus y pénétrer. Un emplacement utilisé pour incanter un sort réprimé est dépensé. Un effet est nul lorsqu''il est réprimé mais le temps continue de s''écouler pour le décompte de sa durée.

**Effets ciblés**. Les sorts et autres effets magiques, tels que *projectile magique* ou *charme-personne*, qui ciblent une créature ou un objet dans la sphère n''ont aucun effet sur la cible.

**Zones de magie**. La zone d''un autre sort ou d''un effet magique, tel que *boule de feu*, ne peut s''étendre dans la sphère. Si la sphère se superpose à une zone de magie, la partie commune est réprimée. Par exemple, les flammes créées par un *mur de feu* sont réprimées à l''intérieur de la sphère, créant ainsi une ouverture dans le mur, si la portion commune est suffisamment grande.

**Sorts**. Tout sort ou autre effet magique actif sur une créature ou un objet dans la sphère est réprimé pendant qu''il y est.

**Objets magiques**. Les propriétés et les pouvoirs des objets magiques sont réprimés dans la sphère. Par exemple, une épée longue +1 présente dans la sphère fonctionne comme une épée longue ordinaire.

Les propriétés et les pouvoirs d''une arme magique sont réprimés s''ils sont utilisés contre une cible dans la sphère ou si l''arme est maniée par un attaquant dans la sphère. Si une arme magique ou une pièce de munition quitte entièrement la sphère (par exemple, si vous décochez une flèche magique ou si vous lancez une lance vers une cible en dehors de la sphère), la répression de la magie de l''objet cesse aussitôt qu''il la quitte.

**Déplacement magique**. La téléportation et les déplacements planaires ne fonctionnent pas dans la sphère, quelle que soit l''origine ou la destination d''un tel déplacement magique. Un portail vers un autre lieu, un autre monde ou un autre plan d''existence, autant qu''une ouverture vers un espace extradimensionnel comme celui créé par le sort *corde enchantée*, sont temporairement fermés tant qu''ils sont dans la sphère.

**Créatures et objets**. Une créature ou un objet convoqué ou créé par magie disparait temporairement de la sphère. Une telle créature réapparait instantanément lorsque l''espace occupé par la créature n''est plus dans la sphère.

**Dissipation de la magie**. Les sorts et les effets magiques tel que *dissipation de la magie* n''ont aucun effet sur la sphère. De même, les sphères créées par des sorts de *champ antimagie* ne s''annulent pas l''une l''autre.', 1, NULL, NULL, '{"shape":"emanation","size":3}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Champ antimagie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Champ antimagie' AND s.ruleset = '5';

-- Clone
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Clone', 8, '1 heure', 1.5, '["V","S","M"]', 'un diamant d''une valeur d''au moins 1 000 po et au moins 1 cube de 2,50 cm d''arête de chair de la créature qui doit être clonée, que le sort consomme, et un récipient d''une valeur d''au moins 2 000 po qui a un couvercle scellable et qui est suffisamment grand pour contenir la créature à cloner, comme une grande urne, un coffre, un kyste rempli de boue sur le sol ou un contenant en cristal rempli d''eau salée', '{"amount":1000,"unit":"po"}', 0, 'Instantanée', 'instant', NULL, 0, 'Ce sort crée le double inerte d''une créature vivante, servant de protection contre la mort. Ce clone se forme à l''intérieur du récipient utilisé par le sort et atteint sa taille maximale et sa maturité au bout de 120 jours ; vous pouvez également choisir d''avoir un clone d''une version plus jeune de la même créature. Ce clone reste inerte et persiste indéfiniment, tant que son contenant n''est pas dérangé.

À n''importe quel moment, une fois le clone mature, si la créature originale meurt, son âme est transférée dans le clone, à condition que l''âme soit libre et qu''elle soit consentante à son retour à la vie. Le clone est physiquement identique à l''original et a la même personnalité, les mêmes souvenirs, et les mêmes caractéristiques, mais pas l''équipement d''origine. Le corps original de la créature reste où il est, s''il existe encore, il devient inerte et ne peut revenir à la vie tant que son âme est ailleurs.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Clone' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Clone' AND s.ruleset = '5';

-- Contrôle du climat
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contrôle du climat', 8, '10 minutes', 0, '["V","S","M"]', 'de l''encens qui brûle et des morceaux de terre et de bois mélangés à de l''eau', NULL, 0, 'Concentration, jusqu''à 8 heures', 'hour', 8, 1, 'Vous prenez le contrôle du climat sur 7,5 km autour de vous pour la durée du sort. Vous devez être à l''extérieur pour lancer ce sort. Vous déplacer à un endroit d''où vous n''avez pas une vue dégagée sur le ciel met fin au sort prématurément.

Lorsque vous lancez ce sort, vous modifiez les conditions climatiques actuelles, qui sont déterminées par le MD en fonction du climat et de la saison. Vous pouvez modifier les précipitations, la température et le vent. Cela prend 1d4 x 10 minutes pour que de nouvelles conditions météorologiques prennent effets. Une fois qu''elles sont en place, vous pouvez les modifier à nouveau. Lorsque le sort prend fin, le climat retourne progressivement à la normale. Lorsque vous modifiez les conditions climatiques, cherchez l''état climatique actuel dans les tables ci-dessous et modifiez cet état d''un rang, inférieur ou supérieur. Lorsque vous modifiez le vent, vous pouvez en modifier la direction.

**Précipitation**

| État | Condition |
| --- | --- |
| 1 | Dégagé |
| 2 | Nuages légers |
| 3 | Ciel couvert ou brouillard |
| 4 | Pluie, neige ou grêle |
| 5 | Pluie torrentielle, tempête de grêle ou blizzard |

**Température**

| État | Condition |
| --- | --- |
| 1 | Fournaise insoutenable |
| 2 | Chaud |
| 3 | Doux |
| 4 | Frais |
| 5 | Froid |
| 6 | Froid arctique |

**Vent**

| État | Condition |
| --- | --- |
| 1 | Calme |
| 2 | Vent modéré |
| 3 | Vent fort |
| 4 | Vent violent |
| 5 | Ouragan |', 8, NULL, NULL, '{"shape":"emanation","size":7500}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contrôle du climat' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Contrôle du climat' AND s.ruleset = '5';

-- Dédale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Dédale', 8, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous bannissez une créature visible dans la portée du sort vers un labyrinthe d''un demi-plan. La cible y demeure pour la durée du sort ou jusqu''à ce qu''elle s''évade du dédale.

La cible peut utiliser son action pour tenter de s''évader. Dans ce cas, elle effectue un jet d''Intelligence DD 20. Si elle réussit, elle s''évade et le sort prend fin (un minotaure ou un démon goristro réussissent automatiquement).

Lorsque le sort prend fin, la cible réapparait dans l''espace qu''elle avait quitté. Si celui-ci est occupé, elle apparait dans l''espace inoccupé le plus proche.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Dédale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Dédale' AND s.ruleset = '5';

-- Demi-plan
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Demi-plan', 8, '1 action', 18, '["S"]', NULL, NULL, 0, '1 heure', 'hour', 1, 0, 'Vous créez une porte d''ombres sur une surface plate et solide, que vous pouvez voir et à portée. La porte est suffisamment large pour permettre à des créatures de taille M de l''emprunter sans difficulté. Lorsqu''elle est ouverte, la porte conduit à un demi-plan qui semble être une salle vide de 9 mètres (en longueur, largeur et hauteur), faite de bois ou de pierres. Lorsque le sort se termine, la porte disparaît, et toute créature ou objet encore à l''intérieur du demi-plan y reste piégé, étant donné que la porte disparaît également de l''autre côté.

Chaque fois que vous lancez ce sort, vous pouvez créer un nouveau demi-plan, ou faire en sorte que la porte d''ombre que vous faites apparaître soit connectée avec un demi-plan que vous avez précédemment créé grâce à ce sort. De plus, si vous connaissez la nature et le contenu d''un demi-plan créé, via ce sort, par une autre créature, vous pouvez plutôt faire en sorte que votre porte d''ombre soit connectée à ce demi-plan.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Demi-plan' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Demi-plan' AND s.ruleset = '5';

-- Domination de monstre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Domination de monstre', 8, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous tentez de subjuguer une créature à portée que vous pouvez voir. Elle doit réussir un jet de sauvegarde de Sagesse ou être charmée pour la durée du sort. Si vous ou des créatures qui vous sont amies la combattez, elle bénéficie d''un avantage à son jet de sauvegarde.

Tant que la créature est charmée, vous établissez un contact télépathique avec elle aussi longtemps que vous vous trouvez tous les deux sur le même plan d''existence. Vous pouvez utiliser ce lien télépathique pour donner des ordres à la créature tant que vous êtes conscient (aucune action requise). La créature fait tout ce qui est en son pouvoir pour obéir. Vous pouvez préciser un type d''action à la fois simple et général, comme « Attaque cette créature », « Cours jusque-là » ou « Rapporte cet objet ». Si la créature exécute la demande et ne reçoit pas d''autres indications de votre part, elle se défend au mieux de sa capacité.

Vous pouvez utiliser une action pour obtenir le contrôle total et précis de la cible. Jusqu''à la fin de votre prochain tour, la créature agit seulement selon vos choix et elle ne peut rien faire sans que vous ne l''autorisiez. Pendant cette période, vous pouvez provoquer une réaction de la part de la créature, mais l''usage de cette réaction sera aussi le vôtre.

Chaque fois que la cible subit des dégâts, elle tente un nouveau jet de sauvegarde de Sagesse. Si elle réussit, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 9, la durée du sort sous concentration augmente jusqu''à 8 heures.', 4, '{"ability":"wis"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Domination de monstre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Domination de monstre' AND s.ruleset = '5';

-- Éclat du soleil
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Éclat du soleil', 8, '1 action', 45, '["V","S","M"]', 'une source de feu et une pierre de soleil/héliolite', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une vive lumière équivalente à celle du soleil éclaire dans un rayon de 18 mètres, centrée sur un point que vous choisissez dans la portée du sort. Chaque créature dans la lumière doit faire un jet de sauvegarde de Constitution. En cas d''échec, une créature subit 12d6 dégâts radiants et est aveuglée pendant 1 minute. En cas de réussite, elle subit la moitié de ces dégâts et n''est pas aveuglée par le sort. Les morts-vivants et vases ont un désavantage à ce jet de sauvegarde.

Une créature aveuglée par le sort fait un autre jet de sauvegarde de Constitution à la fin de chacun de ses tours. En cas de réussite, elle n''est plus aveuglée.

Ce sort dissipe dans sa zone toute ténèbres créées par un sort.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":18}', '[{"damage_type":"radiant","damage_at_slot_level":{"8":"12d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Éclat du soleil' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Éclat du soleil' AND s.ruleset = '5';

-- Esprit faible
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Esprit faible', 8, '1 action', 45, '["V","S","M"]', 'une poignée de sphères en argile, verre, cristal ou minéral', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous anéantissez l''esprit d''une créature que vous pouvez voir et à portée, tentant ainsi de briser son intellect et sa personnalité. La cible subit 4d6 dégâts psychiques et doit effectuer un jet de sauvegarde d''Intelligence.

En cas d''échec, les valeurs de Charisme et d''Intelligence de la créature passent à 1. La créature ne peut plus lancer des sorts, activer un objet magique, comprendre un langage ou communiquer de manière intelligible. La créature peut cependant identifier ses amis, les suivre, et même les protéger.

À la fin de chaque période de 30 jours qui passe, la créature peut tenter un nouveau jet de sauvegarde contre ce sort. S''il le réussit, le sort prend fin.

Ce sort peut également être dissipé grâce à un sort de *restauration supérieure, guérison* ou *souhait*.', 4, '{"ability":"int"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"8":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Esprit faible' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Esprit faible' AND s.ruleset = '5';

-- Esprit impénétrable
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Esprit impénétrable', 8, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, '24 heures', 'hour', 24, 0, 'Jusqu''à ce que le sort prenne fin, une créature consentante que vous touchez est immunisée contre les dégâts psychiques, tout effet qui permettrait de connaître ses émotions ou de lire ses pensées, les sorts de divination et l''état charmé. Le sort déjoue même le sort *souhait* et les sorts ou effets aux pouvoirs similaires utilisés pour affecter l''esprit de la cible ou obtenir des informations au sujet de la cible.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Esprit impénétrable' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Esprit impénétrable' AND s.ruleset = '5';

-- Formes animales
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Formes animales', 8, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 24 heures', 'hour', 24, 1, 'Votre magie transforme les autres en bêtes. Vous pouvez cibler toutes les créatures consentantes que vous pouvez voir et à portée. Vous transformez chacune de ces créatures en une bête de taille G ou inférieure avec un FP de 4 ou inférieur. Aux tours suivants, vous pouvez utiliser votre action pour changer de nouveau la forme des créatures transformées.

La transformation reste effective pour chacune des cibles tant que le sort dure ou jusqu''à ce que la cible tombe à 0 point de vie ou qu''elle meure.

Les statistiques d''une cible sont remplacées par les statistiques de la bête choisie. Cependant la cible conserve son alignement, ainsi que ses valeurs de caractéristique d''Intelligence, de Sagesse et de Charisme. La cible acquiert les points de vie de sa nouvelle forme et lorsqu''elle retrouve sa forme d''origine, elle retourne au nombre de points de vie qu''elle avait d''être métamorphosée. Si la cible retrouve sa forme d''origine parce qu''elle est tombée à 0 point de vie, les dégâts restants sont appliqués à sa forme normale. Tant que les dégâts restants ne font pas tomber la forme normale de la cible à 0 point de vie, elle ne tombe pas inconsciente. La créature est limitée aux actions qu''elle peut effectuer sous sa nouvelle forme et ne peut ni parler ni lancer des sorts.

L''équipement de la cible fusionne avec sa nouvelle forme. La cible ne peut pas activer, manipuler, ou bénéficier de quelque manière que ce soit de son équipement.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Formes animales' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Formes animales' AND s.ruleset = '5';

-- Mot de pouvoir étourdissant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mot de pouvoir étourdissant', 8, '1 action', 18, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous prononcez un mot de pouvoir qui peut submerger l''esprit d''une créature que vous pouvez voir et à portée de sort, la laissant abasourdie. Si la créature possède 150 points de vie ou moins, elle est étourdie. Dans le cas contraire, le sort n''a aucun effet.

La créature étourdie doit effectuer un jet de sauvegarde de Constitution à la fin de chacun de ses tours. Sur un jet réussi, l''étourdissement prend fin.', 4, '{"ability":"con"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de pouvoir étourdissant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Mot de pouvoir étourdissant' AND s.ruleset = '5';

-- Nuage incendiaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Nuage incendiaire', 8, '1 action', 45, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un nuage tournoyant de fumée et projetant des braises incandescentes apparaît dans une sphère de 6 mètres de rayon centrée sur un point à portée. Le nuage contourne les angles et est fortement obscurci. Il reste en place pour toute la durée du sort, ou jusqu''à ce qu''un vent modéré ou fort (au moins 15 km/h) le disperse.

Lorsque le nuage apparaît, chaque créature présente à l''intérieur doit effectuer un jet de sauvegarde de Dextérité. Une créature subit 10d8 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Une créature doit également effectuer un jet de sauvegarde lorsqu''elle pénètre dans la zone du sort pour la première fois de son tour, ou si elle y termine son tour.

Le nuage s''éloigne de 3 mètres de vous dans la direction de votre choix, et ce au début de chacun de vos tours.', 2, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":6}', '[{"damage_type":"fire","damage_at_slot_level":{"8":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nuage incendiaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Nuage incendiaire' AND s.ruleset = '5';

-- Télépathie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Télépathie', 8, '1 action', 100000, '["V","S","M"]', 'une paire d''anneaux d''argent liés', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous créez un lien télépathique entre vous et une créature consentante qui vous est familière. La créature peut être n''importe où sur le même plan d''existence que vous. Le sort prend fin si vous n''êtes plus tous les deux sur le même plan d''existence.

Jusqu''à ce que le sort prenne fin, vous et la cible pouvez échanger instantanément des mots, des images, des sons et tout autre message sensoriel entre vous. La cible qui reçoit le message sait qu''il vient de vous. Le sort permet à une créature ayant une valeur d''Intelligence de 1 au minimum de comprendre la signification de vos mots et de saisir le sens des messages sensoriels que vous lui envoyez.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Télépathie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Télépathie' AND s.ruleset = '5';

-- Tremblement de terre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tremblement de terre', 8, '1 action', 150, '["V","S","M"]', 'une pincée de terre, un fragment de roche et un bloc d''argile', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous générez un bouleversement sismique à un endroit visible sur le sol dans la portée du sort. Pendant la durée, une intense secousse déchire le sol sur un cercle de 30 mètres de rayon centré sur le point indiqué. Les créatures et les structures en contact avec le sol sont secouées.

Le sol dans la zone devient un terrain difficile. Chaque créature au sol qui se concentre doit réussir un jet de sauvegarde de Constitution, sans quoi sa concentration est brisée.

Lorsque vous lancez ce sort ainsi qu''à chaque fin de tour passé à vous concentrer, chaque créature au sol doit réussir un jet de sauvegarde de Dextérité ou tomber à terre.

Ce sort peut avoir des effets supplémentaires selon la nature du terrain dans le secteur, à la discrétion du MD.

**Fissures**. Des fissures s''ouvrent dans la zone frappée par le sort au début du tour suivant l''incantation du sort. Un total de 1d6 fissures s''ouvrent à des endroits déterminés par le MD. Chacune des fissures est profonde de 1d10 x 3 mètres, mesure 3 mètres de large et s''étend d''un point sur la circonférence de la zone jusqu''au point opposé. Une créature située à l''endroit où la fissure s''ouvre doit réussir un jet de sauvegarde de Dextérité, sans quoi elle chute. Une créature qui réussit la sauvegarde se déplace avec le bord de la fissure.

Une fissure qui s''ouvre sous une structure cause l''effondrement de la structure (voir plus bas).

**Structures**. La secousse inflige 50 dégâts contondants à toute structure en contact avec le sol qui se trouve dans la zone lorsque vous incantez le sort ainsi qu''au début de chacun de vos tours jusqu''à ce que le sort prenne fin. Si la structure atteint 0 point de vie, elle s''effondre pour possiblement blesser les créatures proches. Une créature située à la moitié ou moins de la hauteur de la structure doit réaliser un jet de sauvegarde de Dextérité. En cas d''échec, elle subit 5d6 dégâts contondants, tombe à terre et est ensevelie dans les décombres. Un jet de Force (Athlétisme) de DD 20 est requis pour s''en extirper. Le MD peut ajuster le DD en fonction de la nature des décombres. En cas de réussite, la créature subit la moitié de ces dégâts, ne tombe pas à terre et n''est pas ensevelie.', 5, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tremblement de terre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Tremblement de terre' AND s.ruleset = '5';

-- Tsunami
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tsunami', 8, '1 minute', 100000, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 6 rounds', 'round', 6, 1, 'Un mur d''eau apparaît en un point de votre choix, à portée. Vous pouvez créer un mur qui peut atteindre jusqu''à 90 mètres de long, 90 mètres de haut et 15 mètres d''épaisseur. Le mur reste en place pour toute la durée du sort.

Lorsque le mur apparaît, chaque créature se trouvant dans la zone doit effectuer un jet de sauvegarde de Force. Une créature subit 6d10 dégâts contondants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Au début de chacun de vos tours après que le mur soit apparu, le mur, ainsi que toutes les créatures à l''intérieur, s''éloigne de vous en se déplaçant de 15 mètres. Toutes les créatures de taille G ou inférieure situées à l''intérieur du mur, ou le percutant lorsque celui-ci se déplace, doivent réussir un jet de sauvegarde de Force sous peine de subir 5d10 dégâts contondants. Une créature ne peut subir ces dégâts qu''une seule fois par tour.

À la fin du tour, la hauteur du mur est réduite de 15 mètres et les dégâts que les créatures vont subir aux rounds suivants sont réduits de 1d10. Lorsque la hauteur du mur tombe à 0, le sort prend fin.

Une créature piégée dans le mur peut se déplacer en nageant. Cependant, du fait de la puissance de la vague, une créature doit réussir un jet de Force (Athlétisme) contre le DD de sauvegarde de votre sort pour pouvoir se déplacer. Si elle échoue, elle ne peut pas bouger. Une créature qui se déplace en dehors de la zone d''effet tombe au sol.', 2, '{"ability":"str","success":"half"}', NULL, NULL, '[{"damage_type":"bludgeoning","label":"Apparition du mur","damage_at_slot_level":{"8":"6d10"}},{"damage_type":"bludgeoning","label":"Passage du mur","damage_at_slot_level":{"8":"5d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tsunami' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Tsunami' AND s.ruleset = '5';
