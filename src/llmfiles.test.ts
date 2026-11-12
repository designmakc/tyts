import { describe, expect, it } from 'vitest'
import { loadedModel, type LlmFiles } from './llmfiles'

describe('the model the server has loaded', () => {
  // Most accurate is on the disk and loaded; Accurate is not downloaded, and `target` throws for it.
  const files: Pick<LlmFiles, 'state' | 'target'> = {
    state: model => ({ status: model === 'most' ? 'ready' : 'absent', progress: 0, size: 0 }),
    target: model => {
      if (model !== 'most') throw new Error('Gemma 4 E4B is not downloaded yet')
      return { exe: 'llama-server', model: '/models/12b.gguf', allLayers: false }
    },
  }

  it('is found past a model that is not downloaded, without throwing', () => {
    expect(loadedModel(files, '/models/12b.gguf')).toBe('most')
    expect(loadedModel(files, '/models/other.gguf')).toBeUndefined()
    expect(loadedModel(files, undefined)).toBeUndefined()
  })
})
