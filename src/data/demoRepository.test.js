import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoRepository } from './demoRepository.js'

let nextId
const makeRepository = () => createDemoRepository({
  storage: localStorage,
  now: () => '2026-11-13T12:00:00.000Z',
  newId: () => `id-${++nextId}`,
})

beforeEach(() => { nextId = 0 })

describe('browser demo repository', () => {
  it('seeds car design discussions once and keeps a stable browser author', async () => {
    const first = makeRepository()
    const userId = await first.initialize()
    const posts = await first.listPosts()
    expect(posts).toHaveLength(3)
    expect(posts.every((post) => /design|car|EV|lighting|shape|sketch/i.test(post.title))).toBe(true)
    const second = makeRepository()
    expect(await second.initialize()).toBe(userId)
    expect(await second.listPosts()).toHaveLength(3)
  })

  it('persists a new post, repeat upvotes, and comments across instances', async () => {
    const repository = makeRepository()
    const userId = await repository.initialize()
    const created = await repository.createPost({ title: '  My coupe sketch  ', body: '  Low roof  ' })
    expect(created).toMatchObject({ title: 'My coupe sketch', body: 'Low roof', user_id: userId, upvotes: 0 })
    expect(await repository.upvotePost(created.id)).toBe(1)
    expect(await repository.upvotePost(created.id)).toBe(2)
    const comment = await repository.addComment(created.id, '  Strong stance  ')
    expect(comment).toMatchObject({ post_id: created.id, body: 'Strong stance', user_id: userId })
    const reopened = makeRepository()
    expect((await reopened.getPost(created.id)).upvotes).toBe(2)
    expect(await reopened.listComments(created.id)).toHaveLength(1)
  })

  it('lets the author edit and delete a post, but rejects changes to sample posts', async () => {
    const repository = makeRepository()
    await repository.initialize()
    const sample = (await repository.listPosts())[0]
    await expect(repository.updatePost(sample.id, { title: 'Changed' })).rejects.toThrow(/author/i)
    await expect(repository.deletePost(sample.id)).rejects.toThrow(/author/i)
    const own = await repository.createPost({ title: 'Before' })
    expect((await repository.updatePost(own.id, { title: 'After' })).title).toBe('After')
    expect(await repository.deletePost(own.id)).toBe(true)
    expect(await repository.getPost(own.id)).toBeNull()
  })

  it('recovers from malformed browser storage', async () => {
    localStorage.setItem('formline.posts.v1', '{broken')
    localStorage.setItem('formline.comments.v1', '{}')
    const repository = makeRepository()
    await repository.initialize()
    expect(await repository.listPosts()).toHaveLength(3)
    expect(await repository.listComments('missing')).toEqual([])
  })

  it('rejects actions for a missing post or empty comment', async () => {
    const repository = makeRepository()
    await repository.initialize()
    await expect(repository.upvotePost('missing')).rejects.toThrow(/not found/i)
    await expect(repository.addComment('missing', 'Hello')).rejects.toThrow(/not found/i)
    const sample = (await repository.listPosts())[0]
    await expect(repository.addComment(sample.id, '   ')).rejects.toThrow(/comment/i)
  })
})
