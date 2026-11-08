-- Rage : fin de la rage et sorts (C13 #234). Pose sur la feature déployée les drapeaux de sa meta (fin à l'inconscience,
-- fin faute de combat depuis le tour précédent jusqu'au niveau 14, sorts interdits) et le texte qui dit que les sorts sont
-- interdits en rage. Pendant du seed : server/db/seeds/data/barbare.ts, gardé par test/nuxt/rageEndingsMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (UPDATE de valeurs fixes), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé si la feature n'existe pas encore, le seed s'en charge alors. Jamais BEGIN (D1).

UPDATE features SET description = 'En combat, vous vous battez avec une férocité bestiale. À votre tour, vous pouvez entrer en rage en utilisant une action bonus.

Pendant la rage, vous bénéficiez des avantages suivants si vous ne portez pas d''armure lourde :
- Vous avez l''avantage aux jets de caractéristique et aux jets de sauvegarde de Force.
- Lorsque vous effectuez une attaque de mêlée avec une arme, vous gagnez un bonus aux jets de dégâts qui augmente à mesure que vous gagnez des niveaux en tant que barbare.
- Vous avez la résistance aux dégâts contondants, perforants et tranchants.

La rage se termine si vous êtes inconscient ou si votre tour se termine et que vous n''avez pas attaqué de créature hostile depuis votre dernier tour, et que vous n''avez pas subi de dégâts depuis lors. Vous pouvez aussi mettre fin à votre rage au prix d''une action bonus.

Si vous pouvez lancer des sorts, vous ne pouvez ni les lancer ni vous concentrer sur eux pendant la rage.', meta = '{"resource":"rage","unlimitedFromClassLevel":20,"suspendedByHeavyArmor":true,"endsWhenUnconscious":true,"endsWithoutCombat":true,"persistentFromClassLevel":15,"blocksSpellcasting":true,"whileActive":[{"type":"damage_resistance","value":{"damageType":"bludgeoning"}},{"type":"damage_resistance","value":{"damageType":"piercing"}},{"type":"damage_resistance","value":{"damageType":"slashing"}},{"type":"melee_strength_damage_bonus","value":{"amount":{"op":"lookup","table":[2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4]}}},{"type":"advantage","value":{"rollType":"check","ability":"str","condition":""}},{"type":"advantage","value":{"rollType":"saving_throw","ability":"str","condition":""}}]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Rage' AND f.level_required = 1);
