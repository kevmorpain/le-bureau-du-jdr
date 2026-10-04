<template>
  <div class="flex gap-3 items-stretch">
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

    <StatCard
      v-if="!rollsEnabled"
      label="Initiative"
      class="flex-1"
    >
      <UIcon
        name="i-game-icons:walking-boot"
        class="size-4 mx-auto mb-0.5 text-muted"
      />
      <p class="text-xl font-bold leading-none">
        {{ formatModifier(initiativeBonus) }}
      </p>
      <UInput
        :model-value="initiative?.total ?? ''"
        type="number"
        size="xs"
        placeholder="obtenu"
        aria-label="Initiative obtenue"
        class="mt-1 w-full"
        @update:model-value="enterInitiative"
      />
    </StatCard>

    <UTooltip
      v-else
      class="flex-1"
      text="Lancer l'initiative"
    >
      <StatCard
        tag="button"
        label="Initiative"
        class="cursor-pointer hover:border-primary hover:text-primary h-full w-full"
        @click="roll?.('Initiative', initiativeBonus, 20, 1, { d20: { type: 'initiative' } })"
      >
        <UIcon
          name="i-game-icons:walking-boot"
          class="size-4 mx-auto mb-0.5 text-muted"
        />
        <p class="text-xl font-bold leading-none">
          {{ formatModifier(initiativeBonus) }}
        </p>
        <p
          v-if="initiative"
          class="text-xs text-primary font-mono mt-0.5"
        >
          obtenu : {{ initiative.total }}
        </p>
      </StatCard>
    </UTooltip>

    <UTooltip
      class="flex-1"
      :text="`${speedDetail} · ${Math.round(effectiveSpeed / 1.5)} cases`"
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
        <p
          v-for="extra in extraSpeeds"
          :key="extra.label"
          class="text-[11px] font-semibold leading-none text-sky-400 mt-1"
          :title="extra.title"
        >
          {{ extra.speed }}m {{ extra.label }}
        </p>
        <ConditionWarning
          v-if="speedModifiers.length"
          :lines="speedModifiers"
          class="absolute top-1 right-1"
        />
      </StatCard>
    </UTooltip>

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
import type { RollFn } from '~/composables/useDiceRoller'
import { useCombatTracker } from '~/composables/character/useCombatTracker'

const { roll } = defineProps<{
  roll?: RollFn
}>()

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { initiative } = useCombatTracker(characterSheet.value.id)
const rollsEnabled = useRollsEnabled()

const {
  armorClass,
  initiativeBonus,
  effectiveSpeed,
  speedDetail,
  flyingSpeed,
  swimmingSpeed,
  climbingSpeed,
  burrowingSpeed,
  speedModifiers,
  passivePerception,
  proficiencyBonus,
} = useCharacterSheet(characterSheet)

// Le total annoncé à la table : le dé naturel s'en déduit.
const enterInitiative = (value: string | number | undefined) => {
  const total = Number(value)
  initiative.value = value === '' || value === undefined || !Number.isFinite(total)
    ? null
    : { total, natural: total - initiativeBonus.value }
}

const extraSpeeds = computed(() => [
  { label: 'vol', title: 'Vitesse de vol', speed: flyingSpeed.value },
  { label: 'nage', title: 'Vitesse de nage', speed: swimmingSpeed.value },
  { label: 'escalade', title: 'Vitesse d\'escalade', speed: climbingSpeed.value },
  { label: 'creusement', title: 'Vitesse de creusement', speed: burrowingSpeed.value },
].filter(s => s.speed > 0))
</script>
