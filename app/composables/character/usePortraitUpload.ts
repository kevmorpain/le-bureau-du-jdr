import { sheetTextField } from './sheetField'

// The server writes `portraitUrl` and deletes the previous object; a file upload needs the network, it never goes through the offline queue.
export const usePortraitUpload = (characterSheet: Ref<CharacterSheet>) => {
  const { t } = useI18n()
  const portraitUrl = sheetTextField(characterSheet, 'portraitUrl')
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  const upload = async (file: File): Promise<boolean> => {
    isUploading.value = true
    error.value = null
    try {
      const image = await resizeImageForUpload(file)
      const form = new FormData()
      form.append('file', image, file.name)
      const { portraitUrl: uploaded } = await $fetch<{ portraitUrl: string }>(
        `/api/character_sheets/${characterSheet.value.id}/portrait`,
        { method: 'POST', body: form },
      )
      portraitUrl.value = uploaded
      return true
    } catch (e: unknown) {
      error.value = (e as { statusMessage?: string })?.statusMessage
        ?? (e as { data?: { statusMessage?: string } })?.data?.statusMessage
        ?? t('sheet.identity.upload_retry')
      return false
    } finally {
      isUploading.value = false
    }
  }

  return { isUploading, error, upload }
}
