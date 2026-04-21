<template>
  <div class="space-y-4">
    <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
      Maîtrises
    </h2>

    <!-- ── Armes ────────────────────────────────────────────────────────────── -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">Armes</h3>
        <UPopover v-model:open="addWeaponOpen">
          <UButton
            icon="i-heroicons:plus"
            size="xs"
            variant="ghost"
          >
            Ajouter
          </UButton>
          <template #content>
            <div class="p-3 space-y-2 w-72">
              <USelect
                v-model="addWeaponSelect"
                :items="weaponAddOptions"
                placeholder="Sélectionner une arme ou catégorie..."
              />
              <UButton
                size="sm"
                class="w-full"
                :disabled="!addWeaponSelect"
                @click="addProficiency('weapon', addWeaponSelect); addWeaponOpen = false; addWeaponSelect = ''"
              >
                Ajouter
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>
      <div
        v-if="weaponProficiencies.length === 0"
        class="text-sm text-muted"
      >
        Aucune maîtrise d'arme
      </div>
      <div
        v-else
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="prof in weaponProficiencies"
          :key="prof"
          :color="isManualGrant('weapon', prof) ? 'primary' : 'neutral'"
          variant="soft"
          class="gap-1"
        >
          {{ weaponProficiencyLabel(prof) }}
          <button
            class="opacity-60 hover:opacity-100 transition-opacity leading-none"
            :aria-label="`Retirer ${weaponProficiencyLabel(prof)}`"
            @click="removeProficiency('weapon', prof)"
          >
            <UIcon name="i-heroicons:x-mark" class="size-3" />
          </button>
        </UBadge>
      </div>
    </div>

    <!-- ── Armures ──────────────────────────────────────────────────────────── -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">Armures</h3>
        <UPopover v-model:open="addArmorOpen">
          <UButton
            icon="i-heroicons:plus"
            size="xs"
            variant="ghost"
          >
            Ajouter
          </UButton>
          <template #content>
            <div class="p-3 space-y-2 w-56">
              <USelect
                v-model="addArmorSelect"
                :items="armorAddOptions"
                placeholder="Type d'armure..."
              />
              <UButton
                size="sm"
                class="w-full"
                :disabled="!addArmorSelect"
                @click="addProficiency('armor', addArmorSelect); addArmorOpen = false; addArmorSelect = ''"
              >
                Ajouter
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>
      <div
        v-if="armorProficiencies.length === 0"
        class="text-sm text-muted"
      >
        Aucune maîtrise d'armure
      </div>
      <div
        v-else
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="prof in armorProficiencies"
          :key="prof"
          :color="isManualGrant('armor', prof) ? 'primary' : 'neutral'"
          variant="soft"
          class="gap-1"
        >
          {{ armorTypeLabels[prof] ?? prof }}
          <button
            class="opacity-60 hover:opacity-100 transition-opacity leading-none"
            :aria-label="`Retirer ${armorTypeLabels[prof] ?? prof}`"
            @click="removeProficiency('armor', prof)"
          >
            <UIcon name="i-heroicons:x-mark" class="size-3" />
          </button>
        </UBadge>
      </div>
    </div>

    <!-- ── Langues ──────────────────────────────────────────────────────────── -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">Langues</h3>
        <UPopover v-model:open="addLanguageOpen">
          <UButton
            icon="i-heroicons:plus"
            size="xs"
            variant="ghost"
          >
            Ajouter
          </UButton>
          <template #content>
            <div class="p-3 space-y-2 w-64">
              <USelect
                v-model="addLanguageSelect"
                :items="languageAddOptions"
                placeholder="Langue connue..."
              />
              <UButton
                size="sm"
                class="w-full"
                :disabled="!addLanguageSelect"
                @click="addProficiency('language', addLanguageSelect); addLanguageOpen = false; addLanguageSelect = ''"
              >
                Ajouter
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>
      <div
        v-if="languageProficiencies.length === 0"
        class="text-sm text-muted"
      >
        Aucune langue maîtrisée
      </div>
      <div
        v-else
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="lang in languageProficiencies"
          :key="lang"
          :color="isManualGrant('language', lang) ? 'primary' : 'neutral'"
          variant="soft"
          class="gap-1"
        >
          {{ languageLabels[lang] ?? lang }}
          <button
            class="opacity-60 hover:opacity-100 transition-opacity leading-none"
            :aria-label="`Retirer ${languageLabels[lang] ?? lang}`"
            @click="removeProficiency('language', lang)"
          >
            <UIcon name="i-heroicons:x-mark" class="size-3" />
          </button>
        </UBadge>
      </div>
    </div>

    <!-- ── Outils ───────────────────────────────────────────────────────────── -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">Outils</h3>
        <UPopover v-model:open="addToolOpen">
          <UButton
            icon="i-heroicons:plus"
            size="xs"
            variant="ghost"
          >
            Ajouter
          </UButton>
          <template #content>
            <div class="p-3 space-y-2 w-72">
              <USelect
                v-model="addToolSelect"
                :items="toolAddOptions"
                placeholder="Sélectionner un outil..."
              />
              <UButton
                size="sm"
                class="w-full"
                :disabled="!addToolSelect"
                @click="addProficiency('tool', addToolSelect); addToolOpen = false; addToolSelect = ''"
              >
                Ajouter
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>
      <div
        v-if="toolProficiencies.length === 0"
        class="text-sm text-muted"
      >
        Aucun outil maîtrisé
      </div>
      <div
        v-else
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="tool in toolProficiencies"
          :key="tool"
          :color="isManualGrant('tool', tool) ? 'primary' : 'neutral'"
          variant="soft"
          class="gap-1"
        >
          {{ tool }}
          <button
            class="opacity-60 hover:opacity-100 transition-opacity leading-none"
            :aria-label="`Retirer ${tool}`"
            @click="removeProficiency('tool', tool)"
          >
            <UIcon name="i-heroicons:x-mark" class="size-3" />
          </button>
        </UBadge>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProficiencyOverrideType } from '~~/server/db/schema/character_proficiency_overrides'
