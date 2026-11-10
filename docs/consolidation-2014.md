# Dette du socle 2014 — constats F1–F20

> Index des constats de dette (label `dette` du projet
> [Le Bureau du JDR](https://github.com/users/kevmorpain/projects/2)) : l'issue porte le détail et
> le statut. Le critère qui a guidé ce chantier est le [North Star](./rules-engine.md#north-star).
> Plan, passation et historique des tranches avant nettoyage :
> [version `4cc089c`](https://github.com/kevmorpain/le-bureau-du-jdr/blob/4cc089c102ae2316f8eee79069036894519a41b9/docs/consolidation-2014.md).

| Code | Suivi | Constat |
|---|---|---|
| **F1** | ✅ PR #52 | Upserts de catalogue par nom seul : un homonyme 5.5 écrasait le 2014 → clé `(name, ruleset)` |
| **F2** | ✅ | Points de choix 2014 (sous-classe, style de combat, expertise, ASI) généralisés en `progression` / `character_choices` ; le front lit le catalogue |
| **F3** | ✅ PR #85, #86, #87 | Compétences de classe et d'historique, JS de classe dérivés à la lecture au lieu d'être figés |
| **F4** | ✅ [#117](https://github.com/kevmorpain/le-bureau-du-jdr/issues/117) | Endpoints catalogue épars remplacés par `/api/catalog/*` |
| **F5** | ✅ [#118](https://github.com/kevmorpain/le-bureau-du-jdr/issues/118) | Blob front `CLASSES` mort sur les maîtrises |
| **F6** | [#119](https://github.com/kevmorpain/le-bureau-du-jdr/issues/119) | Maîtrise d'armes et bonus d'origine servis par le GET fiche mais jamais lus |
| **F7** | [#120](https://github.com/kevmorpain/le-bureau-du-jdr/issues/120) | Colonne legacy `dragonborn_ancestry`, parallèle au modèle lignée (bloque le Drakéide 5.5) |
| **F8** | ✅ [#121](https://github.com/kevmorpain/le-bureau-du-jdr/issues/121) | Enums `AbilityScore` / `DamageType` de `spells.ts` → `shared/rules/` |
| **F9** | ✅ [#122](https://github.com/kevmorpain/le-bureau-du-jdr/issues/122) | Tables `skills` / `character_skills` supprimées ([D27](./decisions.md#d27)) |
| **F10** | ✅ [#123](https://github.com/kevmorpain/le-bureau-du-jdr/issues/123) | Typecheck à 0 et job CI (les SFC `.vue` n'y passent pas) |
| **F11** | by-design | Snapshots Drizzle figés à `0039` : `db:generate` inutilisable ; garde-fou `test/unit/migrations.test.ts` (rejeu sur base vierge) |
| **F12** | ✅ [#124](https://github.com/kevmorpain/le-bureau-du-jdr/issues/124) | Autorité serveur du level-up : sorts, ASI, PV ([D19](./decisions.md#d19)) |
| **F13** | ✅ [#125](https://github.com/kevmorpain/le-bureau-du-jdr/issues/125) | Compétences de classe lues dans le catalogue par le builder ([D27](./decisions.md#d27)) |
| **F14** | [#106](https://github.com/kevmorpain/le-bureau-du-jdr/issues/106) | Règles indexées par classe sans ruleset, front sans ruleset (bloque le 5.5) |
| **F15** | ✅ [#126](https://github.com/kevmorpain/le-bureau-du-jdr/issues/126) | Objets non résolus à la création perdus en silence ([D28](./decisions.md#d28)) |
| **F16** | ✅ [#127](https://github.com/kevmorpain/le-bureau-du-jdr/issues/127) | Le builder n'exigeait pas la sous-classe au niveau d'accès |
| **F17** | ✅ [#128](https://github.com/kevmorpain/le-bureau-du-jdr/issues/128) | Owners visibles redondants de l'Occultiste (Faveur de pacte → `choice_carrier`) |
| **F18** | ✅ [#129](https://github.com/kevmorpain/le-bureau-du-jdr/issues/129) | Golden-master : pactes Lame/Tome et multiclassages lanceurs non couverts |
| **F19** | [#130](https://github.com/kevmorpain/le-bureau-du-jdr/issues/130) | Lien sort ↔ classe de `spells.ts` encore par nom, à passer en `(nom, ruleset)` |
| **F20** | ✅ [#298](https://github.com/kevmorpain/le-bureau-du-jdr/issues/298) | Le builder projette les capacités de classe ([D31](./decisions.md#d31)) |
