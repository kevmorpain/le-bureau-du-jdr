-- SQLite exige un DEFAULT pour ajouter une colonne NOT NULL : il vaut `emptyKnProvisions()` (shared/ker-nethalas/camp.ts).
ALTER TABLE `kn_characters` ADD `provisions` text DEFAULT '{"rations":0,"bandages":0,"craftingSupplies":0,"cookingIngredients":0,"lampOil":0,"lockpicks":0,"torches":0,"attunementCrystals":0}' NOT NULL;