import {
  armorTypeLabels,
  languageLabels,
} from '~~/shared/utils/item'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  weaponProficiencies,
  armorProficiencies,
  languageProficiencies,
  toolProficiencies,
  proficiencyOverrides,
  addProficiencyOverride,
  removeProficiencyOverride,
} = useCharacterSheet(toRef(props, 'characterSheet'))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isManualGrant = (type: ProficiencyOverrideType, value: string): boolean =>
  proficiencyOverrides.value.some(o => o.proficiencyType === type && o.value === value && o.action === 'grant')

const weaponProficiencyLabels: Record<string, string> = {
  simple_weapons: 'Toutes les armes simples',
  martial_weapons: 'Toutes les armes de guerre',
  simple_melee: 'Armes simples de mêlée',
  simple_ranged: 'Armes simples à distance',
  martial_melee: 'Armes de guerre de mêlée',
  martial_ranged: 'Armes de guerre à distance',
}

const weaponProficiencyLabel = (prof: string): string =>
  weaponProficiencyLabels[prof] ?? prof

const addProficiency = (type: ProficiencyOverrideType, value: string) => {
  if (!value.trim()) return
  addProficiencyOverride(type, value.trim(), 'grant')
}

const removeProficiency = (type: ProficiencyOverrideType, value: string) => {
  if (isManualGrant(type, value)) {
    removeProficiencyOverride(type, value)
  } else {
    addProficiencyOverride(type, value, 'revoke')
  }
}

// ─── Options pour les sélecteurs ─────────────────────────────────────────────

