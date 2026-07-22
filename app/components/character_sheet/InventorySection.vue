<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
        Inventaire
      </h2>
      <UButton
        icon="i-heroicons:plus"
        size="xs"
        variant="ghost"
        @click="openAdd"
      >
        Ajouter
      </UButton>
    </div>

    <UTabs
      v-model="activeTab"
      :items="tabItems"
      size="sm"
    />

    <!-- ── Armes ────────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'weapons'">
      <div
        v-if="weapons.length === 0"
        class="text-sm text-muted text-center py-4"
      >
        Aucune arme dans l'inventaire
      </div>
      <ul
        v-else
        class="space-y-1"
      >
        <li
          v-for="entry in weapons"
          :key="entry.id"
          class="rounded-lg bg-default ring ring-default p-2"
        >
          <UCollapsible>
            <!-- Trigger : seule la ligne principale ouvre le détail -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Équiper toggle -->
              <div @click.stop>
                <USwitch
                  :model-value="entry.equipped"
                  size="sm"
                  :aria-label="entry.equipped ? 'Déséquiper' : 'Équiper'"
                  @update:model-value="toggleEquipped(entry.id)"
                />
              </div>

              <span class="flex-1 font-medium text-sm min-w-0">
                {{ entry.item?.name }}
                <span
                  v-if="entry.magicBonus > 0"
                  class="text-primary text-sm"
                > +{{ entry.magicBonus }}</span>
              </span>

              <!-- Stats inline si équipée -->
              <template v-if="entry.equipped && weaponStatsByEntry.get(entry.id)">
                <div
                  class="flex items-center gap-1 flex-wrap"
                  @click.stop
                >
                  <UButton
                    size="sm"
                    variant="soft"
                    color="primary"
                    @click="rollAttack(entry.id)"
                  >
                    Attaque {{ formatModifier(weaponStatsByEntry.get(entry.id)!.attackBonus) }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="soft"
                    color="neutral"
                    @click="rollDamage(entry.id)"
                  >
                    Dégâts {{ weaponStatsByEntry.get(entry.id)!.damageDice }}{{ weaponStatsByEntry.get(entry.id)!.damageBonus !== 0 ? formatModifier(weaponStatsByEntry.get(entry.id)!.damageBonus) : '' }} {{ damageTypeLabels[weaponStatsByEntry.get(entry.id)!.damageType] ?? weaponStatsByEntry.get(entry.id)!.damageType }}
                  </UButton>
                  <UTooltip
                    v-if="weaponStatsByEntry.get(entry.id)!.isLight"
                    text="Dégâts main secondaire — sans modificateur de caractéristique (combat à deux armes)"
                  >
                    <UButton
                      size="sm"
                      variant="soft"
                      color="neutral"
                      @click="rollOffhand(entry.id)"
                    >
                      Main secondaire {{ weaponStatsByEntry.get(entry.id)!.damageDice }}{{ weaponStatsByEntry.get(entry.id)!.damageBonusOffhand !== 0 ? formatModifier(weaponStatsByEntry.get(entry.id)!.damageBonusOffhand) : '' }} {{ damageTypeLabels[weaponStatsByEntry.get(entry.id)!.damageType] ?? weaponStatsByEntry.get(entry.id)!.damageType }}
                    </UButton>
                  </UTooltip>
                </div>
              </template>

              <!-- Résumé arme non équipée -->
              <span
                v-else-if="!entry.equipped"
                class="text-sm text-muted"
              >
                {{ weaponDamageSummary(entry) }}
              </span>

              <!-- Warning non-maîtrise -->
              <UTooltip
                v-if="entry.item && !isWeaponProficient(entry.item as InventoryItem)"
                text="Arme non maîtrisée : pas de bonus de maîtrise à l'attaque"
              >
                <UIcon
                  name="i-heroicons:exclamation-triangle"
                  class="size-4 text-warning shrink-0"
                />
              </UTooltip>

              <!-- Édition (objets custom uniquement) -->
              <UButton
                v-if="entry.item?.isCustom"
                icon="i-heroicons:pencil-square"
                size="sm"
                variant="ghost"
                color="neutral"
                class="shrink-0"
                @click.stop="openEdit(entry)"
              />

              <!-- Delete -->
              <UButton
                icon="i-heroicons:trash"
                size="sm"
                variant="ghost"
                color="error"
                class="shrink-0"
                @click.stop="removeItem(entry.id)"
              />
            </div>

            <template #content>
              <div class="mt-2 space-y-2 text-sm">
                <p
                  v-if="entry.item?.description"
                  class="text-muted text-sm whitespace-pre-line"
                >
                  {{ entry.item.description }}
                </p>

                <div class="flex flex-wrap gap-2">
                  <div class="flex items-center gap-1">
                    <span class="text-muted text-sm">Qté</span>
                    <UInput
                      :model-value="entry.quantity"
                      type="number"
                      :min="1"
                      size="sm"
                      class="w-16"
                      @change="(e: Event) => updateInventoryEntry(entry.id, { quantity: Number((e.target as HTMLInputElement).value) })"
                    />
                  </div>

                  <div
                    v-if="entry.magicBonus > 0 || (entry.item?.effects && entry.item.effects.length > 0)"
                    class="flex items-center gap-1"
                  >
                    <UBadge
                      :label="`Objet magique ${entry.magicBonus > 0 ? '+' + entry.magicBonus : ''}`"
                      color="primary"
                      variant="soft"
                    />
                  </div>
                </div>

                <!-- Effets magiques baked-in sur l'item (lecture seule — pour
                     modifier, dupliquer en créant un nouvel objet magique). -->
                <div
                  v-if="entry.item?.effects && entry.item.effects.length > 0"
                  class="rounded-lg bg-elevated/30 p-2 text-xs space-y-1"
                >
                  <p class="font-medium text-muted uppercase tracking-wide text-[10px]">
                    Effets magiques
                  </p>
                  <ul class="space-y-0.5">
                    <li
                      v-for="(eff, idx) in entry.item.effects"
                      :key="idx"
                      class="font-mono text-xs text-muted"
                    >
                      {{ eff.type }} : {{ JSON.stringify(eff.value) }}
                    </li>
                  </ul>
                </div>

                <UInput
                  :model-value="entry.notes ?? ''"
                  placeholder="Notes..."
                  size="sm"
                  @change="(e: Event) => updateInventoryEntry(entry.id, { notes: (e.target as HTMLInputElement).value })"
                />
              </div>
            </template>
          </UCollapsible>

          <!-- Toujours visibles, hors UCollapsible -->
          <div class="space-y-1.5 mt-1.5">
            <!-- Propriétés (badges) -->
            <div
              v-if="weaponPropertiesOf(entry).length"
              class="flex flex-wrap items-center gap-1"
            >
              <UTooltip
                v-for="prop in weaponPropertiesOf(entry)"
                :key="prop"
                :text="weaponPropertyTooltips[prop] ?? ''"
              >
                <UBadge
                  :label="weaponPropertyLabels[prop] ?? prop"
                  variant="soft"
                  size="md"
                />
              </UTooltip>
              <span
                v-if="weaponRangeOf(entry)"
                class="text-sm text-muted ml-1"
              >
                Portée : {{ weaponRangeOf(entry) }}
              </span>
            </div>

            <!-- Toggle "Tenue à deux mains" si versatile et équipée -->
            <UCheckbox
              v-if="entry.equipped && weaponStatsByEntry.get(entry.id)?.isVersatile"
              :model-value="entry.usingTwoHanded === true"
              label="Tenue à deux mains"
              size="sm"
              @update:model-value="(val: boolean | 'indeterminate') => setUsingTwoHanded(entry.id, val === true)"
            />

            <!-- Warnings (équipée seulement) -->
            <ul
              v-if="entry.equipped && (weaponStatsByEntry.get(entry.id)?.warnings.length ?? 0) > 0"
              class="space-y-0.5"
            >
              <li
                v-for="warning in weaponStatsByEntry.get(entry.id)!.warnings"
                :key="warning"
                class="flex items-center gap-1 text-sm text-rose-400"
              >
                <UIcon
                  name="i-heroicons:exclamation-triangle-16-solid"
                  class="size-4 shrink-0"
                />
                {{ warning }}
              </li>
            </ul>

            <!-- Charges (armes à utilisations limitées) -->
            <ItemCharges
              :entry="entry"
              :roll="roll"
              @update:current-uses="(v: number) => updateInventoryEntry(entry.id, { currentUses: v })"
            />
          </div>
        </li>
      </ul>
    </template>

    <!-- ── Armures ──────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'armors'">
      <div
        v-if="armors.length === 0"
        class="text-sm text-muted text-center py-4"
      >
        Aucune armure dans l'inventaire
      </div>
      <ul
        v-else
        class="space-y-1"
      >
        <li
          v-for="entry in armors"
          :key="entry.id"
          class="rounded-lg bg-default ring ring-default p-2"
        >
          <div class="flex items-center gap-2">
            <!-- Équiper toggle -->
            <USwitch
              :model-value="entry.equipped"
              size="xs"
              :aria-label="entry.equipped ? 'Déséquiper' : 'Équiper'"
              @update:model-value="onToggleArmor(entry)"
            />

            <span class="flex-1 font-medium text-sm">
              {{ entry.item?.name }}
              <span
                v-if="entry.magicBonus > 0"
                class="text-primary text-xs"
              > +{{ entry.magicBonus }}</span>
            </span>

            <!-- CA si équipée -->
            <span
              v-if="entry.equipped"
              class="text-sm font-mono text-primary"
            >
              CA {{ armorClass.total }}
            </span>
            <span
              v-else
              class="text-sm text-muted"
            >
              {{ armorBaseACSummary(entry) }}
            </span>

            <!-- Désavantage Discrétion -->
            <UTooltip
              v-if="entry.equipped && armorStealthDisadvantage"
              text="Désavantage en Discrétion"
            >
              <UBadge
                label="Discrétion"
                variant="soft"
                color="warning"
                size="md"
              />
            </UTooltip>

            <!-- Warning non-maîtrise -->
            <UTooltip
              v-if="entry.equipped && equippedArmorProficiencyWarning"
              :text="equippedArmorProficiencyWarning"
            >
              <UIcon
                name="i-heroicons:exclamation-triangle"
                class="size-3.5 text-warning shrink-0"
              />
            </UTooltip>

            <!-- Édition (objets custom uniquement) -->
            <UButton
              v-if="entry.item?.isCustom"
              icon="i-heroicons:pencil-square"
              size="xs"
              variant="ghost"
              color="neutral"
              class="shrink-0"
              @click.stop="openEdit(entry)"
            />

            <!-- Delete -->
            <UButton
              icon="i-heroicons:trash"
              size="xs"
              variant="ghost"
              color="error"
              class="shrink-0"
              @click="removeItem(entry.id)"
            />
          </div>

          <!-- Détail armure -->
          <div
            v-if="entry.equipped && armorClass.detail"
            class="text-sm text-muted mt-1 pl-8"
          >
            {{ armorClass.detail }}
          </div>

          <!-- Charges -->
          <ItemCharges
            class="mt-1.5"
            :entry="entry"
            :roll="roll"
            @update:current-uses="(v: number) => updateInventoryEntry(entry.id, { currentUses: v })"
          />
        </li>
      </ul>
    </template>

    <!-- ── Équipement ───────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'equipment'">
      <div
        v-if="equipmentItems.length === 0"
        class="text-sm text-muted text-center py-4"
      >
        Aucun équipement dans l'inventaire
      </div>
      <ul
        v-else
        class="space-y-1"
      >
        <li
          v-for="entry in equipmentItems"
          :key="entry.id"
          class="rounded-lg bg-default ring ring-default p-2"
        >
          <div class="flex items-center gap-2">
            <!-- Équiper toggle (seulement pour l'équipement magique : applique ses effets) -->
            <div
              v-if="hasMagicEffects(entry)"
              @click.stop
            >
              <USwitch
                :model-value="entry.equipped"
                size="sm"
                :aria-label="entry.equipped ? 'Déséquiper' : 'Équiper'"
                @update:model-value="toggleEquipped(entry.id)"
              />
            </div>

            <span class="flex-1 font-medium text-sm">{{ entry.item?.name }}</span>

            <UBadge
              v-if="hasMagicEffects(entry) && entry.equipped"
              label="Effets actifs"
              color="primary"
              variant="soft"
              size="md"
              class="shrink-0"
            />

            <UInput
              :model-value="entry.quantity"
              type="number"
              :min="1"
              size="sm"
              class="w-16"
              @change="(e: Event) => updateInventoryEntry(entry.id, { quantity: Number((e.target as HTMLInputElement).value) })"
            />

            <UButton
              v-if="entry.item?.isCustom"
              icon="i-heroicons:pencil-square"
              size="xs"
              variant="ghost"
              color="neutral"
              @click.stop="openEdit(entry)"
            />
            <UButton
              icon="i-heroicons:trash"
              size="xs"
              variant="ghost"
              color="error"
              @click="removeItem(entry.id)"
            />
          </div>
          <p
            v-if="entry.item?.description"
            class="text-sm text-muted mt-1 whitespace-pre-line"
          >
            {{ entry.item.description }}
          </p>
          <!-- Effets magiques de l'objet -->
          <ul
            v-if="hasMagicEffects(entry)"
            class="mt-1.5 flex flex-wrap gap-1"
          >
            <li
              v-for="(eff, idx) in entry.item!.effects"
              :key="idx"
            >
              <UBadge
                :label="magicEffectLabel(eff)"
                :color="entry.equipped ? 'primary' : 'neutral'"
                variant="soft"
                size="md"
              />
            </li>
          </ul>

          <!-- Charges -->
          <ItemCharges
            class="mt-1.5"
            :entry="entry"
            :roll="roll"
            @update:current-uses="(v: number) => updateInventoryEntry(entry.id, { currentUses: v })"
          />
        </li>
      </ul>

      <!-- Monnaie intégrée dans l'onglet équipement -->
      <USeparator class="my-3" />
      <CurrencySection
        v-model:character-sheet="characterSheetModel"
      />
    </template>

    <!-- ── Outils ───────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'tools'">
      <div
        v-if="toolItems.length === 0"
        class="text-sm text-muted text-center py-4"
      >
        Aucun outil dans l'inventaire
      </div>
      <ul
        v-else
        class="space-y-1"
      >
        <li
          v-for="entry in toolItems"
          :key="entry.id"
          class="rounded-lg bg-default ring ring-default p-2"
        >
          <div class="flex items-center gap-2">
            <!-- Équiper toggle (seulement pour les outils magiques) -->
            <div
              v-if="hasMagicEffects(entry)"
              @click.stop
            >
              <USwitch
                :model-value="entry.equipped"
                size="sm"
                :aria-label="entry.equipped ? 'Déséquiper' : 'Équiper'"
                @update:model-value="toggleEquipped(entry.id)"
              />
            </div>

            <span class="flex-1 font-medium text-sm">{{ entry.item?.name }}</span>
            <UBadge
              v-if="hasMagicEffects(entry) && entry.equipped"
              label="Effets actifs"
              color="primary"
              variant="soft"
              size="md"
              class="shrink-0"
            />
            <UBadge
              v-if="entry.item"
              :label="toolCategoryLabel(entry.item)"
              variant="soft"
            />
            <UButton
              v-if="entry.item?.isCustom"
              icon="i-heroicons:pencil-square"
              size="xs"
              variant="ghost"
              color="neutral"
              @click.stop="openEdit(entry)"
            />
            <UButton
              icon="i-heroicons:trash"
              size="xs"
              variant="ghost"
              color="error"
              @click="removeItem(entry.id)"
            />
          </div>
          <p
            v-if="entry.item?.description"
            class="text-sm text-muted mt-1 whitespace-pre-line"
          >
            {{ entry.item.description }}
          </p>
          <ul
            v-if="hasMagicEffects(entry)"
            class="mt-1.5 flex flex-wrap gap-1"
          >
            <li
              v-for="(eff, idx) in entry.item!.effects"
              :key="idx"
            >
              <UBadge
                :label="magicEffectLabel(eff)"
                :color="entry.equipped ? 'primary' : 'neutral'"
                variant="soft"
                size="md"
              />
            </li>
          </ul>

          <!-- Charges -->
          <ItemCharges
            class="mt-1.5"
            :entry="entry"
            :roll="roll"
            @update:current-uses="(v: number) => updateInventoryEntry(entry.id, { currentUses: v })"
          />
        </li>
      </ul>
    </template>
  </div>

  <!-- Slideover d'ajout / d'édition -->
  <AddItemSlideover
    v-model:open="slideoverOpen"
    :character-sheet="characterSheet"
    :edit-item="editingItem"
  />
</template>

<script lang="ts" setup>
import type {
  InventoryEntry,
  InventoryItem,
} from '~/composables/character/useCharacterInventory'
import type { WeaponProperties, ArmorProperties, ToolProperties } from '~~/server/db/schema/items'
import type { Effect } from '~~/server/db/schema/effects'
import { toolTypeLabels, weaponPropertyLabels, weaponPropertyTooltips } from '~~/shared/utils/item'

const props = defineProps<{
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const characterSheetModel = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  inventory,
  armorClass,
  isWeaponProficient,
  equippedArmorProficiencyWarning,
  armorStealthDisadvantage,
  equippedWeaponStats,
  removeItem,
  updateInventoryEntry,
  toggleEquipped,
  setUsingTwoHanded,
} = useCharacterSheet(characterSheetModel)

// ─── Objets magiques (effets via item_effects) ──────────────────────────────

const hasMagicEffects = (entry: InventoryEntry): boolean =>
  (entry.item?.effects?.length ?? 0) > 0

// Libellé FR court d'un effet magique, pour les badges d'inventaire.
const magicEffectLabel = (effect: Effect): string => {
  const v = effect.value as any
  switch (effect.type) {
    case 'spell_save_dc_bonus': return `+${v.amount} DD des sorts`
    case 'spell_attack_bonus': return `+${v.amount} attaque des sorts`
    case 'initiative_bonus': return `+${v.amount} initiative`
    case 'hp_per_level': return `+${v.amount} PV/niveau`
    case 'passive_skill_bonus': {
      const skill = v.skill === 'investigation' ? 'Investigation' : 'Perception'
      return `+${v.amount} ${skill} passive`
    }
    case 'walking_speed': return `+${v} m de vitesse`
    case 'darkvision': return `Vision dans le noir ${v.range} m`
    case 'ability_increase': return `+${v.amount} ${v.ability?.toUpperCase()}`
    case 'damage_resistance': return `Résistance ${damageTypeLabels[v.damageType] ?? v.damageType}`
    case 'damage_immunity': return `Immunité ${damageTypeLabels[v.damageType] ?? v.damageType}`
    case 'vulnerability': return `Vulnérabilité ${damageTypeLabels[v.damageType] ?? v.damageType}`
    default: return effect.type
  }
}

// Map d'accès rapide aux stats par entryId
const weaponStatsByEntry = computed(() => {
  const map = new Map<number, typeof equippedWeaponStats.value[number]>()
  for (const w of equippedWeaponStats.value) map.set(w.entryId, w)
  return map
})

const parseDice = (dice: string): { count: number, sides: number } => {
  const [c, s] = dice.split('d').map(Number)
  return { count: c || 1, sides: s || 6 }
}

const rollAttack = (entryId: number) => {
  const w = weaponStatsByEntry.value.get(entryId)
  if (!w) return
  props.roll?.(`Attaque — ${w.name}`, w.attackBonus)
}

const rollDamage = (entryId: number) => {
  const w = weaponStatsByEntry.value.get(entryId)
  if (!w) return
  const { count, sides } = parseDice(w.damageDice)
  const label = w.usingTwoHanded ? `Dégâts (2 mains) — ${w.name}` : `Dégâts — ${w.name}`
  props.roll?.(label, w.damageBonus, sides, count)
}

const rollOffhand = (entryId: number) => {
  const w = weaponStatsByEntry.value.get(entryId)
  if (!w) return
  const { count, sides } = parseDice(w.damageDice)
  props.roll?.(`Dégâts main sec. — ${w.name}`, w.damageBonusOffhand, sides, count)
}

const slideoverOpen = ref(false)

// Objet en cours d'édition (null = mode ajout). Seuls les objets custom sont éditables.
const editingItem = ref<InventoryItem | null>(null)

const openAdd = () => {
  editingItem.value = null
  slideoverOpen.value = true
}

const openEdit = (entry: InventoryEntry) => {
  if (!entry.item?.isCustom) return
  editingItem.value = entry.item
  slideoverOpen.value = true
}

// Réinitialise la cible d'édition quand le slideover se ferme.
watch(slideoverOpen, (isOpen) => {
  if (!isOpen) editingItem.value = null
})

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const activeTab = ref('weapons')

const tabItems = computed(() => [
  { label: `Armes ${weapons.value.length ? `(${weapons.value.length})` : ''}`, value: 'weapons' },
  { label: `Armures ${armors.value.length ? `(${armors.value.length})` : ''}`, value: 'armors' },
  { label: `Équipement ${equipmentItems.value.length ? `(${equipmentItems.value.length})` : ''}`, value: 'equipment' },
  { label: `Outils ${toolItems.value.length ? `(${toolItems.value.length})` : ''}`, value: 'tools' },
])

// ─── Filtered inventory ───────────────────────────────────────────────────────

const weapons = computed(() =>
  (inventory.value ?? []).filter((e: InventoryEntry) => e.item?.itemType === 'weapon'),
)
const armors = computed(() =>
  (inventory.value ?? []).filter((e: InventoryEntry) => e.item?.itemType === 'armor'),
)
const equipmentItems = computed(() =>
  (inventory.value ?? []).filter((e: InventoryEntry) => e.item?.itemType === 'equipment'),
)
const toolItems = computed(() =>
  (inventory.value ?? []).filter((e: InventoryEntry) => e.item?.itemType === 'tool'),
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const damageTypeLabels: Record<string, string> = {
  acid: 'acide', bludgeoning: 'contondant', cold: 'froid', fire: 'feu', force: 'force',
  lightning: 'foudre', necrotic: 'nécrotique', piercing: 'perçant', poison: 'poison',
  psychic: 'psychique', radiant: 'radiant', slashing: 'tranchant', thunder: 'tonnerre',
}

const weaponDamageSummary = (entry: InventoryEntry): string => {
  if (!entry.item) return ''
  const wprops = entry.item.properties as WeaponProperties
  const dt = damageTypeLabels[wprops.damage_type] ?? wprops.damage_type
  return `${wprops.damage_dice} ${dt}`
}

const weaponPropertiesOf = (entry: InventoryEntry): string[] => {
  if (entry.item?.itemType !== 'weapon') return []
  return (entry.item.properties as WeaponProperties).weapon_properties ?? []
}

const weaponRangeOf = (entry: InventoryEntry): string | null => {
  if (entry.item?.itemType !== 'weapon') return null
  const wprops = entry.item.properties as WeaponProperties
  const isThrown = wprops.weapon_properties.includes('thrown')
  const isRanged = wprops.weapon_category.endsWith('ranged')
  if (!wprops.range || (!isThrown && !isRanged)) return null
  return `${wprops.range.normal} m / ${wprops.range.long} m`
}

const armorBaseACSummary = (entry: InventoryEntry): string => {
  if (!entry.item) return ''
  const props = entry.item.properties as ArmorProperties
  if (props.armor_type === 'shield') return '+2 CA'
  const dexStr = props.dex_limit === null ? '+DEX' : props.dex_limit === 0 ? '' : `+DEX (max +${props.dex_limit})`
  return `CA ${props.base_ac}${dexStr}`
}

const toolCategoryLabel = (item: InventoryItem): string => {
  const props = item.properties as ToolProperties
  return toolTypeLabels[props.tool_type] ?? props.category
}

// ─── Armor equip logic (only one body armor at a time) ───────────────────────

const onToggleArmor = async (entry: InventoryEntry) => {
  const props = entry.item?.properties as ArmorProperties | undefined
  const isShield = props?.armor_type === 'shield'

  if (!entry.equipped && !isShield) {
    // Déséquiper toute armure de corps existante avant d'en équiper une nouvelle
    const currentBodyArmor = (inventory.value ?? []).find((e: InventoryEntry) => {
      if (!e.equipped || e.item?.itemType !== 'armor') return false
      const p = e.item.properties as ArmorProperties
      return p.armor_type !== 'shield'
    })
    if (currentBodyArmor && currentBodyArmor.id !== entry.id) {
      await updateInventoryEntry(currentBodyArmor.id, { equipped: false })
    }
  }

  await toggleEquipped(entry.id)
}
</script>
