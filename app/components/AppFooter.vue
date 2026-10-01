<template>
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">
        Le Bureau du JDR — projet personnel et non lucratif, non officiel, non affilié à Wizards of the Coast.
      </p>
    </template>

    <template #right>
      <nav
        class="flex gap-4 text-sm"
        aria-label="Informations légales"
      >
        <ULink to="/mentions-legales">
          Mentions légales
        </ULink>
        <ULink to="/confidentialite">
          Confidentialité
        </ULink>
      </nav>
    </template>
  </UFooter>
</template>
