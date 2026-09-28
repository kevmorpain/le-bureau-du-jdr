// Features porteuses des maîtrises d'une classe, jamais affichées ni matérialisées. Le seed les retrouve
// par nom et la migration 0105 crée le porteur de multiclassage sous ce nom : un nom divergent ferait créer
// un second porteur au reseed.
export const CLASS_PROFICIENCY_CARRIER_NAME = 'Maîtrises de la classe'
export const MULTICLASS_PROFICIENCY_CARRIER_NAME = 'Maîtrises de multiclassage'
