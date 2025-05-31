<template>
  <UContainer>
    <div v-if="$pwa?.needRefresh">
      <span>
        New content available, click on reload button to update.
      </span>

      <button @click="$pwa.updateServiceWorker()">
        Reload
      </button>
    </div>
    <nav>
      <ul>
        <li>
          <NuxtLink to="/">Home</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/spells">Spells</NuxtLink>
        </li>
      </ul>
    </nav>
  </UContainer>
</template>
