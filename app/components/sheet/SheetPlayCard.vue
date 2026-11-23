<template>
  <DsCard
    as="button"
    :selected="isSelected"
    class="play-card"
    :class="[`play-card--${card.kind}`, { 'play-card--spent': !card.isAvailable }]"
  >
    <span class="play-card__top">
      <DsCostTag
        v-if="costTag"
        :cost="costTag"
      />
      <DsIcon
        :name="PLAY_CARD_ICONS[card.kind]"
        :size="13"
      />
      <span>{{ $t(`sheet.play.kinds.${card.kind}`) }}</span>
      <span
        v-if="card.spellLevel !== null"
        class="play-card__level"
      >{{ card.spellLevel === 0 ? $t('sheet.play.cantrip') : $t('sheet.play.spell_level', { level: card.spellLevel }) }}</span>
    </span>

    <span class="play-card__name">{{ card.name }}</span>

    <span
      v-if="facts.length"
      class="play-card__facts"
    >
      <span
        v-for="fact in facts"
        :key="`${fact.icon}-${fact.text}`"
        class="play-card__fact"
        :class="{ 'play-card__fact--damage': fact.damageType }"
        :style="fact.damageType ? { color: `var(--color-${fact.damageType})` } : undefined"
      >
        <DsIcon
          v-if="FACT_ICONS[fact.icon]"
          :name="FACT_ICONS[fact.icon]!"
          :size="12"
        />
        {{ fact.text }}
      </span>
    </span>

    <DsCounter
      v-if="card.uses"
      :model-value="card.uses.remaining"
      :max="card.uses.max"
      :aria-label="$t('ds.count_of', { value: card.uses.remaining, max: card.uses.max })"
      readonly
      class="play-card__uses"
    />
  </DsCard>
</template>

<script lang="ts" setup>
import type { DsCost } from '~/components/ds/DsCostTag.vue'
import type { DsIconName } from '~/components/ds/DsIcon.vue'
import type { PlayFact, PlayFactIcon } from '~/composables/character/usePlayCardDetails'
import { PLAY_CARD_ICONS, type PlayCard } from '~/utils/playCards'

const { card, facts, isSelected = false } = defineProps<{
  card: PlayCard
  facts: PlayFact[]
  isSelected?: boolean
}>()

const FACT_ICONS: Partial<Record<PlayFactIcon, DsIconName>> = {
  range: 'range',
  attack: 'attack',
  save: 'save',
  concentration: 'concentration',
  ritual: 'ritual',
}

const costTag = computed<DsCost | null>(() => (card.cost === 'other' ? null : card.cost))
</script>

<style scoped>
.play-card {
  min-width: 0;
}

.play-card--spent {
  opacity: 0.55;
}

.play-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.play-card--spell .play-card__top { color: var(--color-ds-spell); }
.play-card--feature .play-card__top { color: var(--color-ds-feature); }
.play-card--weapon .play-card__top { color: var(--color-ds-weapon); }
.play-card--item .play-card__top { color: var(--color-ds-item); }

.play-card__level {
  margin-left: auto;
  color: var(--color-ds-mute);
}

.play-card__name {
  font-family: var(--font-bodoni);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--color-ds-ink);
}

.play-card__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: var(--color-ds-mute);
}

.play-card__fact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.play-card__fact--damage {
  font-weight: 700;
}

.play-card__uses {
  margin-top: 2px;
}
</style>
