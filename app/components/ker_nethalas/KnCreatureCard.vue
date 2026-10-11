<template>
  <div class="space-y-3 rounded-md border border-default p-3">
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="font-semibold">
        {{ creature?.name ?? name }}
      </h3>
      <template v-if="creature">
        <UBadge
          v-for="type in creature.types"
          :key="type"
          :label="$t(`ker_nethalas.creatureTypes.${type}`)"
          color="neutral"
          variant="subtle"
          size="md"
        />
        <UBadge
          v-if="creature.role === 'overseer'"
          label="Overseer"
          color="warning"
          variant="subtle"
          size="md"
        />
      </template>
      <span
        v-if="source"
        class="text-xs text-muted"
      >{{ source }}</span>
    </div>

    <p
      v-if="!creature"
      class="text-sm text-muted"
    >
      Fiche non chargée : notez les caractéristiques du livre.
    </p>

    <template v-else>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
        >
          <dt class="text-xs text-muted">
            {{ stat.label }}
          </dt>
          <dd class="font-medium tabular-nums">
            {{ stat.value }}
          </dd>
        </div>
      </dl>

      <p class="text-sm">
        <span class="text-xs text-muted">Localisation :</span>
        {{ locationText }}
      </p>
      <p class="text-sm">
        <span class="text-xs text-muted">Armure :</span>
        {{ armorText }}
      </p>
      <p class="text-sm">
        <span class="text-xs text-muted">Butin :</span>
        {{ creature.spoils }}
      </p>

      <ul
        v-if="rules.length"
        class="space-y-1 text-sm"
      >
        <li
          v-for="rule in rules"
          :key="rule.title"
        >
          <span class="font-medium">{{ rule.title }}</span>
          <span class="text-muted"> : {{ rule.text }}</span>
        </li>
      </ul>

      <div
        v-if="creature.levelAdaptation.length"
        class="space-y-1"
      >
        <p class="text-xs font-medium text-muted">
          Adaptation au niveau (survivant de niveau {{ level }})
        </p>
        <ul class="space-y-0.5 text-sm">
          <li
            v-for="step in creature.levelAdaptation"
            :key="step.level"
            :class="level > step.level ? '' : 'text-muted'"
          >
            Après le niveau {{ step.level }} : {{ stepText(step) }}
            <span
              v-if="level > step.level"
              class="text-xs text-success"
            >· appliqué</span>
          </li>
        </ul>
      </div>

      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs font-medium text-muted">
            Actions (D6)
          </p>
          <UButton
            size="xs"
            variant="soft"
            icon="i-heroicons:cube"
            @click="rollAction"
          >
            Tirer l'action
          </UButton>
        </div>
        <ul class="space-y-1.5 text-sm">
          <li
            v-for="action in creature.actions"
            :key="action.min"
            class="rounded-md p-1.5"
            :class="actionRoll !== null && actionRoll >= action.min && actionRoll <= action.max ? 'bg-primary/10 ring-1 ring-primary' : ''"
          >
            <span class="mr-1 text-xs text-muted tabular-nums">{{ action.min === action.max ? action.min : `${action.min}-${action.max}` }}</span>
            <span class="font-medium">{{ action.name }}</span>
            <UBadge
              v-if="action.tag"
              :label="action.tag === 'magical' ? 'Magique' : 'Physique'"
              :color="action.tag === 'magical' ? 'info' : 'neutral'"
              variant="subtle"
              size="md"
              class="ml-1"
            />
            <span class="text-muted"> : {{ action.text }}</span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { KN_CREATURE_TYPE_RULES } from '~~/shared/ker-nethalas/catalog/creatureTypes'
import { knCreatureAtLevel, type KnCreature, type KnCreatureArmor, type KnLevelAdaptation } from '~~/shared/ker-nethalas/creatures'
import { knDiceLabel } from '~~/shared/ker-nethalas/dice'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  creature?: KnCreature
  // Nom lu dans la table de tirage, quand la fiche n'est pas chargée.
  name: string
  level: number
  source?: string
}>()

const { t } = useI18n()

const adapted = computed(() => props.creature ? knCreatureAtLevel(props.creature, props.level) : undefined)

