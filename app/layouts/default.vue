<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <Logo class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>
  </UHeader>

  <UMain>
    <UPage>
      <UContainer>
        <NuxtPage />
      </UContainer>
    </UPage>
  </UMain>
</template>
