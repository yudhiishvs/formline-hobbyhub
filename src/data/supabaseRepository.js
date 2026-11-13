import { normalizeCommentInput, normalizePostInput } from '../domain/posts.js'

function dataOrThrow(result) {
  if (result.error) throw result.error
  return result.data
}

export function createSupabaseRepository(client) {
  let sessionPromise

  async function initialize() {
    if (!sessionPromise) {
      sessionPromise = (async () => {
        const { data: existing, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (existing?.session?.user?.id) return existing.session.user.id

        const { data: signedIn, error: signInError } = await client.auth.signInAnonymously()
        if (signInError) throw signInError
        const id = signedIn?.user?.id ?? signedIn?.session?.user?.id
        if (!id) throw new Error('Anonymous sign-in did not return a user.')
        return id
      })()
    }
    try { return await sessionPromise } catch (error) {
      sessionPromise = undefined
      throw error
    }
  }

  return {
    initialize,
    async listPosts() {
      await initialize()
      const result = await client.from('posts').select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      return dataOrThrow(result) ?? []
    },
    async getPost(id) {
      await initialize()
      const result = await client.from('posts').select('*').eq('id', id).maybeSingle()
      return dataOrThrow(result) ?? null
    },
    async createPost(input) {
      const value = normalizePostInput(input)
      const userId = await initialize()
      const result = await client.from('posts').insert({ ...value, user_id: userId }).select('*').single()
      return dataOrThrow(result)
    },
    async updatePost(id, input) {
      const value = normalizePostInput(input)
      const userId = await initialize()
      const result = await client.from('posts').update(value)
        .eq('id', id).eq('user_id', userId).select('*').maybeSingle()
      const row = dataOrThrow(result)
      if (!row) throw new Error('Post not found or you are not its author.')
      return row
    },
    async deletePost(id) {
      const userId = await initialize()
      const result = await client.from('posts').delete()
        .eq('id', id).eq('user_id', userId).select('id').maybeSingle()
      if (!dataOrThrow(result)) throw new Error('Post not found or you are not its author.')
      return true
    },
    async upvotePost(id) {
      await initialize()
      const count = dataOrThrow(await client.rpc('upvote_post', { post_id: id }))
      if (count === null) throw new Error('Post not found.')
      return count
    },
    async listComments(postId) {
      await initialize()
      const result = await client.from('comments').select('*').eq('post_id', postId)
        .order('created_at', { ascending: true }).order('id', { ascending: true })
      return dataOrThrow(result) ?? []
    },
    async addComment(postId, body) {
      const content = normalizeCommentInput(body)
      const userId = await initialize()
      const result = await client.from('comments')
        .insert({ post_id: postId, user_id: userId, body: content })
        .select('*').single()
      return dataOrThrow(result)
    },
  }
}
