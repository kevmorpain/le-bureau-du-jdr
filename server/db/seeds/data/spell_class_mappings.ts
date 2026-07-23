// Maps spell names to the classes that can learn them.
// classNames must match exactly the names in data/classes.ts.

export const spellClassMappings: { spellName: string; classNames: string[] }[] = [
  // ─── Sorts mineurs ────────────────────────────────────────────────────────────
  { spellName: 'Assistance', classNames: ['Clerc', 'Druide', 'Magicien'] },
  { spellName: 'Flamme sacrée', classNames: ['Clerc'] },
  { spellName: 'Glas', classNames: ['Clerc', 'Occultiste'] },
  { spellName: 'Lumière', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien'] },
  { spellName: 'Trait de feu', classNames: ['Ensorceleur', 'Magicien'] },
  { spellName: 'Rayon affaiblissant', classNames: ['Magicien', 'Occultiste'] },
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
  { spellName: 'Éclair traçant', classNames: ['Clerc'] },
  { spellName: 'Bénédiction', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Blessure', classNames: ['Clerc'] },
  { spellName: 'Maléfice', classNames: ['Occultiste'] },
  { spellName: 'Compréhension des langues', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Armure d\'Agathys', classNames: ['Occultiste'] },
  { spellName: 'Alarme', classNames: ['Magicien', 'Occultiste', 'Rôdeur'] },
  { spellName: 'Détection du poison et des maladies', classNames: ['Clerc', 'Druide', 'Occultiste', 'Paladin', 'Rôdeur'] },

  // ─── Niveau 2 ─────────────────────────────────────────────────────────────────
  { spellName: 'Augure', classNames: ['Clerc'] },
  { spellName: 'Suggestion', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Arme spirituelle', classNames: ['Clerc'] },
  { spellName: 'Cécité/Surdité', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Immobilisation de personne', classNames: ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin'] },
  { spellName: 'Lien de protection', classNames: ['Clerc'] },
  { spellName: 'Localisation d\'objet', classNames: ['Barde', 'Clerc', 'Druide', 'Paladin'] },
  { spellName: 'Prière de guérison', classNames: ['Clerc'] },
  { spellName: 'Protection contre le poison', classNames: ['Clerc', 'Druide', 'Paladin', 'Rôdeur'] },
  { spellName: 'Restauration partielle', classNames: ['Barde', 'Clerc', 'Druide', 'Paladin', 'Rôdeur'] },
  { spellName: 'Sens des pièges', classNames: ['Clerc', 'Druide', 'Rôdeur'] },
  { spellName: 'Zone de vérité', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Pattes d\'araignée', classNames: ['Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Rôdeur'] },

  // ─── Niveau 3 ─────────────────────────────────────────────────────────────────
  { spellName: 'Peur', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Vol', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 4 ─────────────────────────────────────────────────────────────────
  { spellName: 'Tentacules noirs d\'Evard', classNames: ['Magicien', 'Occultiste'] },
  { spellName: 'Charme-monstre', classNames: ['Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Flétrissement', classNames: ['Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 5 ─────────────────────────────────────────────────────────────────
  { spellName: 'Contact avec un autre plan', classNames: ['Clerc', 'Magicien', 'Occultiste'] },
  { spellName: 'Perturbations synaptiques', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 6 ─────────────────────────────────────────────────────────────────
  { spellName: 'Prison mentale', classNames: ['Magicien', 'Occultiste'] },
  { spellName: 'Cercle de mort', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Invocation de fée', classNames: ['Druide', 'Occultiste'] },
  { spellName: 'Création de mort-vivant', classNames: ['Clerc', 'Magicien', 'Occultiste'] },
  { spellName: 'Désintégration', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Mauvais oeil', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Vision suprême', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Niveau 7 ─────────────────────────────────────────────────────────────────
  { spellName: 'Cage de force', classNames: ['Barde', 'Magicien', 'Occultiste'] },
  { spellName: 'Doigt de mort', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Forme éthérée', classNames: ['Barde', 'Clerc', 'Magicien', 'Occultiste', 'Ensorceleur'] },
  { spellName: 'Changement de plan', classNames: ['Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Sorts d'Ambroise ─────────────────────────────────────────────────────────

  // Sorts mineurs
  { spellName: 'Décharge occulte', classNames: ['Occultiste'] },
  { spellName: 'Lame aux flammes vertes', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Piqûre mentale', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Bouffée de poison', classNames: ['Druide', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Contrôle des flammes', classNames: ['Druide', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Lame retentissante', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // Niveau 1
  { spellName: 'Tentacules de Hadar', classNames: ['Occultiste'] },
  { spellName: 'Armure de mage', classNames: ['Barde', 'Ensorceleur', 'Magicien'] },

  // Niveau 2
  { spellName: 'Foulée brumeuse', classNames: ['Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Force fantasmagorique', classNames: ['Barde', 'Magicien', 'Occultiste'] },

  // Niveau 1 (Pacte de la Chaîne — apprendre via aptitude, pas liste Occultiste)
  { spellName: 'Appel de familier', classNames: ['Magicien'] },

  // Niveau 4 — Compulsion (référencé par manifestation Murmures ensorcelants)
  { spellName: 'Compulsion', classNames: ['Barde', 'Occultiste'] },

  // Niveau 3
  { spellName: 'Voracité de Hadar', classNames: ['Occultiste'] },
  { spellName: 'Ennemis à foison', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Délivrance des malédictions', classNames: ['Clerc', 'Magicien', 'Occultiste', 'Paladin'] },
  { spellName: 'Motif hypnotique', classNames: ['Barde', 'Ensorceleur', 'Magicien', 'Occultiste'] },

  // ─── Sorts de niveau 3 intégrés depuis la prod (listes de classe PHB 2014) ─────
  { spellName: 'Antidétection', classNames: ['Barde', 'Magicien', 'Rôdeur'] },
  { spellName: 'Cercle magique', classNames: ['Clerc', 'Magicien', 'Occultiste', 'Paladin'] },
  { spellName: 'Clairvoyance', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien'] },
  { spellName: 'Communication avec les morts', classNames: ['Barde', 'Clerc', 'Magicien'] },
  { spellName: 'Communication à distance', classNames: ['Barde', 'Clerc', 'Magicien'] },
  { spellName: 'Dissipation de la magie', classNames: ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin'] },
  { spellName: 'Don des langues', classNames: ['Barde', 'Clerc', 'Ensorceleur', 'Magicien', 'Occultiste'] },
  { spellName: 'Esprits gardiens', classNames: ['Clerc'] },
  { spellName: 'Fusion dans la pierre', classNames: ['Clerc', 'Druide'] },
  { spellName: 'Glyphe de protection', classNames: ['Barde', 'Clerc', 'Magicien'] },
  { spellName: 'Lueur d\'espoir', classNames: ['Clerc'] },
  { spellName: 'Lumière du jour', classNames: ['Clerc', 'Druide', 'Ensorceleur', 'Paladin', 'Rôdeur'] },
  { spellName: 'Malédiction', classNames: ['Barde', 'Clerc', 'Magicien'] },
  { spellName: 'Mort simulée', classNames: ['Barde', 'Clerc', 'Druide', 'Magicien'] },
  { spellName: 'Mot de guérison de groupe', classNames: ['Barde', 'Clerc'] },
  { spellName: 'Protection contre une énergie', classNames: ['Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Rôdeur'] },
  { spellName: 'Retour à la vie', classNames: ['Clerc', 'Paladin'] },
  { spellName: 'Transfert de vie', classNames: ['Clerc', 'Magicien'] },
]