const location = (key: string) => t(`ker_nethalas.hitLocations.${key}`)
const damage = (key: string) => t(`ker_nethalas.damageTypes.${key}`)

const stats = computed(() => {
  const c = props.creature
  const a = adapted.value
  if (!c || !a) return []
  return [
    { label: 'Nombre', value: knDiceLabel(c.number) },
    { label: 'Esprit', value: c.mind },
    { label: 'Endurance', value: c.endurance },
    { label: 'Corps', value: c.body },
    { label: 'Santé', value: a.health },
    { label: 'Compétence de combat', value: a.combatSkill },
    { label: 'Résistance magique', value: a.magicResistance },
    { label: 'Dégâts en plus', value: a.damageBonuses.length ? a.damageBonuses.map(dice => `+${knDiceLabel(dice)}`).join(' ') : '–' },
  ]
})

const locationText = computed(() => {
  const hit = props.creature?.hitLocation
  if (!hit) return 'aucune : la créature n\'a qu\'un corps, sans point faible'
  const table = t(`ker_nethalas.hitLocationTables.${hit.table}`)
  return hit.weakSpot ? `${table} (point faible : ${location(hit.weakSpot)})` : table
})

function armorEntry(entry: KnCreatureArmor) {
  const where = entry.locations === 'all'
    ? `toutes les localisations${entry.except?.length ? ` sauf ${entry.except.map(location).join(', ')}` : ''}`
    : entry.locations.map(location).join(', ')
  return `${entry.points} (${where})`
}

const armorText = computed(() => adapted.value?.armor.length ? adapted.value.armor.map(armorEntry).join(' ; ') : 'aucune')

function stepText(step: KnLevelAdaptation) {
  const parts = [
    step.health ? `+${step.health} Santé` : '',
    step.combatSkill ? `+${step.combatSkill} Compétence de combat` : '',
    step.magicResistance ? `+${step.magicResistance} Résistance magique` : '',
    step.damage ? `+${knDiceLabel(step.damage)} aux dégâts` : '',
    step.armor ? `+${armorEntry(step.armor)} d'Armure` : '',
    step.text ?? '',
  ].filter(Boolean)
  return parts.join(', ')
}

// Traits et règles de type de la créature, avec leur effet.
const rules = computed(() => {
  const c = props.creature
  if (!c) return []
  const lines: { title: string, text: string }[] = c.traits.map(trait => ({
    title: t(`ker_nethalas.creatureTraits.${trait.key}.name`) + (trait.value ? ` (${trait.value})` : ''),
    text: t(`ker_nethalas.creatureTraits.${trait.key}.text`, { value: trait.value ?? 0 }),
  }))
  if (c.affinity) lines.push({ title: `Affinité : ${damage(c.affinity)}`, text: 'restaurée par ces dégâts.' })
  if (c.vulnerable?.length) lines.push({ title: 'Vulnérable', text: `dégâts reçus doublés (${c.vulnerable.map(damage).join(', ')}).` })
  if (c.resistant?.length) lines.push({ title: 'Résistant', text: `dégâts reçus divisés par deux (${c.resistant.map(damage).join(', ')}).` })
  if (c.resistantPhysical) lines.push({ title: 'Résistant', text: 'à tous les dégâts physiques non magiques.' })

  for (const type of c.types) {
    const typeRules = KN_CREATURE_TYPE_RULES[type]
    const label = t(`ker_nethalas.creatureTypes.${type}`)
    if (typeRules.immune.length) lines.push({ title: `${label} : immunité`, text: typeRules.immune.map(key => t(`ker_nethalas.conditions.${key}.name`)).join(', ') })
    if (typeRules.vulnerable.length) lines.push({ title: `${label} : vulnérable`, text: typeRules.vulnerable.map(damage).join(', ') })
    if (typeRules.restored.length) lines.push({ title: `${label} : restauré par`, text: typeRules.restored.map(damage).join(', ') })
    if (typeRules.restoredByAffinity) lines.push({ title: `${label} : restauré par`, text: 'les dégâts de son affinité' })
  }
  return lines
})

const actionRoll = ref<number | null>(null)
const rollAction = () => {
  actionRoll.value = knRollDie(6)
}
</script>
