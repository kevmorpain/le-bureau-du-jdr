<template>
  <UCard
    v-if="combat"
    id="kn-combat"
  >
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="font-semibold">
          Combat · round {{ combat.round }}
        </h2>
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
            {{ combat.overseer ? `Overseer vaincu (+${KN_COMBAT_XP.overseer} XP)` : `Combat remporté (+${KN_COMBAT_XP.combat} XP)` }}
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
      <p class="mt-1 text-sm text-muted">
        Les jets se font ici avec les dés de l'outil. À chaque résultat, les dégâts s'appliquent par un bouton, jamais d'office.
        La fin du combat rend D4 Robustesse et libère les aptitudes « une fois par combat » ; une victoire donne aussi l'expérience
        et les gains des Maîtrises. « Annuler » retire le combat sans rien rendre.
      </p>
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

      <div class="space-y-2">
        <p class="text-xs font-medium text-muted">
          Armure du survivant par zone (en attendant le suivi de l'équipement)
        </p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KnNumberField
            v-for="zone in KN_SURVIVOR_ARMOR_ZONES"
            :key="zone"
            :model-value="armorOf(zone)"
            :label="ZONE_LABELS[zone]"
            :min="0"
            :max="9"
            @update:model-value="value => setArmor(zone, value)"
          />
        </div>
      </div>

      <ul class="space-y-2">
        <li
          v-for="(creature, index) in combat.creatures"
          :key="index"
          class="flex flex-wrap items-end gap-3 rounded-md border border-default p-2"
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
          <KnNumberField
            v-model="creature.health"
            :label="`Santé (max ${creature.maxHealth})`"
            :min="0"
            :max="creature.maxHealth"
            class="w-32"
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
            @click="play('surprise')"
          >
            Tenter de surprendre (Furtivité)
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

      <KnCombatAttack
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
import { KN_SURVIVOR_ARMOR_ZONES, type KnSurvivorArmorZone } from '~~/shared/ker-nethalas/combat'
import { knCombatWon } from '~~/shared/ker-nethalas/combatState'
import { knAdvanceCombatEffects } from '~~/shared/ker-nethalas/combatEffects'
import { knDiceLabel } from '~~/shared/ker-nethalas/dice'
import { KN_COMBAT_XP } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnCustomModifier } from '~~/shared/ker-nethalas/status'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCombatLog, knNextCombatRound } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { combat, creatureOf, opposed } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const { win, endCombat, cancelCombat } = useKnCombatEnd(character, () => props.resolved, () => props.masteries)
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)
const { buffParts } = useKnEffectText()
const toast = useToast()

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const ZONE_LABELS: Record<KnSurvivorArmorZone, string> = { head: 'Tête', torso: 'Torse', arms: 'Bras', legs: 'Jambes' }

const won = computed(() => !!combat.value && knCombatWon(combat.value))

const armorOf = (zone: KnSurvivorArmorZone) => character.value.status.armor?.[zone] ?? 0

function setArmor(zone: KnSurvivorArmorZone, value: number) {
  const current = character.value.status.armor ?? { head: 0, torso: 0, arms: 0, legs: 0 }
  character.value.status = { ...character.value.status, armor: { ...current, [zone]: value } }
}

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

const modifier = ref(0)
const lastOpposed = ref('')

// Une surprise ratée se rejoue en Initiative, avec −20 en Perception.
function play(kind: 'surprise' | 'initiative') {
  const outcome = opposed(kind, modifier.value)
  const label = kind === 'surprise' ? 'Furtivité' : 'Perception'
  const summary = `${label} ${outcome.player.value} pour ${outcome.player.target}, créatures ${outcome.foes.value} pour ${outcome.foes.target} (Esprit ${outcome.mind})`
  lastOpposed.value = outcome.winner === 'tie'
    ? `${summary} : égalité parfaite, relancez.`
    : `${summary} : ${outcome.winner === 'a' ? 'le survivant' : 'les créatures'} gagne${outcome.winner === 'a' && kind === 'surprise' ? ' (+20 à la première attaque)' : ''}.`
}
</script>
