<template>
  <UCard>
    <template #header>
      <KnCardHeader title="Marchand">
        Un marchand rachète à la moitié du prix, sauf les gemmes et bijoux, payés à leur valeur entière. Un objet magique se vend à prix fixe
        (Peu commun 200, Rare 400, Épique 600, Relique 1 000) une fois harmonisé. Les amulettes ne se vendent pas.
        <template #extra>
          <span class="text-sm text-muted">
            Pièces : <span class="font-semibold text-default">{{ character.coins }}</span>
          </span>
        </template>
      </KnCardHeader>
    </template>

    <div class="grid gap-6 md:grid-cols-2">
      <section class="space-y-3">
        <h3 class="font-medium">
          Acheter
        </h3>
        <p
          v-if="!catalog"
          class="text-sm text-muted"
        >
          Le catalogue n'est pas chargé.
        </p>
        <template v-else>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="Objet">
              <USelect
                v-model="buyKey"
                :items="buyItems"
                placeholder="Choisir un objet"
                class="w-64"
              />
            </UFormField>
            <KnNumberField
              v-model="buyCount"
              label="Quantité"
              :min="1"
              :max="99"
              class="w-24"
            />
            <UButton
              icon="i-heroicons:shopping-cart"
              :disabled="!buyEntry || buyPrice > character.coins"
              @click="buy"
            >
              Acheter{{ buyEntry ? ` (${buyPrice} ₵)` : '' }}
            </UButton>
          </div>
          <p
            v-if="buyEntry && buyPrice > character.coins"
            class="text-sm text-warning"
          >
            Il manque {{ buyPrice - character.coins }} ₵.
          </p>
        </template>
      </section>

      <section class="space-y-3">
        <h3 class="font-medium">
          Vendre
        </h3>
        <ul
          v-if="sellable.length || sellableProvisions.length"
          class="space-y-1 text-sm"
        >
          <li
            v-for="item in sellable"
            :key="item.id"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="min-w-40 flex-1">{{ item.name }}{{ item.quantity > 1 ? ` × ${item.quantity}` : '' }}</span>
            <span
              v-if="knIsUnsellable(item)"
              class="text-xs text-muted"
            >
              à harmoniser avant de vendre
            </span>
            <UButton
              v-else
              size="xs"
              variant="soft"
              @click="sell(item.id)"
            >
              Vendre ({{ knSellPrice(item) }} ₵)
            </UButton>
          </li>
          <li
            v-for="entry in sellableProvisions"
            :key="entry.key"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="min-w-40 flex-1">{{ entry.name }} ({{ character.provisions[entry.provision!] }})</span>
            <UButton
              size="xs"
              variant="soft"
              @click="sellProvision(entry)"
            >
              Vendre 1 ({{ knUnitSellPrice(entry) }} ₵)
            </UButton>
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-muted"
        >
          Rien à vendre : seuls les objets du sac, et les provisions que le catalogue connaît, se vendent.
        </p>
      </section>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import { knBuy, knIsUnsellable, knSell, knSellPrice, knSellProvision, knUnitSellPrice, type KnTradeResult } from '~~/shared/ker-nethalas/trade'

const props = defineProps<{
  catalog: KnCatalogItem[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const toast = useToast()
const { record } = useKnGoalProgress(character)

const buyKey = ref<string | undefined>()
const buyCount = ref(1)

const buyItems = computed<SelectItem[]>(() =>
  (props.catalog ?? []).map(entry => ({ label: `${entry.name} — ${t(`ker_nethalas.inventory.kinds.${entry.kind}`).toLowerCase()}, ${entry.value} ₵`, value: entry.key })),
)
const buyEntry = computed(() => props.catalog?.find(entry => entry.key === buyKey.value))
const buyPrice = computed(() => (buyEntry.value?.value ?? 0) * buyCount.value)

const sellable = computed(() => character.value.inventory.filter(item => item.place === 'bag'))
const sellableProvisions = computed(() =>
  (props.catalog ?? []).filter(entry => entry.provision && character.value.provisions[entry.provision] > 0 && entry.value > 0),
)

const state = () => ({ coins: character.value.coins, inventory: character.value.inventory, provisions: character.value.provisions })

function commit(result: KnTradeResult, title: string) {
  if ('error' in result) {
    toast.add({ title: { coins: 'Pas assez de pièces', full: 'Plus de place', unknown: 'Objet introuvable', stock: 'Pas assez en réserve', unidentified: 'Harmonisez l\'objet avant de le vendre' }[result.error], color: 'warning' })
    return
  }
  const earned = result.state.coins - character.value.coins
  character.value.coins = result.state.coins
  if (earned > 0) record({ kind: 'coins', amount: earned })
  character.value.inventory = result.state.inventory
  character.value.provisions = result.state.provisions
  toast.add({ title, color: 'success' })
}

function buy() {
  const entry = buyEntry.value
  if (!entry) return
  commit(knBuy(state(), entry, buyCount.value), `${buyCount.value > 1 ? `${buyCount.value} × ` : ''}${entry.name} acheté`)
}

function sell(id: string) {
  const name = character.value.inventory.find(item => item.id === id)?.name ?? 'Objet'
  commit(knSell(state(), id), `${name} vendu`)
}

function sellProvision(entry: KnCatalogItem) {
  commit(knSellProvision(state(), entry), `${entry.name} vendu`)
}
</script>
