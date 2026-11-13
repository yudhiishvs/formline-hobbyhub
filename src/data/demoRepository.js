import { isAuthor, normalizeCommentInput, normalizePostInput } from '../domain/posts.js'

const POSTS_KEY = 'formline.posts.v1'
const COMMENTS_KEY = 'formline.comments.v1'
const USER_KEY = 'formline.user.v1'

function samplePosts(timestamp) {
  const base = Date.parse(timestamp)
  const samples = [
    {
      id: 'sample-proportions',
      title: 'EV concept design: where should the cabin begin?',
      body: 'I am sketching a compact electric coupe and debating the dash-to-axle ratio. A short hood is honest to the platform, but the silhouette starts to feel like a pod. What proportions make an EV feel dynamic to you?',
      upvotes: 24,
      hoursAgo: 2,
    },
    {
      id: 'sample-lighting',
      title: 'Lighting signatures that still look good in daylight',
      body: 'A light bar is easy to recognize at night. How do you carry that same identity through the surface and graphics when the lights are off?',
      upvotes: 17,
      hoursAgo: 6,
    },
    {
      id: 'sample-shape',
      title: 'Car shape study: a fastback with real rear headroom',
      body: 'Trying to balance a clean roof arc with a usable second row. I would love examples of clever roof, glass, or seat packaging solutions.',
      upvotes: 9,
      hoursAgo: 28,
    },
  ]
  return samples.map(({ hoursAgo, ...sample }) => ({
    ...sample,
    user_id: 'formline-studio',
    image_url: null,
    created_at: new Date(base - hoursAgo * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(base - hoursAgo * 60 * 60 * 1000).toISOString(),
  }))
}

function readRows(storage, key, fallback) {
  const raw = storage.getItem(key)
  if (raw === null) {
    storage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((row) => row && typeof row.id === 'string')) return parsed
  } catch { /* Reset malformed browser data below. */ }
  storage.setItem(key, JSON.stringify(fallback))
  return fallback
}

export function createDemoRepository({
  storage = globalThis.localStorage,
  now = () => new Date().toISOString(),
  newId = () => globalThis.crypto.randomUUID(),
} = {}) {
  const readPosts = () => readRows(storage, POSTS_KEY, samplePosts(now()))
  const readComments = () => readRows(storage, COMMENTS_KEY, [])
  const savePosts = (rows) => storage.setItem(POSTS_KEY, JSON.stringify(rows))
  const saveComments = (rows) => storage.setItem(COMMENTS_KEY, JSON.stringify(rows))

  async function initialize() {
    let userId = storage.getItem(USER_KEY)
    if (!userId) {
      userId = newId()
      storage.setItem(USER_KEY, userId)
    }
    readPosts()
    readComments()
    return userId
  }

  async function getPost(id) {
    return readPosts().find((post) => post.id === id) ?? null
  }

  return {
    initialize,
    async listPosts() { return readPosts() },
    getPost,
    async createPost(input) {
      const value = normalizePostInput(input)
      const userId = await initialize()
      const timestamp = now()
      const row = {
        id: newId(), user_id: userId, ...value,
        upvotes: 0, created_at: timestamp, updated_at: timestamp,
      }
      savePosts([...readPosts(), row])
      return row
    },
    async updatePost(id, input) {
      const userId = await initialize()
      const posts = readPosts()
      const old = posts.find((post) => post.id === id)
      if (!old) throw new Error('Post not found.')
      if (!isAuthor(old, userId)) throw new Error('Only the author can edit this post.')
      const row = { ...old, ...normalizePostInput(input), updated_at: now() }
      savePosts(posts.map((post) => post.id === id ? row : post))
      return row
    },
    async deletePost(id) {
      const userId = await initialize()
      const posts = readPosts()
      const old = posts.find((post) => post.id === id)
      if (!old) throw new Error('Post not found.')
      if (!isAuthor(old, userId)) throw new Error('Only the author can delete this post.')
      savePosts(posts.filter((post) => post.id !== id))
      saveComments(readComments().filter((comment) => comment.post_id !== id))
      return true
    },
    async upvotePost(id) {
      const posts = readPosts()
      const old = posts.find((post) => post.id === id)
      if (!old) throw new Error('Post not found.')
      const count = old.upvotes + 1
      savePosts(posts.map((post) => post.id === id ? { ...post, upvotes: count } : post))
      return count
    },
    async listComments(postId) {
      return readComments().filter((comment) => comment.post_id === postId)
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    },
    async addComment(postId, body) {
      const content = normalizeCommentInput(body)
      const post = await getPost(postId)
      if (!post) throw new Error('Post not found.')
      const userId = await initialize()
      const row = { id: newId(), post_id: postId, user_id: userId, body: content, created_at: now() }
      saveComments([...readComments(), row])
      return row
    },
  }
}
