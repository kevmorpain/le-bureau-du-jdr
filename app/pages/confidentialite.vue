<template>
  <LegalPage title="Politique de confidentialité">
    <h2>Responsable du traitement</h2>
    <p>
      L'éditeur du site, personne physique agissant à titre non professionnel et ayant choisi de rester anonyme
      (voir les
      <NuxtLink
        to="/mentions-legales"
      >mentions légales</NuxtLink>). Contact :
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>

    <h2>Données traitées</h2>
    <ul>
      <li>
        <strong>Connexion</strong> : lorsque vous vous connectez avec Google ou Discord, le site enregistre votre
        identifiant chez ce fournisseur, votre adresse email, votre nom d'affichage et l'adresse de votre avatar.
        Aucun mot de passe n'est vu par le site, et aucun jeton du fournisseur n'est conservé.
      </li>
      <li>
        <strong>Contenu que vous saisissez</strong> : vos fiches de personnage (caractéristiques, inventaire, notes,
        description libre) et les portraits que vous téléversez. Les fiches ne sont accessibles qu'à leur propriétaire
        connecté ; les portraits sont servis par une adresse non devinable.
      </li>
      <li>
        <strong>Catalogue commun</strong> : les sorts et objets personnalisés que vous ajoutez sont enregistrés sans
        lien avec votre compte et peuvent être visibles des autres utilisateurs. N'y mettez aucune donnée personnelle.
      </li>
      <li>
        <strong>Données techniques</strong> : l'hébergeur traite par nature l'adresse IP et les informations des
        requêtes reçues, et le site active l'observabilité de Cloudflare Workers (journaux techniques).
      </li>
    </ul>

    <h2>Finalités et bases légales</h2>
    <ul>
      <li>
        Créer et gérer votre compte et vos fiches : exécution du service que vous demandez (article 6.1.b du RGPD).
      </li>
      <li>
        Assurer la sécurité et le bon fonctionnement du site : intérêt légitime de l'éditeur (article 6.1.f du RGPD).
      </li>
    </ul>

    <h2>Cookies et stockage local</h2>
    <p>
      Le site dépose deux cookies strictement nécessaires à son fonctionnement : votre session de connexion
      (30 jours) et un cookie technique mémorisant la page où vous retournez après la connexion (10 minutes).
      Ils ne nécessitent pas de consentement. Aucun outil de mesure d'audience ni traceur publicitaire n'est utilisé.
    </p>
    <p>
      Votre navigateur conserve aussi localement des préférences, des données de jeu (conditions actives, classe
      d'armure, grimoire, brouillon de création de personnage…) et un cache permettant d'utiliser le site hors ligne.
    </p>

    <h2>Destinataires</h2>
    <ul>
      <li>
        Cloudflare, Inc. (hébergement du site, de la base de données et des images).
      </li>
      <li>
        Google ou Discord, uniquement si vous choisissez de vous connecter avec leur service, selon leurs propres
        politiques :
        <a
          href="https://policies.google.com/privacy"
          rel="noopener"
        >Google</a>,
        <a
          href="https://discord.com/privacy"
          rel="noopener"
        >Discord</a>.
      </li>
    </ul>
    <p>Vos données ne sont ni vendues ni cédées à d'autres tiers.</p>

    <h2>Transferts hors de l'Union européenne</h2>
    <p>
      Cloudflare, Inc. est établie aux États-Unis. Pour les transferts de données personnelles depuis l'Espace
      économique européen, Cloudflare indique s'appuyer sur ses certifications au EU-U.S. Data Privacy Framework et
      sur les clauses contractuelles types de la Commission européenne
      (<a
        href="https://www.cloudflare.com/trust-hub/gdpr/"
        rel="noopener"
      >informations RGPD de Cloudflare</a>).
    </p>

    <h2>Durée de conservation</h2>
    <p>
      Vos données sont conservées tant que votre compte existe. Vous pouvez demander à tout moment la suppression
      de votre compte et des données associées en écrivant à l'adresse de contact ; elle sera effectuée dans un
      délai d'un mois.
    </p>

    <h2>Vos droits</h2>
    <p>
      Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité
      sur vos données. Pour les exercer, écrivez à l'adresse de contact. Vous pouvez aussi introduire une réclamation
      auprès de la
      <a
        href="https://www.cnil.fr/fr/plaintes"
        rel="noopener"
      >CNIL</a>.
    </p>
  </LegalPage>
</template>

<script lang="ts" setup>
import { CONTACT_EMAIL } from '~/data/legal'
</script>
