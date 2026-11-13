import { describe, expect, it, vi } from 'vitest'
import { createSupabaseRepository } from './supabaseRepository.js'

function clientFixture({ session = { user: { id: 'designer-1' } }, response = { data: [], error: null } } = {}) {
  const builder = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
  }
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'designer-1' } }, error: null })),
    },
    from: vi.fn(() => builder),
    rpc: vi.fn(async () => ({ data: 1, error: null })),
  }
  return { client, builder }
}

describe('Supabase forum repository', () => {
  it('signs in anonymously once and lists a shared feed newest first', async () => {
    const rows = [{ id: 'post-1', title: 'Car sketch' }]
    const { client, builder } = clientFixture({ session: null, response: { data: rows, error: null } })
    const repository = createSupabaseRepository(client)

    expect(await repository.listPosts()).toEqual(rows)
    expect(await repository.initialize()).toBe('designer-1')
    expect(client.auth.signInAnonymously).toHaveBeenCalledTimes(1)
    expect(client.from).toHaveBeenCalledWith('posts')
    expect(builder.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false })
    expect(builder.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false })
    expect(builder.eq).not.toHaveBeenCalledWith('user_id', 'designer-1')
  })

  it('validates and scopes post writes to the author', async () => {
    const row = { id: 'post-1', user_id: 'designer-1', title: 'Coupe' }
    const { client, builder } = clientFixture({ response: { data: row, error: null } })
    const repository = createSupabaseRepository(client)

    expect(await repository.createPost({ title: '  Coupe  ', body: '  Low roof  ' })).toEqual(row)
    expect(builder.insert).toHaveBeenCalledWith({ title: 'Coupe', body: 'Low roof', image_url: null, user_id: 'designer-1' })
    expect(await repository.updatePost('post-1', { title: '  New coupe  ' })).toEqual(row)
    expect(builder.update).toHaveBeenCalledWith({ title: 'New coupe', body: '', image_url: null })
    expect(await repository.deletePost('post-1')).toBe(true)
    expect(builder.eq).toHaveBeenCalledWith('id', 'post-1')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'designer-1')
    await expect(repository.createPost({ title: '   ' })).rejects.toThrow(/title/i)
  })

  it('loads a post and its comments, and inserts a trimmed comment', async () => {
    const row = { id: 'post-1', title: 'Design idea' }
    const { client, builder } = clientFixture({ response: { data: [row], error: null } })
    builder.maybeSingle.mockResolvedValue({ data: row, error: null })
    builder.single.mockResolvedValue({ data: row, error: null })
    const repository = createSupabaseRepository(client)

    expect(await repository.getPost('post-1')).toEqual(row)
    expect(await repository.listComments('post-1')).toEqual([row])
    expect(await repository.addComment('post-1', '  Nice stance  ')).toEqual(row)
    expect(client.from).toHaveBeenCalledWith('comments')
    expect(builder.eq).toHaveBeenCalledWith('post_id', 'post-1')
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(builder.insert).toHaveBeenCalledWith({ post_id: 'post-1', user_id: 'designer-1', body: 'Nice stance' })
  })

  it('calls the atomic upvote RPC for every click', async () => {
    const { client } = clientFixture()
    client.rpc.mockResolvedValueOnce({ data: 4, error: null }).mockResolvedValueOnce({ data: 5, error: null })
    const repository = createSupabaseRepository(client)

    expect(await repository.upvotePost('post-1')).toBe(4)
    expect(await repository.upvotePost('post-1')).toBe(5)
    expect(client.rpc).toHaveBeenCalledTimes(2)
    expect(client.rpc).toHaveBeenCalledWith('upvote_post', { post_id: 'post-1' })
  })

  it('reports missing rows and service errors', async () => {
    const missing = clientFixture({ response: { data: null, error: null } })
    const missingRepository = createSupabaseRepository(missing.client)
    expect(await missingRepository.getPost('missing')).toBeNull()
    await expect(missingRepository.updatePost('missing', { title: 'New' })).rejects.toThrow(/not found/i)
    await expect(missingRepository.deletePost('missing')).rejects.toThrow(/not found/i)

    const broken = clientFixture({ response: { data: null, error: new Error('Database unavailable') } })
    await expect(createSupabaseRepository(broken.client).listPosts()).rejects.toThrow('Database unavailable')
    broken.client.rpc.mockResolvedValue({ data: null, error: new Error('Vote failed') })
    await expect(createSupabaseRepository(broken.client).upvotePost('post-1')).rejects.toThrow('Vote failed')
  })
})
