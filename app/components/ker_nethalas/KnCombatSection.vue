<template>
  <UCard
    v-if="combat"
    id="kn-combat"
  >
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <KnCardHeader :title="`Combat · round ${combat.round}`">
          Les jets se font ici avec les dés de l'outil. À chaque résultat, les dégâts s'appliquent par un bouton, jamais d'office.
          La fin du combat rend D4 Robustesse et libère les aptitudes « une fois par combat » ; une victoire donne aussi l'expérience
          et les gains des Maîtrises. « Annuler » retire le combat sans rien rendre.
        </KnCardHeader>
        <UBadge
          v-if="combat.first"
          :label="combat.first === 'survivor' ? 'Le survivant agit en premier' : 'Les créatures agissent en premier'"
          color="neutral"
          variant="subtle"
          size="md"
        />
        <div class="ml-auto flex flex-wrap gap-2">
          <UButton
            size="sm"
            variant="soft"
            @click="nextRound"
          >
            Round suivant
          </UButton>
          <UButton
            size="sm"
            :variant="won ? 'solid' : 'soft'"
            @click="win(combat.overseer ? 'overseer' : 'combat')"
          >
            {{ combat.overseer ? `Overseer vaincu (+${KN_XP.overseer} XP)` : `Combat remporté (+${KN_XP.combat} XP)` }}
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            @click="endCombat"
          >
            Combat terminé sans victoire
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            @click="cancelCombat"
          >
            Annuler le combat
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-5">
      <div
        v-if="activeEffects.length"
        class="space-y-1"
      >
        <p class="text-xs font-medium text-muted">
          Effets en cours sur le survivant
        </p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="effect in activeEffects"
            :key="effect.id"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="font-medium">{{ effect.name }}</span>
            <span class="text-muted">{{ effectInfo(effect) }}</span>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              @click="removeEffect(effect.id)"
            >
              Retirer
            </UButton>
          </li>
        </ul>
      </div>

      <KnCombatFear
        v-model:character="character"
        :resolved
      />

      <ul class="space-y-2">
        <li
          v-for="(creature, index) in combat.creatures"
          :key="index"
          class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-default p-3"
          :class="creature.health <= 0 ? 'opacity-60' : ''"
        >
          <div class="min-w-40 flex-1">
            <p class="font-medium">
              {{ creature.name }}
              <UBadge
                v-if="creature.health <= 0"
                label="Vaincue"
                color="success"
                variant="subtle"
                size="md"
              />
              <UBadge
                v-if="creature.spent"
                label="A agi : disparaît"
                color="neutral"
                variant="subtle"
                size="md"
              />
              <UBadge
                v-for="effect in creature.effects"
                :key="effect.label"
                :label="effect.rounds ? `${effect.label} (${effect.rounds})` : effect.label"
                color="warning"
                variant="subtle"
                size="md"
                :title="buffParts(effect).join(', ')"
              />
              <UBadge
                v-if="creature.temporary"
                :label="`+${creature.temporary} Santé temporaire`"
                color="info"
                variant="subtle"
                size="md"
              />
            </p>
            <p
              v-if="!creatureOf(index)"
              class="text-xs text-warning"
            >
              Fiche non chargée
            </p>
          </div>
          <div class="w-44 space-y-1">
            <div class="flex justify-between text-xs text-muted">
              <span>Santé</span>
              <span class="tabular-nums">{{ creature.health }} / {{ creature.maxHealth }}</span>
            </div>
            <UProgress
              :model-value="Math.max(0, creature.health)"
              :max="Math.max(1, creature.maxHealth)"
              size="sm"
              color="error"
            />
          </div>
          <KnNumberField
            v-model="creature.health"
            :aria-label="`Santé de ${creature.name} (max ${creature.maxHealth})`"
            :min="0"
            :max="creature.maxHealth"
            class="w-24"
          />
        </li>
      </ul>

      <div class="space-y-2">
        <div class="flex flex-wrap items-end gap-2">
          <KnNumberField
            v-model="modifier"
            label="Bonus ou malus au test"
            :min="-99"
            :max="99"
            class="w-40"
          />
          <UButton
            variant="soft"
            icon="i-heroicons:cube"
            :disabled="cannotSurprise"
            @click="play('surprise')"
          >
            {{ knHasActivePerk(character, 'livingShadow') ? 'Surprendre (Atout, sans test)' : 'Tenter de surprendre (Furtivité)' }}
          </UButton>
          <UButton
            variant="soft"
            icon="i-heroicons:cube"
            @click="play('initiative')"
          >
            Initiative (Perception)
          </UButton>
        </div>
        <p
          v-if="cannotSurprise"
          class="text-sm text-warning"
        >
          Une créature Alerte ne peut être surprise d'aucune façon, même par un Atout : jouez l'Initiative.
        </p>
        <p
          v-if="lastOpposed"
          class="text-sm"
        >
          {{ lastOpposed }}
        </p>
        <p class="text-xs text-muted">
          Contre l'Esprit le plus haut des créatures en vie. Une surprise réussie donne l'initiative et +20 à votre première
          attaque ; une surprise ratée se rejoue en Initiative avec −20 en Perception.
        </p>
      </div>

      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            size="sm"
            variant="soft"
            icon="i-heroicons:light-bulb"
            @click="setLamp(!combat.lampDown)"
          >
            {{ combat.lampDown ? 'Reprendre la lampe' : 'Poser la lampe (Action Standard)' }}
          </UButton>
          <UBadge
            v-if="combat.lampDown"
            label="Lampe posée : une maladresse la renverse"
            color="warning"
            variant="subtle"
            size="md"
          />
        </div>
        <p
          v-if="handsWarning"
          class="text-sm text-warning"
        >
          Vos deux mains sont prises : une Torche ou une Lampe demande une main libre (sauf une Lampe de ceinture ou un sort).
          Posez la lampe au sol, ou libérez une main.
        </p>
        <p
          v-else-if="combat.lampDown"
          class="text-xs text-muted"
        >
          Une seconde arme à une main se dégaine, ou une arme à deux mains se tient, pendant que la lampe est posée.
        </p>
      </div>

      <KnCombatAttack
        v-model:character="character"
        :resolved
        :bestiary
      />

      <KnCombatAbilities
        v-model:character="character"
        :masteries
        :resolved
      />

      <KnCombatMinions
        v-model:character="character"
        :resolved
        :bestiary
      />

      <KnCombatTurn
        v-model:character="character"
        :resolved
        :bestiary
      />

      <div
        v-if="combat.log.length"
        class="space-y-1"
      >
        <p class="text-xs font-medium text-muted">
          Journal du combat
        </p>
        <ul class="space-y-0.5 text-xs text-muted">
          <li
            v-for="(line, index) in combat.log"
            :key="index"
          >
            {{ line }}
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knCombatWon } from '~~/shared/ker-nethalas/combatState'
import { knAdvanceCombatEffects } from '~~/shared/ker-nethalas/combatEffects'
import { knDiceLabel } from '~~/shared/ker-nethalas/dice'
import { knFreeHands } from '~~/shared/ker-nethalas/equipment'
import { KN_XP } from '~~/shared/ker-nethalas/experience'
import type { KnCustomModifier } from '~~/shared/ker-nethalas/status'
import { knCannotBeSurprised, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import { knHasActivePerk } from '~~/shared/ker-nethalas/goalEffects'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCombatLog, knNextCombatRound } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { combat, creatureOf, opposed, surpriseAutomatically, setLamp } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const { win, endCombat, cancelCombat } = useKnCombatEnd(character, () => props.resolved, () => props.masteries, () => props.bestiary)
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)
const { buffParts } = useKnEffectText()
const toast = useToast()

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const won = computed(() => !!combat.value && knCombatWon(combat.value))

