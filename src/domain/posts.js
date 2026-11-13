function trimmed(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizePostInput(input = {}) {
  const title = trimmed(input.title)
  const body = trimmed(input.body)
  const imageUrl = trimmed(input.image_url)

  if (!title) throw new Error('Post title is required.')
  if (title.length > 120) throw new Error('Post title must be 120 characters or fewer.')
  if (body.length > 5000) throw new Error('Post text must be 5000 characters or fewer.')
  if (imageUrl.length > 2048) throw new Error('Image URL must be 2048 characters or fewer.')
  if (imageUrl) {
    let url
    try { url = new URL(imageUrl) } catch { throw new Error('Image URL must be a full http or https URL.') }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Image URL must be a full http or https URL.')
    }
  }

  return { title, body, image_url: imageUrl || null }
}

export function normalizeCommentInput(value) {
  const body = trimmed(value)
  if (!body) throw new Error('Comment cannot be empty.')
  if (body.length > 1000) throw new Error('Comment must be 1000 characters or fewer.')
  return body
}

export function filterAndSortPosts(posts, { query = '', sort = 'newest' } = {}) {
  const needle = trimmed(query).toLocaleLowerCase()
  return posts
    .filter((post) => post.title.toLocaleLowerCase().includes(needle))
    .slice()
    .sort((a, b) => {
      if (sort === 'popular' && b.upvotes !== a.upvotes) return b.upvotes - a.upvotes
      const dateDifference = Date.parse(b.created_at) - Date.parse(a.created_at)
      return dateDifference || String(b.id).localeCompare(String(a.id))
    })
}

export function isAuthor(record, userId) {
  return Boolean(userId && record?.user_id === userId)
}
