import { describe, expect, it } from 'vitest'
import { filterAndSortPosts, isAuthor, normalizeCommentInput, normalizePostInput } from './posts.js'

describe('post input', () => {
  it('requires a nonblank title', () => {
    expect(() => normalizePostInput({ title: '   ' })).toThrow(/title/i)
  })

  it('trims content and accepts optional fields', () => {
    expect(normalizePostInput({ title: '  Sketching tips  ', body: '  Keep the hood low  ' }))
      .toEqual({ title: 'Sketching tips', body: 'Keep the hood low', image_url: null })
  })

  it('rejects non-web image URLs', () => {
    expect(() => normalizePostInput({ title: 'Hi', image_url: 'javascript:alert(1)' })).toThrow(/image/i)
  })

  it('rejects an overlong title', () => {
    expect(() => normalizePostInput({ title: 'x'.repeat(121) })).toThrow(/120/)
  })
})

describe('comments', () => {
  it('requires content and trims it', () => {
    expect(normalizeCommentInput('  Great view!  ')).toBe('Great view!')
    expect(() => normalizeCommentInput('  ')).toThrow(/comment/i)
  })
})

describe('feed', () => {
  const rows = [
    { id: 'a', title: 'EV proportions', upvotes: 2, created_at: '2026-11-01T10:00:00Z' },
    { id: 'b', title: 'Headlight design', upvotes: 9, created_at: '2026-11-03T10:00:00Z' },
    { id: 'c', title: 'EV interior', upvotes: 9, created_at: '2026-11-02T10:00:00Z' },
  ]

  it('searches titles without case sensitivity and sorts newest first', () => {
    expect(filterAndSortPosts(rows, { query: 'eV', sort: 'newest' }).map((post) => post.id))
      .toEqual(['c', 'a'])
  })

  it('sorts most upvoted first and breaks ties by creation time', () => {
    expect(filterAndSortPosts(rows, { sort: 'popular' }).map((post) => post.id))
      .toEqual(['b', 'c', 'a'])
  })

  it('only treats a matching user id as the author', () => {
    expect(isAuthor({ user_id: 'me' }, 'me')).toBe(true)
    expect(isAuthor({ user_id: 'other' }, 'me')).toBe(false)
    expect(isAuthor({ user_id: null }, 'me')).toBe(false)
  })
})
