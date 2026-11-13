import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useParams } from 'react-router'
import Shell from './components/Shell.jsx'
import { createAppRepository } from './data/repository.js'
import { isAuthor } from './domain/posts.js'
import FeedPage from './pages/FeedPage.jsx'
import FormPage from './pages/FormPage.jsx'
import PostPage from './pages/PostPage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function MissingPost({ forbidden = false }) {
  return <div className="page-container interior-page missing-page"><span className="eyebrow">404 / OFF THE DRAWING BOARD</span><h1>{forbidden ? 'This post is not yours to edit.' : 'Post not found.'}</h1><p>{forbidden ? 'Only the original author can make changes to this discussion.' : 'It may have been deleted, or the link may be incorrect.'}</p><Link className="button button-primary" to="/">Back to discussions <span aria-hidden="true">↗</span></Link></div>
}

function PostRoute({ posts, userId, repository, edit, onUpdate, onUpvote, onDelete }) {
  const { id } = useParams()
  const post = posts.find((item) => item.id === id)
  if (!post) return <MissingPost />
  if (edit) {
    if (!isAuthor(post, userId)) return <MissingPost forbidden />
    return <FormPage post={post} onSave={(input) => onUpdate(id, input)} />
  }
  return <PostPage post={post} userId={userId} repository={repository} onUpvote={onUpvote} onDelete={onDelete} />
}

export default function App({ repository, mode }) {
  const repositoryRef = useRef(repository ?? null)
  const [posts, setPosts] = useState([])
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const appMode = mode ?? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'cloud' : 'demo')

  const getRepository = useCallback(() => {
    if (!repositoryRef.current) repositoryRef.current = createAppRepository()
    return repositoryRef.current
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      const store = getRepository()
      const id = await store.initialize()
      const rows = await store.listPosts()
      setUserId(id)
      setPosts(rows)
      setStatus('ready')
    } catch (error) {
      setLoadError(error.message || 'Could not load discussions.')
      setStatus('error')
    }
  }, [getRepository])

  useEffect(() => { load() }, [load])

  async function createPost(input) {
    const row = await getRepository().createPost(input)
    setPosts((current) => [...current, row])
    return row
  }

  async function updatePost(id, input) {
    const row = await getRepository().updatePost(id, input)
    setPosts((current) => current.map((post) => post.id === id ? row : post))
    return row
  }

  async function deletePost(id) {
    await getRepository().deletePost(id)
    setPosts((current) => current.filter((post) => post.id !== id))
  }

  async function upvotePost(id) {
    const count = await getRepository().upvotePost(id)
    setPosts((current) => current.map((post) => post.id === id ? { ...post, upvotes: count } : post))
    return count
  }

  return <BrowserRouter><ScrollToTop /><Shell mode={appMode} postCount={posts.length}>
    {status === 'loading' ? <div className="loading-page" role="status"><span className="loading-wheel" aria-hidden="true" /><p>Opening the drawing board…</p></div>
      : status === 'error' ? <div className="page-container interior-page error-page"><span className="eyebrow">CONNECTION TROUBLE</span><h1>Could not load the forum.</h1><p>{loadError}</p><button className="button button-primary" type="button" onClick={load}>Try again <span aria-hidden="true">↻</span></button></div>
        : <Routes>
          <Route path="/" element={<FeedPage posts={posts} />} />
          <Route path="/new" element={<FormPage onSave={createPost} />} />
          <Route path="/posts/:id" element={<PostRoute posts={posts} userId={userId} repository={getRepository()} onUpvote={upvotePost} onDelete={deletePost} />} />
          <Route path="/posts/:id/edit" element={<PostRoute posts={posts} userId={userId} repository={getRepository()} edit onUpdate={updatePost} />} />
          <Route path="*" element={<MissingPost />} />
        </Routes>}
  </Shell></BrowserRouter>
}
