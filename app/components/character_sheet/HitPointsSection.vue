<template>
  <div class="space-y-2">
    <div class="flex items-center gap-1">
      <div class="ring ring-inset ring-accented rounded-md focus-within:ring-2 focus-within:ring-primary">
        <UInputNumber
          v-model="characterSheet.currentHp"
          :min="0"
          :max="characterSheet.maxHp"
          :increment="false"
          :decrement="false"
          variant="none"
        />
        /
        <UInputNumber
          v-model="characterSheet.maxHp"
          :min="0"
          :increment="false"
          :decrement="false"
          variant="none"
        />
      </div>
      +
      <UInputNumber
        v-model="characterSheet.temporaryHp"
        :min="0"
        :increment="false"
        :decrement="false"
      />
      PV
    </div>

    <div class="flex items-center gap-1.5">
      <UButton
        icon="i-game-icons:heart-plus"
        size="sm"
        variant="subtle"
        color="success"
      >
        Soins
      </UButton>

      <UButton
        icon="i-game-icons:heart-minus"
        size="sm"
        variant="subtle"
        color="error"
      >
        Dégâts
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
</script>