const activeEffects = computed(() => character.value.status.custom.filter(modifier => modifier.combat))

function effectInfo(effect: KnCustomModifier) {
  const duration = effect.rounds === undefined ? 'jusqu\'à la fin du combat' : `${effect.rounds} round${effect.rounds > 1 ? 's' : ''} restant${effect.rounds > 1 ? 's' : ''}`
  const tick = effect.tick ? ` · ${knDiceLabel(effect.tick.dice)} dégâts${effect.tick.direct ? ' directs' : ''} à chaque début de tour` : ''
  return `${duration}${tick}${effect.entries.length ? ' · modificateurs appliqués à la fiche' : ''}`
}

function removeEffect(id: string) {
  character.value.status = { ...character.value.status, custom: character.value.status.custom.filter(modifier => modifier.id !== id) }
}

// Le round passe : les effets de combat infligent leurs dégâts de début de tour, puis perdent un round.
function nextRound() {
  const { status, ticks, expired } = knAdvanceCombatEffects(character.value.status)
  character.value.status = status
  character.value.run = knNextCombatRound(character.value.run)
  if (expired.length) {
    toast.add({ title: 'Effets terminés', description: expired.join(', '), color: 'neutral' })
  }
  if (!ticks.length) return
  character.value.run = knCombatLog(character.value.run, `Round ${combat.value?.round ?? 1} : ${ticks.map(tick => `${tick.name} ${tick.roll}`).join(', ')}`)
  applyEffects(ticks.map(tick => ({ kind: 'damage' as const, dice: { count: 0, sides: 0, bonus: tick.roll }, ...(tick.direct ? { direct: true } : {}) })), 'Début du tour')
}

const handsWarning = computed(() =>
  !combat.value?.lampDown && character.value.run.lightRemaining > 0 && knFreeHands(character.value.inventory) === 0,
)

const cannotSurprise = computed(() => knCannotBeSurprised(
  (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0 && creatureOf(index) ? [creatureOf(index)!] : []),
))

const modifier = ref(0)
const lastOpposed = ref('')

// Une surprise ratée se rejoue en Initiative, avec −20 en Perception.
function play(kind: 'surprise' | 'initiative') {
  if (kind === 'surprise' && cannotSurprise.value) return
  if (kind === 'surprise' && knHasActivePerk(character.value, 'livingShadow')) {
    surpriseAutomatically()
    lastOpposed.value = 'Atout de surprise : la surprise réussit sans test (+20 à la première attaque).'
    return
  }
  const outcome = opposed(kind, modifier.value)
  const label = kind === 'surprise' ? 'Furtivité' : 'Perception'
  const summary = `${label} ${outcome.player.value} pour ${outcome.player.target}, créatures ${outcome.foes.value} pour ${outcome.foes.target} (Esprit ${outcome.mind})`
  lastOpposed.value = outcome.winner === 'tie'
    ? `${summary} : égalité parfaite, relancez.`
    : `${summary} : ${outcome.winner === 'a' ? 'le survivant' : 'les créatures'} gagne${outcome.winner === 'a' && kind === 'surprise' ? ' (+20 à la première attaque)' : ''}.`
}
</script>
