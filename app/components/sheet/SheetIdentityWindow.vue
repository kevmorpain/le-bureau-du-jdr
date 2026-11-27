<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.identity.title')"
    :description="$t('sheet.identity.autosave')"
    width="lg"
  >
    <p class="hint">
      {{ $t('sheet.identity.autosave') }}
    </p>

    <div class="head">
      <div class="portrait">
        <img
          v-if="portraitSrc && !hasPortraitLoadError"
          :src="portraitSrc"
          alt=""
          class="portrait__image"
          @error="hasPortraitLoadError = true"
        >
        <span v-else>{{ $t('sheet.identity.portrait') }}</span>
      </div>
      <div class="head__fields">
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.identity.name') }}</span>
          <DsTextField
            v-model="nameDraft"
            :label="$t('sheet.identity.name')"
            width="full"
          />
        </label>
        <label class="labelled">
          <span class="ds-label">{{ $t('sheet.identity.alignment') }}</span>
          <DsSelectField
            v-model="alignment"
            :options="alignmentOptions"
            :label="$t('sheet.identity.alignment')"
            :width="260"
          />
        </label>
        <div class="upload">
          <DsLinkButton
            plus
            :label="isUploading ? $t('sheet.identity.uploading') : $t('sheet.identity.upload')"
            :disabled="isUploading"
            @click="fileInput?.click()"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="upload__input"
            :aria-label="$t('sheet.identity.upload')"
            @change="handleFileChange"
          >
          <span class="hint">{{ $t('sheet.identity.or_url') }}</span>
          <DsTextField
            v-model="portraitUrl"
            :label="$t('sheet.identity.portrait_url')"
            placeholder="https://…"
            width="full"
            class="upload__url"
          />
        </div>
        <p
          v-if="uploadError"
          class="error"
          role="alert"
        >
          {{ $t('sheet.identity.upload_failed', { reason: uploadError }) }}
        </p>
      </div>
    </div>

    <DsGroupTitle :label="$t('sheet.identity.appearance')" />
    <div class="grid">
      <label
        v-for="field in appearanceInputs"
        :key="field.key"
        class="labelled"
      >
        <span class="ds-label">{{ $t(`sheet.identity.fields.${field.key}`) }}</span>
        <DsTextField
          v-model="field.model.value"
          :label="$t(`sheet.identity.fields.${field.key}`)"
          :placeholder="$t(`sheet.identity.placeholders.${field.key}`)"
          width="full"
        />
      </label>
    </div>

    <DsGroupTitle :label="$t('sheet.identity.personality')" />
    <div class="grid grid--two">
      <label
        v-for="field in personalityInputs"
        :key="field.key"
        class="labelled"
      >
        <span class="ds-label">{{ $t(`sheet.identity.fields.${field.key}`) }}</span>
        <DsTextArea
          v-model="field.model.value"
          :label="$t(`sheet.identity.fields.${field.key}`)"
          :rows="2"
        />
      </label>
    </div>

    <DsGroupTitle :label="$t('sheet.identity.story')" />
    <label class="labelled">
      <span class="ds-label">{{ $t('sheet.identity.fields.backstory') }}</span>
      <DsTextArea
        v-model="backstory"
        :label="$t('sheet.identity.fields.backstory')"
        :placeholder="$t('sheet.identity.placeholders.backstory')"
        :rows="4"
      />
    </label>
    <label class="labelled">
      <span class="ds-label">{{ $t('sheet.identity.fields.allies') }}</span>
      <DsTextArea
        v-model="allies"
        :label="$t('sheet.identity.fields.allies')"
        :placeholder="$t('sheet.identity.placeholders.allies')"
      />
    </label>

    <template #footer="{ close }">
      <DsButton
        :label="$t('sheet.identity.done')"
        @click="close"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { usePortraitUpload } from '~/composables/character/usePortraitUpload'
import { ALIGNMENTS, type AlignmentCode } from '~~/shared/rules/alignments'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const {
  name, age, height, weight, eyes, hair, skin, deity, backstory, allies, portraitUrl, portraitSrc, alignment,
  personalityTraits, ideals, bonds, flaws,
} = useCharacterSheet(characterSheet)
const { isUploading, error: uploadError, upload } = usePortraitUpload(characterSheet)

const alignmentOptions = ALIGNMENTS.map(({ code, name, short }) => ({ value: code as AlignmentCode, label: `${name} (${short})` }))

const appearanceInputs = [
  { key: 'age', model: age },
  { key: 'height', model: height },
  { key: 'weight', model: weight },
  { key: 'eyes', model: eyes },
  { key: 'hair', model: hair },
  { key: 'skin', model: skin },
  { key: 'deity', model: deity },
]

const personalityInputs = [
  { key: 'personality_traits', model: personalityTraits },
  { key: 'ideals', model: ideals },
  { key: 'bonds', model: bonds },
  { key: 'flaws', model: flaws },
]

// `name` refuses a blank value (the update schema requires one): a draft lets the field be cleared and retyped.
const nameDraft = ref(name.value)
watch(open, (isOpen) => {
  if (isOpen) nameDraft.value = name.value
})
watch(nameDraft, (value) => {
  name.value = value
})

const hasPortraitLoadError = ref(false)
watch(portraitSrc, () => {
  hasPortraitLoadError.value = false
})

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await upload(file)
  input.value = ''
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.head {
  display: flex;
  gap: 14px;
  align-items: stretch;
}

.portrait {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 120px;
  font-size: 11px;
  color: var(--color-ds-faint);
  background: var(--color-ds-panel-raised);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.portrait__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.head__fields {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.labelled {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.upload {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload__input { display: none; }

.upload__url { flex: 1; }

.error {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
</style>
