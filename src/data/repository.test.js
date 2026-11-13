import { describe, expect, it, vi } from 'vitest'
import { createAppRepository, getRepositoryMode } from './repository.js'

describe('repository configuration', () => {
  it('uses browser demo mode only when both Supabase settings are absent', () => {
    expect(getRepositoryMode({})).toBe('demo')
    expect(getRepositoryMode({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toBe('demo')
  })

  it('rejects partial settings instead of silently switching to demo storage', () => {
    expect(() => getRepositoryMode({ VITE_SUPABASE_URL: 'https://example.supabase.co' })).toThrow(/both/i)
    expect(() => getRepositoryMode({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' })).toThrow(/both/i)
  })

  it('creates a cloud repository when both settings are set', async () => {
    const clientFactory = vi.fn(() => ({ auth: {} }))
    const env = {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    }
    const repository = createAppRepository({ env, clientFactory })
    expect(getRepositoryMode(env)).toBe('cloud')
    expect(clientFactory).toHaveBeenCalledWith(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    expect(repository.listPosts).toBeTypeOf('function')
  })
})
