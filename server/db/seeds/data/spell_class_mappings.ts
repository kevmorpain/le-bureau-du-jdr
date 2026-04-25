// Maps spell names to the classes that can learn them.
// classNames must match exactly the names in data/classes.ts.

export const spellClassMappings: { spellName: string; classNames: string[] }[] = [
  // ─── Sorts mineurs ────────────────────────────────────────────────────────────
  { spellName: 'Assistance', classNames: ['Clerc', 'Druide', 'Magicien'] },
  { spellName: 'Flamme sacrée', classNames: ['Clerc'] },
  { spellName: 'Glas', classNames: ['Clerc'] },
  { spellName: 'Lumière', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien'] },
  { spellName: 'Trait de feu', classNames: ['Ensorceleur', 'Magicien'] },
  { spellName: 'Rayon affaiblissant', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Contact glacial', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Prestidigitation', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 1 ─────────────────────────────────────────────────────────────────
  { spellName: 'Aide', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Identification', classNames: ['Barde', 'Magicien'] },
  { spellName: 'Injonction', classNames: ['Clerc'] },
  { spellName: 'Soins', classNames: ['Barde', 'Clerc', 'Druide', 'Paladin', 'Rôdeur'] },
  { spellName: 'Mot de guérison', classNames: ['Barde', 'Clerc', 'Druide'] },
  { spellName: 'Bouclier de la foi', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Détection de la magie', classNames: ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Paladin', 'Rôdeur'] },
  { spellName: 'Détection du mal et du bien', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Protection contre le mal et le bien', classNames: ['Barde', 'Clerc', 'Magicien', 'Paladin'] },
  { spellName: 'Rayon traçant', classNames: ['Clerc'] },
  { spellName: 'Bénédiction', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Blessure', classNames: ['Clerc'] },
  { spellName: 'Gibet démoniaque', classNames: ['Occultiste'] },
  { spellName: 'Compréhension des langues', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Armure d\'Agathys', classNames: ['Occultiste'] },
  { spellName: 'Alarme', classNames: ['Magicien', 'Rôdeur'] },
  { spellName: 'Détection du poison et des maladies', classNames: ['Clerc', 'Druide', 'Paladin', 'Rôdeur'] },

  // ─── Niveau 2 ─────────────────────────────────────────────────────────────────
  { spellName: 'Augure', classNames: ['Clerc'] },
  { spellName: 'Suggestion', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Arme spirituelle', classNames: ['Clerc'] },
  { spellName: 'Cécité / Surdité', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Immobilisation de personne', classNames: ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin'] },
  { spellName: 'Lien de protection', classNames: ['Clerc'] },
  { spellName: 'Localisation d\'objet', classNames: ['Barde', 'Clerc', 'Druide', 'Paladin'] },
  { spellName: 'Prière de guérison', classNames: ['Clerc'] },
  { spellName: 'Protection contre le poison', classNames: ['Clerc', 'Druide', 'Paladin', 'Rôdeur'] },
  { spellName: 'Restauration partielle', classNames: ['Barde', 'Clerc', 'Druide', 'Paladin', 'Rôdeur'] },
  { spellName: 'Détection des pièges', classNames: ['Clerc', 'Druide', 'Rôdeur'] },
  { spellName: 'Zone de vérité', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Pattes d\'araignée', classNames: ['Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Rôdeur'] },
  { spellName: 'Porte-objet', classNames: ['Magicien', 'Occultiste'] },

  // ─── Niveau 3 ─────────────────────────────────────────────────────────────────
  { spellName: 'Peur', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Vol', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 4 ─────────────────────────────────────────────────────────────────
  { spellName: 'Tentacules noirs', classNames: ['Magicien', 'Occultiste'] },

  // ─── Niveau 5 ─────────────────────────────────────────────────────────────────
  { spellName: 'Contact avec le plan astral', classNames: ['Clerc', 'Magicien', 'Occultiste'] },
]
