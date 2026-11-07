<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">🎒</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Équipement</h2>
        <p class="text-sm text-muted mt-0.5">Choisissez l'équipement de départ de votre classe. L'équipement d'historique s'y ajoute.</p>
      </div>
    </div>

    <div v-if="!classData" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-8 text-center text-sm text-muted">
      Veuillez d'abord choisir une classe.
    </div>

    <template v-else>
      <div v-for="section in sections" :key="section.source" class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Équipement — {{ section.title }}</p>
        <div class="flex flex-col gap-3">
          <div
            v-for="(group, g) in section.groups"
            :key="g"
            class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4"
          >
            <template v-if="groupOptions(group).length > 1">
              <p class="text-xs text-muted mb-2">Choisissez une option</p>
              <div class="flex flex-wrap gap-2 mb-2">
                <button
                  v-for="(opt, o) in groupOptions(group)"
                  :key="o"
                  type="button"
                  class="px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer"
                  :class="chosenOptionIndex(group, selection, section.source, g) === o
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
                    : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
                  @click="setOption(section.source, g, o)"
                >
                  {{ optionLabel(opt) }}
                </button>
              </div>
            </template>
            <template v-else>
              <p class="text-xs text-muted/60 mb-1.5">Inclus automatiquement</p>
              <p class="text-sm text-(--ui-text)">{{ optionLabel(groupOptions(group)[0]!) }}</p>
            </template>

            <template v-for="(ref, r) in chosenRefs(section.source, group, g)" :key="r">
              <p v-if="'pack' in ref" class="text-xs text-muted/70 mt-2">
                {{ packName(ref.pack) }} : {{ packContents(ref.pack) }}
              </p>
              <div v-else-if="'pick' in ref" class="mt-2">
                <p class="text-xs text-muted/70 mb-2">Choisissez : {{ selectorLabel(ref.pick) }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="candidate in candidatesFor(ref.pick, items)"
                    :key="candidate.id"
                    type="button"
                    class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer"
                    :class="selection.picks[pickKey(section.source, g, chosenOptionIndex(group, selection, section.source, g), r)] === candidate.name
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium'
                      : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-emerald-500/40'"
                    @click="setPick(pickKey(section.source, g, chosenOptionIndex(group, selection, section.source, g), r), candidate.name)"
                  >
                    {{ candidate.name }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Inventaire final
          <span class="text-amber-400 ml-1.5">{{ startingEquipment.lines.length }} objets</span>
          <span v-if="startingEquipment.po" class="text-amber-400 ml-1.5">· {{ startingEquipment.po }} po</span>
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="line in startingEquipment.lines"
            :key="line.name"
            class="text-xs px-2.5 py-1 rounded-full border border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text)"
          >
            {{ line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name }}
          </span>
        </div>
      </div>

      <div
        v-if="pactBoon === 'blade'"
        class="mt-6"
      >
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          🌑 Arme de Pacte (facultatif)
        </p>
        <p class="text-xs text-muted mb-3">Désignez une arme de corps-à-corps comme arme de pacte.</p>
        <div class="flex flex-col gap-1.5">
          <button
            type="button"
            class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
            :class="state.pactWeaponItemName === null
              ? 'border-violet-500/60 bg-violet-500/10 text-violet-400 font-semibold'
              : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-violet-500/40'"
            @click="state.pactWeaponItemName = null"
          >
            Choisir plus tard
          </button>
          <button
            v-for="item in meleEquipmentItems"
            :key="item"
            type="button"
            class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
            :class="state.pactWeaponItemName === item
              ? 'border-violet-500/60 bg-violet-500/10 text-violet-400 font-semibold'
              : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-violet-500/40'"
            @click="state.pactWeaponItemName = item"
          >
            {{ item }}
          </button>
          <p v-if="!meleEquipmentItems.length" class="text-xs text-muted italic px-2">Aucune arme dans l'équipement sélectionné — ajoutez-en une ou choisissez plus tard.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {
  EQUIPMENT_PACKS,
  candidatesFor,
  chosenOptionIndex,
  groupKey,
  groupOptions,
  optionLabel,
  pickKey,
  refLabel,
  selectorLabel,
  type EquipmentGroup,
  type PackKey,
} from '~~/shared/rules/startingEquipment'

const {
  state,
  classData,
  backgroundData,
  equipmentSources,
  startingEquipment,
  pactBoon,
} = useCharacterBuilder()

const { items } = useBuilderEntities()

const selection = computed(() => state.value.equipmentSelection)

const sections = computed(() => [
  classData.value && { source: `class:${classData.value.id}`, title: classData.value.name, groups: classData.value.equipment },
  backgroundData.value && { source: `background:${backgroundData.value.id}`, title: backgroundData.value.name, groups: backgroundData.value.equipment },
].filter(s => s && equipmentSources.value[s.source]?.length) as { source: string, title: string, groups: EquipmentGroup[] }[])

const chosenRefs = (source: string, group: EquipmentGroup, g: number) =>
  groupOptions(group)[chosenOptionIndex(group, selection.value, source, g)]!.refs

const packName = (key: PackKey) => EQUIPMENT_PACKS[key].name
const packContents = (key: PackKey) => EQUIPMENT_PACKS[key].items.map(refLabel).join(' · ')

function setOption(source: string, group: number, option: number) {
  state.value.equipmentSelection.options[groupKey(source, group)] = option
}

function setPick(key: string, name: string) {
  state.value.equipmentSelection.picks[key] = name
}

const meleeItemNames = computed(() => new Set(items.value
  .filter((it) => {
    const category = (it.properties as { weapon_category?: string }).weapon_category
    return it.itemType === 'weapon' && (category === 'simple_melee' || category === 'martial_melee')
  })
  .map(it => it.name)))

const meleEquipmentItems = computed(() =>
  startingEquipment.value.lines.map(l => l.name).filter(name => meleeItemNames.value.has(name)),
)
</script>
