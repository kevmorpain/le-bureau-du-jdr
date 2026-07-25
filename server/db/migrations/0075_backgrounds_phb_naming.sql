-- Réalignement des historiques sur AideDD (trad FR officielle PHB 2014).
-- Audit des 13 historiques PHB : compétences/outils/langues étaient corrects,
-- mais 2 noms d'historique et 10 noms d'aptitude (« Capacité ») étaient erronés,
-- plus 2 descriptions d'aptitude factuellement fausses et 1 nom d'outil.
--
-- Ces UPDATE ne touchent que les historiques GLOBAUX (character_sheet_id IS NULL) :
-- les historiques personnalisés liés à une fiche sont préservés. Chaque UPDATE
-- matche l'ancienne valeur → idempotent (no-op sur une base déjà réalignée ou
-- fraîchement seedée avec les nouveaux noms). Les fiches référencent l'historique
-- par background_id (FK) → les renommages de `name` sont sans risque.

-- ── Renommages d'historique (nom + aptitude) ────────────────────────────────
-- Entertainer : « Saltimbanque » → « Artiste » ; « Par feu et acier » (nom
-- fantaisiste erroné) → « À la demande du public ».
UPDATE backgrounds
SET name = 'Artiste', feature_name = 'À la demande du public'
WHERE name = 'Saltimbanque' AND feature_name = 'Par feu et acier' AND character_sheet_id IS NULL;

-- Outlander : « Étranger » → « Sauvageon » ; « Marcheur du monde » → « Éternel
-- vagabond » ; description réécrite (mémoire des cartes + nourriture/eau pour 6,
-- l'ancienne parlait à tort de prévision météo).
UPDATE backgrounds
SET name = 'Sauvageon',
    feature_name = 'Éternel vagabond',
    feature_description = 'Vous avez une mémoire remarquable des cartes et de la géographie, et vous retrouvez sans peine la configuration d''un terrain ou d''une région. De plus, vous pouvez trouver chaque jour de quoi nourrir et abreuver jusqu''à six personnes, pour peu que la nature environnante offre baies, petit gibier et eau douce.'
WHERE name = 'Étranger' AND feature_name = 'Marcheur du monde' AND character_sheet_id IS NULL;

-- ── Corrections de nom d'aptitude (nom d'historique inchangé) ────────────────
UPDATE backgrounds SET feature_name = 'Abri du fidèle'
WHERE name = 'Acolyte' AND feature_name = 'Abri des fidèles' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Membre de guilde'
WHERE name = 'Artisan de guilde' AND feature_name = 'Appartenance à une guilde' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Accointances avec la pègre'
WHERE name = 'Criminel' AND feature_name = 'Contact criminel' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Hospitalité rustique'
WHERE name = 'Héros du peuple' AND feature_name = 'Accueil rustique' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Apanage de la noblesse'
WHERE name = 'Noble' AND feature_name = 'Position de privilège' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Place à bord'
WHERE name = 'Marin' AND feature_name = 'Passage en bateau' AND character_sheet_id IS NULL;

UPDATE backgrounds SET feature_name = 'Grade militaire'
WHERE name = 'Soldat' AND feature_name = 'Rang militaire' AND character_sheet_id IS NULL;

-- Enfant des rues : aptitude « Enfant de la ville » (nom erroné) → « Secrets de
-- la ville » ; description réécrite (déplacement ×2 en ville, l'ancienne parlait
-- à tort de cache/récupération d'informations).
UPDATE backgrounds
SET feature_name = 'Secrets de la ville',
    feature_description = 'Vous connaissez les passages dérobés et les raccourcis du dédale urbain. Hors combat, vous vous déplacez (ainsi que les compagnons que vous guidez) deux fois plus vite qu''à l''ordinaire entre deux points d''une ville.'
WHERE name = 'Enfant des rues' AND feature_name = 'Enfant de la ville' AND character_sheet_id IS NULL;

-- ── Correction de nom d'outil (terme AideDD) ────────────────────────────────
-- Charlatan : « Kit de faussaire » → « Kit de contrefaçon » (terme officiel du
-- forgery kit sur AideDD). L'aptitude « Fausse identité » était déjà correcte.
UPDATE backgrounds
SET tool_proficiencies = '["Kit de déguisement","Kit de contrefaçon"]'
WHERE name = 'Charlatan'
  AND tool_proficiencies = '["Kit de déguisement","Kit de faussaire"]'
  AND character_sheet_id IS NULL;
