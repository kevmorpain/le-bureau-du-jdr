<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Dégâts — {{ spell.name }}
          </p>
        </template>

        <div class="space-y-4">
          <p class="text-muted text-sm">
            À quel niveau le sort a-t-il été lancé ? Aucun emplacement n'est dépensé ici — il l'a
            déjà été au lancement.
          </p>

          <ul class="space-y-2">
            <li
              v-for="level in levels"
              :key="level"
            >
              <UButton
                block
                :variant="level === selected ? 'solid' : 'outline'"
                @click="selected = level"
              >
                <span class="flex items-center justify-between w-full">
                  <span>Niveau {{ level }}</span>
                  <span class="text-sm font-mono">{{ previewAt(spell, level) }}</span>
                </span>
              </UButton>
            </li>
          </ul>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="open = false"
            >
              Annuler
            </UButton>
            <UButton
              color="warning"
              icon="i-game-icons:blood"
              @click="confirm"
            >
              Jeter les dégâts
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { baseSlotLevel } from '~~/shared/rules/spellScaling'

// Choix du niveau pour le JET DE DÉGÂTS d'un sort d'attaque. Distinct de `CastSpellModal` :
// l'emplacement a déjà été dépensé au lancement, donc on ne consomme rien et on propose les
// niveaux même épuisés — après avoir lancé son dernier emplacement de niveau 3, c'est justement
// à ce niveau-là qu'il faut pouvoir jeter. Un niveau par ligne (le TYPE d'emplacement, pacte ou
// non, ne change rien aux dégâts).
const props = defineProps<{
  spell: Spell
  /** Niveaux d'emplacement que le personnage POSSÈDE (max > 0), tous types confondus. */
  ownedLevels: number[]
  /** Présélection : le niveau du dernier lancement de ce sort. */
  initialLevel?: number
}>()

const emit = defineEmits<{ roll: [slotLevel: number] }>()

const open = defineModel<boolean>('open', { default: false })

const { previewAt } = useSpellEffectPreview()

const levels = computed<number[]>(() => {
  const base = baseSlotLevel(props.spell)
  const candidates = new Set<number>([base, ...props.ownedLevels])
  if (props.initialLevel !== undefined) candidates.add(props.initialLevel)

  return [...candidates].filter(level => level >= base).sort((a, b) => a - b)
})

const selected = ref<number>(baseSlotLevel(props.spell))

watch(open, (val) => {
  if (val) selected.value = props.initialLevel ?? baseSlotLevel(props.spell)
}, { immediate: true })

const confirm = () => {
  emit('roll', selected.value)
  open.value = false
}
</script>
