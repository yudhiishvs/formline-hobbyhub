import { createClient } from '@supabase/supabase-js'
import { createDemoRepository } from './demoRepository.js'
import { createSupabaseRepository } from './supabaseRepository.js'

export function getRepositoryMode(env = import.meta.env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url && !key) return 'demo'
  if (!url || !key) {
    throw new Error('Supabase configuration is incomplete. Set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
  return 'cloud'
}

export function createAppRepository({ env = import.meta.env, clientFactory = createClient } = {}) {
  if (getRepositoryMode(env) === 'demo') return createDemoRepository()
  try {
    return createSupabaseRepository(clientFactory(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY))
  } catch (error) {
    throw new Error(`Supabase configuration is invalid: ${error.message}`)
  }
}
