import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App.jsx'
import { createDemoRepository } from './data/demoRepository.js'

let idCounter
function repository() {
  return createDemoRepository({
    storage: localStorage,
    now: () => '2026-11-13T12:00:00.000Z',
    newId: () => `browser-${++idCounter}`,
  })
}

beforeEach(() => {
  idCounter = 0
  window.history.replaceState({}, '', '/')
})

describe('Formline forum', () => {
  it('shows a title-only feed, searches titles, and sorts by votes', async () => {
    const store = repository()
    await store.initialize()
    await store.createPost({ title: 'Fresh interior sketch', body: 'Private feed body text' })
    render(<App repository={store} mode="demo" />)

    const feed = await screen.findByRole('list', { name: 'Post feed' })
    expect(within(feed).getAllByRole('listitem')[0].textContent).toContain('Fresh interior sketch')
    expect(within(feed).queryByText('Private feed body text')).toBeNull()
    expect(within(feed).queryByRole('img')).toBeNull()
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort posts' }), { target: { value: 'popular' } })
    expect(within(feed).getAllByRole('listitem')[0].textContent).toContain('EV concept design')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search posts' }), { target: { value: 'LIGHTING' } })
    expect(within(feed).getAllByRole('listitem')).toHaveLength(1)
    expect(within(feed).getByRole('link', { name: /lighting signatures/i })).toBeTruthy()
  })

  it('creates a post, shows detail content and image, accepts repeat votes and comments, then edits and deletes', async () => {
    render(<App repository={repository()} mode="demo" />)
    fireEvent.click(await screen.findByRole('link', { name: /start a discussion/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Post title' }), { target: { value: 'My electric coupe' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Your thoughts' }), { target: { value: 'Low hood, long wheelbase.' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Image URL' }), { target: { value: 'https://example.com/coupe.png' } })
    fireEvent.click(screen.getByRole('button', { name: /publish post/i }))

    expect(await screen.findByRole('heading', { name: 'My electric coupe' })).toBeTruthy()
    expect(screen.getByText('Low hood, long wheelbase.')).toBeTruthy()
    expect(screen.getByRole('img', { name: /my electric coupe/i }).getAttribute('src')).toBe('https://example.com/coupe.png')
    fireEvent.click(screen.getByRole('button', { name: /upvote post/i }))
    await screen.findByText('1 upvote')
    fireEvent.click(screen.getByRole('button', { name: /upvote post/i }))
    await screen.findByText('2 upvotes')
    fireEvent.change(screen.getByRole('textbox', { name: 'Add a comment' }), { target: { value: 'Clean surfacing!' } })
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }))
    expect(await screen.findByText('Clean surfacing!')).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: /edit post/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Post title' }), { target: { value: 'My updated coupe' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('heading', { name: 'My updated coupe' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /delete post/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, delete post/i }))
    expect(await screen.findByRole('heading', { name: /ideas in motion/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'My updated coupe' })).toBeNull()
  })

  it('hides author controls for another designer and handles a missing URL', async () => {
    window.history.replaceState({}, '', '/posts/sample-lighting')
    const view = render(<App repository={repository()} mode="demo" />)
    expect(await screen.findByRole('heading', { name: /lighting signatures/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /edit post/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /delete post/i })).toBeNull()
    view.unmount()

    window.history.replaceState({}, '', '/posts/missing')
    render(<App repository={repository()} mode="demo" />)
    expect(await screen.findByRole('heading', { name: /post not found/i })).toBeTruthy()
  })

  it('keeps a connection error visible and offers retry', async () => {
    const failing = { initialize: vi.fn().mockRejectedValue(new Error('Connection unavailable')) }
    render(<App repository={failing} mode="cloud" />)
    expect(await screen.findByText('Connection unavailable')).toBeTruthy()
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy()
    await waitFor(() => expect(failing.initialize).toHaveBeenCalledTimes(1))
  })
})
