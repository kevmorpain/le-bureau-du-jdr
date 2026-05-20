<template>
  <div class="flex gap-3 items-stretch">
    <!-- CA -->
    <UTooltip
      class="flex-1"
      :text="armorClass.detail"
    >
      <StatCard
        label="CA"
        class="cursor-help h-full"
      >
        <UIcon
          name="i-game-icons:shield"
          class="size-4 mx-auto mb-0.5 text-muted"
        />
        <p class="text-xl font-bold leading-none">
          {{ armorClass.total }}
        </p>
      </StatCard>
    </UTooltip>

    <!-- Initiative -->
    <UTooltip
      class="flex-1"
      text="Lancer l'initiative"
    >
      <StatCard
        tag="button"
        label="Initiative"
        class="cursor-pointer hover:border-primary hover:text-primary h-full w-full"
        @click="roll?.('Initiative', initiativeBonus)"
      >
        <UIcon
          name="i-game-icons:walking-boot"
          class="size-4 mx-auto mb-0.5 text-muted"
        />
        <p class="text-xl font-bold leading-none">
          {{ formatModifier(initiativeBonus) }}
        </p>
      </StatCard>
    </UTooltip>

    <!-- Vitesse -->
    <UTooltip
      class="flex-1"
      :text="`${Math.round(effectiveSpeed / 1.5)} cases`"
    >
      <StatCard
        label="Vitesse"
        class="h-full"
      >
        <UIcon
          name="i-game-icons:run"
          class="size-4 mx-auto mb-0.5 text-muted"
        />
        <p
          class="text-xl font-bold leading-none"
          :class="speedModifiers.length ? 'text-rose-400' : ''"
        >
          {{ effectiveSpeed }}m
        </p>
        <ConditionWarning
          v-if="speedModifiers.length"
          :lines="speedModifiers"
          class="absolute top-1 right-1"
        />
      </StatCard>
    </UTooltip>

    <!-- Perception passive -->
    <StatCard
      label="Perc. passive"
      class="flex-1"
    >
      <UIcon
        name="i-heroicons:eye"
        class="size-4 mx-auto mb-0.5 text-muted"
      />
      <p class="text-xl font-bold leading-none">
        {{ passivePerception }}
      </p>
    </StatCard>

    <!-- Bonus de maîtrise -->
    <StatCard
      label="Maîtrise"
      class="flex-1"
    >
      <UIcon
        name="i-game-icons:tied-scroll"
        class="size-4 mx-auto mb-0.5 text-muted"
      />
      <p class="text-xl font-bold leading-none">
        {{ formatModifier(proficiencyBonus) }}
      </p>
    </StatCard>

    <!-- Inspiration -->
    <UTooltip
      class="flex-1"
      :text="characterSheet.inspiration ? 'Inspiration active — cliquer pour retirer' : 'Pas d\'inspiration — cliquer pour activer'"
    >
      <StatCard
        tag="button"
        label="Inspiration"
        class="h-full w-full"
      >
        <div
          class="size-12 rounded-full mx-auto border-2 p-1 cursor-pointer"
          :class="characterSheet.inspiration ? 'bg-primary/60 border-primary' : 'border-muted'"
          @click="characterSheet.inspiration = !characterSheet.inspiration"
        >
          <UIcon
            v-if="characterSheet.inspiration"
            name="i-game-icons:enlightenment"
            class="size-full"
          />
        </div>
      </StatCard>
    </UTooltip>
  </div>
</template>

<script lang="ts" setup>
const { roll } = defineProps<{
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  armorClass,
  initiativeBonus,
  effectiveSpeed,
  speedModifiers,
  passivePerception,
  proficiencyBonus,
} = useCharacterSheet(characterSheet)
</script>
