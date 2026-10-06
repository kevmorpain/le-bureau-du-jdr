import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoSave } from '../../app/composables/useAutoSave'

const options = { delay: 2000, maxWait: 10_000 }

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoSave — debounce', () => {
  it('ne sauvegarde qu\'une fois la saisie interrompue pendant le délai', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { schedule } = useAutoSave(save, options)

    schedule()
    await vi.advanceTimersByTimeAsync(1500)
    schedule()
    await vi.advanceTimersByTimeAsync(1500)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('sauvegarde au plus tard après maxWait, même en saisie continue', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { schedule } = useAutoSave(save, options)

    for (let i = 0; i < 12; i++) {
      schedule()
      await vi.advanceTimersByTimeAsync(1000)
    }
    expect(save).toHaveBeenCalledTimes(1)
  })
})

describe('useAutoSave — statut', () => {
  it('passe de saving à saved, puis retombe à idle', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { status, schedule } = useAutoSave(save, options)
    expect(status.value).toBe('idle')

    schedule()
    expect(status.value).toBe('saving')
    await vi.advanceTimersByTimeAsync(2000)
    expect(status.value).toBe('saved')
    await vi.advanceTimersByTimeAsync(3000)
    expect(status.value).toBe('idle')
  })

  it('reste en erreur tant qu\'aucune modification ne relance la sauvegarde', async () => {
    const onError = vi.fn()
    const save = vi.fn().mockRejectedValue(new Error('400'))
    const { status, schedule } = useAutoSave(save, { ...options, onError })

    schedule()
    await vi.advanceTimersByTimeAsync(2000)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(status.value).toBe('error')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(status.value).toBe('error')

    schedule()
    expect(status.value).toBe('saving')
  })
})

describe('useAutoSave — un seul save en vol', () => {
  it('une modif pendant un PUT en cours en déclenche un second après coup, sans chevauchement', async () => {
    let release!: () => void
    const save = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve }))
      .mockResolvedValue(undefined)
    const { status, schedule } = useAutoSave(save, options)

    schedule()
    await vi.advanceTimersByTimeAsync(2000)
    expect(save).toHaveBeenCalledTimes(1)

    schedule()
    await vi.advanceTimersByTimeAsync(5000)
    expect(save).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(0)
    expect(status.value).toBe('saving')
    await vi.advanceTimersByTimeAsync(2000)
    expect(save).toHaveBeenCalledTimes(2)
    expect(status.value).toBe('saved')
  })
})

describe('useAutoSave — flush', () => {
  it('envoie immédiatement une sauvegarde en attente', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { schedule, flush } = useAutoSave(save, options)

    schedule()
    await flush()
    expect(save).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('ne fait rien quand rien n\'est en attente', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    await useAutoSave(save, options).flush()
    expect(save).not.toHaveBeenCalled()
  })
})