const weaponAddOptions = [
  { type: 'label' as const, label: 'Catégories' },
  { label: 'Toutes les armes simples', value: 'simple_weapons' },
  { label: 'Toutes les armes de guerre', value: 'martial_weapons' },
  { label: 'Armes simples de mêlée', value: 'simple_melee' },
  { label: 'Armes simples à distance', value: 'simple_ranged' },
  { label: 'Armes de guerre de mêlée', value: 'martial_melee' },
  { label: 'Armes de guerre à distance', value: 'martial_ranged' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Armes simples de mêlée' },
  { label: 'Gourdin', value: 'Gourdin' },
  { label: 'Dague', value: 'Dague' },
  { label: 'Grande massue', value: 'Grande massue' },
  { label: 'Hachette', value: 'Hachette' },
  { label: 'Javeline', value: 'Javeline' },
  { label: 'Marteau léger', value: 'Marteau léger' },
  { label: "Masse d'armes", value: "Masse d'armes" },
  { label: 'Bâton', value: 'Bâton' },
  { label: 'Faucille', value: 'Faucille' },
  { label: 'Lance', value: 'Lance' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Armes simples à distance' },
  { label: 'Arbalète légère', value: 'Arbalète légère' },
  { label: 'Fléchette', value: 'Fléchette' },
  { label: 'Fronde', value: 'Fronde' },
  { label: 'Arc court', value: 'Arc court' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Armes de guerre de mêlée' },
  { label: "Hache d'armes", value: "Hache d'armes" },
  { label: "Fléau d'armes", value: "Fléau d'armes" },
  { label: 'Glaive', value: 'Glaive' },
  { label: 'Grande hache', value: 'Grande hache' },
  { label: 'Épée à deux mains', value: 'Épée à deux mains' },
  { label: 'Hallebarde', value: 'Hallebarde' },
  { label: 'Lance de cavalier', value: 'Lance de cavalier' },
  { label: 'Épée longue', value: 'Épée longue' },
  { label: 'Morgenstern', value: 'Morgenstern' },
  { label: 'Fauchard', value: 'Fauchard' },
  { label: 'Épieu de guerre', value: 'Épieu de guerre' },
  { label: 'Rapière', value: 'Rapière' },
  { label: 'Cimeterre', value: 'Cimeterre' },
  { label: 'Épée courte', value: 'Épée courte' },
  { label: 'Trident', value: 'Trident' },
  { label: 'Fouet', value: 'Fouet' },
  { label: 'Marteau de guerre', value: 'Marteau de guerre' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Armes de guerre à distance' },
  { label: 'Arbalète à main', value: 'Arbalète à main' },
  { label: 'Arbalète lourde', value: 'Arbalète lourde' },
  { label: 'Arc long', value: 'Arc long' },
]

const armorAddOptions = [
  { label: 'Armure légère', value: 'light' },
  { label: 'Armure intermédiaire', value: 'medium' },
  { label: 'Armure lourde', value: 'heavy' },
  { label: 'Bouclier', value: 'shield' },
  { label: 'Toutes les armures', value: 'all_armor' },
]

const languageAddOptions = Object.entries(languageLabels).map(([value, label]) => ({ label, value }))

const toolAddOptions = [
  { type: 'label' as const, label: 'Outils d\'artisan' },
  { label: 'Outils de forgeron', value: 'Outils de forgeron' },
  { label: 'Outils de charpentier', value: 'Outils de charpentier' },
  { label: 'Outils de cordonnier', value: 'Outils de cordonnier' },
  { label: 'Outils de cuisinier', value: 'Outils de cuisinier' },
  { label: 'Outils de graveur', value: 'Outils de graveur' },
  { label: 'Outils de joaillier', value: 'Outils de joaillier' },
  { label: 'Outils de maçon', value: 'Outils de maçon' },
  { label: 'Outils de peintre', value: 'Outils de peintre' },
  { label: 'Outils de potier', value: 'Outils de potier' },
  { label: 'Outils de tanneur', value: 'Outils de tanneur' },
  { label: 'Outils de tisserand', value: 'Outils de tisserand' },
  { label: 'Outils de tonnelier', value: 'Outils de tonnelier' },
  { label: 'Outils de verrier', value: 'Outils de verrier' },
  { label: "Matériel d'alchimiste", value: "Matériel d'alchimiste" },
  { label: 'Matériel de brasseur', value: 'Matériel de brasseur' },
  { label: 'Matériel de calligraphe', value: 'Matériel de calligraphe' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Instruments de musique' },
  { label: 'Cornemuse', value: 'Cornemuse' },
  { label: 'Cor', value: 'Cor' },
  { label: 'Flûte', value: 'Flûte' },
  { label: 'Luth', value: 'Luth' },
  { label: 'Lyre', value: 'Lyre' },
  { label: 'Tambour', value: 'Tambour' },
  { label: 'Viole', value: 'Viole' },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Jeux' },
  { label: 'Jeu de dés', value: 'Jeu de dés' },
  { label: 'Jeu de cartes du Destin', value: 'Jeu de cartes du Destin' },
  { label: "Jeu d'échecs des dragons", value: "Jeu d'échecs des dragons" },
  { type: 'separator' as const },
  { type: 'label' as const, label: 'Outils spéciaux' },
  { label: 'Outils de voleur', value: 'Outils de voleur' },
  { label: 'Kit de déguisement', value: 'Kit de déguisement' },
  { label: "Kit d'empoisonneur", value: "Kit d'empoisonneur" },
  { label: 'Kit de guérisseur', value: 'Kit de guérisseur' },
  { label: 'Matériel de navigation', value: 'Matériel de navigation' },
  { label: 'Véhicules (terrestres)', value: 'Véhicules (terrestres)' },
  { label: 'Véhicules (maritimes)', value: 'Véhicules (maritimes)' },
]

// ─── State des popovers ───────────────────────────────────────────────────────

const addWeaponOpen = ref(false)
const addWeaponSelect = ref('')

const addArmorOpen = ref(false)
const addArmorSelect = ref('')

const addLanguageOpen = ref(false)
const addLanguageSelect = ref('')

const addToolOpen = ref(false)
const addToolSelect = ref('')
</script>
