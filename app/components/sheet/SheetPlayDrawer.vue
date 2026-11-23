<template>
  <DsFrame
    as="aside"
    :padded="false"
    class="drawer"
    :class="`drawer--${card.kind}`"
    :aria-label="card.name"
  >
    <div class="drawer__band">
      <DsCornerButton
        :label="$t('ds.close')"
        class="drawer__close"
        @click="emit('close')"
      />
    </div>

    <div class="drawer__body">
      <p class="drawer__kicker">
        <span class="drawer__type">{{ detail.typeLabel }}</span>
        <DsBadge
          v-for="badge in detail.badges"
          :key="badge"
          :label="badge"
        />
        <span v-if="detail.subtitle">{{ detail.subtitle }}</span>
      </p>
      <h2 class="drawer__name">
        {{ card.name }}
      </h2>

      <dl
        v-if="detail.tiles.length"
        class="drawer__tiles"
      >
        <div
          v-for="tile in detail.tiles"
          :key="tile.label"
          class="drawer__tile"
        >
          <dt class="ds-label">
            {{ tile.label }}
          </dt>
          <dd
            class="drawer__tile-value"
            :style="tile.damageType ? { color: `var(--color-${tile.damageType})` } : undefined"
          >
            <DsCostTag
              v-if="tile.cost"
              :cost="tile.cost"
            />
            {{ tile.value }}
          </dd>
        </div>
      </dl>

      <p
        v-if="detail.components"
        class="drawer__components"
      >
        <abbr
          v-for="component in COMPONENTS"
          :key="component"
          class="drawer__component"
          :class="{ 'drawer__component--off': !detail.components[component] }"
          :title="$t(`sheet.play.components.${component}`)"
        >{{ $t(`sheet.play.components.${component}_letter`) }}</abbr>
        <span
          v-if="detail.components.materialText"
          class="drawer__material"
        >{{ detail.components.materialText }}</span>
      </p>

      <p
        v-if="detail.properties.length"
        class="drawer__properties"
      >
        {{ detail.properties.join(' · ') }}
      </p>

      <div
        v-if="card.uses"
        class="drawer__uses"
      >
        <DsGroupTitle :label="$t(`sheet.play.resources.${card.resource}`)" />
        <DsCounter
          :model-value="card.uses.remaining"
          :max="card.uses.max"
          :aria-label="detail.usesLabel ?? undefined"
          :readonly="card.resource === 'arcanum'"
          @update:model-value="emit('set-remaining', $event)"
        />
        <span class="drawer__uses-label">{{ detail.usesLabel }}</span>
      </div>

      <LightMarkdown
        v-if="detail.description"
        :source="detail.description"
        class="drawer__description"
      />

      <div
        v-if="detail.slotOptions.length"
        class="drawer__slots"
      >
        <DsGroupTitle :label="$t('sheet.play.cast_at_level')" />
        <div
          role="radiogroup"
          :aria-label="$t('sheet.play.cast_at_level')"
          class="drawer__slot-list"
        >
          <button
            v-for="slot in detail.slotOptions"
            :key="slot.key"
            type="button"
            role="radio"
            :aria-checked="slot.key === selectedSlotKey"
            :disabled="slot.current === 0"
            class="ds-bevel ds-shape-corner drawer__slot"
            :class="{ 'drawer__slot--on': slot.key === selectedSlotKey }"
            @click="selectedSlotKey = slot.key"
          >
            <span class="ds-fill drawer__slot-fill">
              <span class="drawer__slot-name">{{ slot.label }}</span>
              <span class="drawer__slot-effect">{{ slot.effect }}</span>
              <DsCounter
                :model-value="slot.current"
                :max="slot.max"
                :aria-label="$t('ds.count_of', { value: slot.current, max: slot.max })"
                readonly
              />
            </span>
          </button>
        </div>
      </div>

      <p
        v-if="warning"
        class="drawer__warning"
        role="note"
      >
        {{ warning }}
      </p>

      <div
        v-if="actions.length"
        class="drawer__actions"
      >
        <DsButton
          v-for="action in actions"
          :key="action.key"
          :label="action.label"
          :detail="action.detail"
          :variant="action.variant"
          :disabled="action.isDisabled"
          block
          @click="emit('action', action.key)"
        />
      </div>
    </div>
  </DsFrame>
</template>

<script lang="ts" setup>
import type { PlayAction, PlayActionKey, PlayDetail } from '~/composables/character/usePlayCardDetails'
import type { PlayCard } from '~/utils/playCards'

const { card, detail, actions, warning = null } = defineProps<{
  card: PlayCard
  detail: PlayDetail
  actions: PlayAction[]
  warning?: string | null
}>()

const emit = defineEmits<{
  'close': []
  'action': [key: PlayActionKey]
  'set-remaining': [remaining: number]
}>()

const selectedSlotKey = defineModel<string | null>('selectedSlotKey', { default: null })

const COMPONENTS = ['verbal', 'somatic', 'material'] as const
</script>

<style scoped>
.drawer {
  display: flex;
  flex-direction: column;
  width: 360px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: calc(100dvh - 24px);
}

.drawer :deep(.frame__fill) {
  display: flex;
  height: 100%;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.drawer--spell { --drawer-color: var(--color-ds-spell); }
.drawer--feature { --drawer-color: var(--color-ds-feature); }
.drawer--weapon { --drawer-color: var(--color-ds-weapon); }
.drawer--item { --drawer-color: var(--color-ds-item); }

.drawer__band {
  position: relative;
  flex-shrink: 0;
  height: 56px;
  background:
    radial-gradient(ellipse at 50% 130%, color-mix(in srgb, var(--drawer-color) 32%, transparent), transparent 70%),
    var(--color-ds-panel-raised);
  border-bottom: 1px solid var(--color-ds-gold-dim);
}

.drawer__close {
  position: absolute;
  top: 10px;
  right: 12px;
}

.drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 14px 16px 16px;
  overflow-y: auto;
}

.drawer__kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--color-ds-mute);
}

.drawer__type {
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--drawer-color);
}

.drawer__name {
  margin-top: -4px;
  font-family: var(--font-bodoni);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.12;
}

.drawer__tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.drawer__tile {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 9px;
  background: var(--color-ds-panel-raised);
}

.drawer__tile-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.drawer__components {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.drawer__component {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-ds-ink);
  background: var(--color-ds-panel-raised);
}

.drawer__component--off {
  color: var(--color-ds-faint);
  text-decoration: line-through;
}

.drawer__material,
.drawer__properties,
.drawer__uses-label {
  font-size: 11.5px;
  color: var(--color-ds-mute);
}

.drawer__material {
  font-style: italic;
}

.drawer__uses {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer__description {
  font-size: 12.5px;
  line-height: 1.55;
}

.drawer__slots,
.drawer__slot-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer__slot {
  --ds-cut: var(--ds-cut-control);
  --ds-edge-color: var(--color-ds-line);
  width: 100%;
  text-align: left;
}

.drawer__slot--on {
  --ds-edge-color: var(--color-ds-gold);
  --ds-fill: var(--color-ds-panel-raised);
}

.drawer__slot:disabled {
  opacity: 0.5;
}

.drawer__slot-fill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  font-size: 12.5px;
}

.drawer__slot-name {
  font-weight: 700;
  white-space: nowrap;
}

.drawer__slot-effect {
  flex: 1;
  color: var(--color-ds-mute);
}

.drawer__warning {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.drawer__actions {
  display: flex;
  margin-top: auto;
  flex-direction: column;
  gap: 8px;
}
</style>
