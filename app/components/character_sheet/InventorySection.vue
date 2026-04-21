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
        @click="slideoverOpen = true"
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
            <div class="flex items-center gap-2">
              <!-- Équiper toggle -->
              <UToggle
                :model-value="entry.equipped"
                size="xs"
                :aria-label="entry.equipped ? 'Déséquiper' : 'Équiper'"
                @update:model-value="toggleEquipped(entry.id)"
              />

              <span class="flex-1 font-medium text-sm truncate">
                {{ entry.item?.name }}
                <span
                  v-if="entry.magicBonus > 0"
                  class="text-primary text-xs"
                > +{{ entry.magicBonus }}</span>
              </span>

              <!-- Catégorie + dégâts -->
              <span class="text-sm text-muted">
                {{ weaponDamageSummary(entry) }}
              </span>

              <!-- Warning non-maîtrise -->
              <UTooltip
                v-if="entry.item && !isWeaponProficient(entry.item as InventoryItem)"
                text="Arme non maîtrisée"
              >
                <UIcon
                  name="i-heroicons:exclamation-triangle"
                  class="size-3.5 text-warning shrink-0"
                />
              </UTooltip>

              <!-- Delete -->
              <UButton
                icon="i-heroicons:trash"
                size="xs"
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
                  class="text-muted text-sm"
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
                    v-if="entry.magicBonus > 0 || (entry.magicEffects && entry.magicEffects.length > 0)"
                    class="flex items-center gap-1"
                  >
                    <UBadge
                      :label="`Objet magique ${entry.magicBonus > 0 ? '+' + entry.magicBonus : ''}`"
                      color="primary"
                      variant="soft"
                    />
                  </div>
                </div>

                <UFormField
                  v-if="entry.magicEffects && entry.magicEffects.length > 0"
                  label="Effets magiques"
                >
                  <MagicEffectEditor
                    :model-value="entry.magicEffects"
                    @update:model-value="(v: Effect[]) => updateInventoryEntry(entry.id, { magicEffects: v })"
                  />
                </UFormField>

                <UInput
                  :model-value="entry.notes ?? ''"
                  placeholder="Notes..."
                  size="sm"
                  @change="(e: Event) => updateInventoryEntry(entry.id, { notes: (e.target as HTMLInputElement).value })"
                />
              </div>
            </template>
          </UCollapsible>
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
            <UToggle
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
                size="sm"
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
            <span class="flex-1 font-medium text-sm">{{ entry.item?.name }}</span>

            <UInput
              :model-value="entry.quantity"
              type="number"
              :min="1"
              size="sm"
              class="w-16"
              @change="(e: Event) => updateInventoryEntry(entry.id, { quantity: Number((e.target as HTMLInputElement).value) })"
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
            class="text-sm text-muted mt-1"
          >
            {{ entry.item.description }}
          </p>
        </li>
      </ul>
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
            <span class="flex-1 font-medium text-sm">{{ entry.item?.name }}</span>
            <UBadge
              v-if="entry.item"
              :label="toolCategoryLabel(entry.item)"
              variant="soft"
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
            class="text-sm text-muted mt-1"
          >
            {{ entry.item.description }}
          </p>
        </li>
      </ul>
    </template>
  </div>

  <!-- Slideover d'ajout -->
  <AddItemSlideover
    v-model:open="slideoverOpen"
    :character-sheet="characterSheet"
  />
</template>

<script lang="ts" setup>
import type {
  InventoryEntry,
  InventoryItem,
} from '~/composables/character/useCharacterInventory'
import type { WeaponProperties, ArmorProperties, ToolProperties } from '~~/server/db/schema/items'
import type { Effect } from '~~/server/db/schema/effects'
import { toolTypeLabels } from '~~/shared/utils/item'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  inventory,
  armorClass,
  isWeaponProficient,
  equippedArmorProficiencyWarning,
  armorStealthDisadvantage,
  removeItem,
  updateInventoryEntry,
  toggleEquipped,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const slideoverOpen = ref(false)

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
  const props = entry.item.properties as WeaponProperties
  const dt = damageTypeLabels[props.damage_type] ?? props.damage_type
  return `${props.damage_dice} ${dt}`
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
