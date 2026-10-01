<template>
  <LegalPage title="Mentions légales">
    <h2>Éditeur du site</h2>
    <p>
      Le Bureau du JDR est un site personnel et non lucratif, édité à titre non professionnel par une personne
      physique qui a choisi de rester anonyme. Conformément à l'article 1-1 de la loi n° 2004-575 du 21 juin 2004
      pour la confiance dans l'économie numérique, son identité a été communiquée à l'hébergeur.
    </p>
    <p>
      Contact : <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
    </p>

    <h2>Hébergeur</h2>
    <p>
      Le site, sa base de données et les images téléversées sont hébergés par {{ HOST.name }},
      {{ HOST.address }}.
    </p>

    <h2>Propriété intellectuelle et marques</h2>
    <p>
      Le Bureau du JDR est un projet de fan non officiel. Il n'est ni approuvé ni parrainé par Wizards of the Coast LLC.
      Dungeons & Dragons et D&D sont des marques de Wizards of the Coast LLC ; les règles, sorts et autres éléments
      du jeu restent la propriété de leurs ayants droit.
    </p>

    <h2>Contenus ajoutés par les utilisateurs</h2>
    <p>
      Les sorts et objets personnalisés ajoutés au catalogue sont enregistrés sans lien avec le compte de leur
      auteur et peuvent être visibles des autres utilisateurs. Tout contenu qui semblerait illicite peut être
      signalé à l'adresse de contact ci-dessus.
    </p>

    <h2>Données personnelles</h2>
    <p>
      Le traitement des données personnelles est décrit dans la
      <NuxtLink
        to="/confidentialite"
      >politique de confidentialité</NuxtLink>.
    </p>
  </LegalPage>
</template>

<script lang="ts" setup>
import { CONTACT_EMAIL, HOST } from '~/data/legal'
</script>
