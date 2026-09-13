/**
 * Réduit une image avant envoi (portraits). Les portraits s'affichent à 36 px dans
 * l'en-tête et 64 px dans l'aperçu : envoyer la photo brute d'un téléphone (plusieurs Mo)
 * ne servirait qu'à remplir le bucket et à se heurter à la limite de l'endpoint.
 *
 * Convertit en WebP, borne le plus grand côté à `maxDimension`, et **retombe sur le
 * fichier d'origine** si le navigateur ne sait pas faire (l'endpoint accepte de toute
 * façon png/jpeg/webp et refusera lui-même ce qui est trop gros).
 */
export const PORTRAIT_MAX_DIMENSION = 512

export async function resizeImageForUpload(
  file: File,
  maxDimension: number = PORTRAIT_MAX_DIMENSION,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const largestSide = Math.max(bitmap.width, bitmap.height)

    // Déjà assez petite : inutile de la ré-encoder (on éviterait juste de la dégrader).
    if (largestSide <= maxDimension) {
      bitmap.close()
      return file
    }

    const scale = maxDimension / largestSide
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const resized = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    )
    return resized ?? file
  } catch {
    return file
  }
}
