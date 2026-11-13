import { useState } from 'react'
import { Link } from 'react-router'
import { filterAndSortPosts } from '../domain/posts.js'

function CarSketch() {
  return <svg className="car-sketch" viewBox="0 0 640 270" fill="none" aria-hidden="true">
    <path d="M32 188c14-4 34-8 57-11l50-10 58-58c17-18 42-29 68-31l136-10c34-3 70 8 98 28l71 51 37 13c12 4 20 15 20 28v20H27v-9c0-5 2-9 5-11Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="m157 163 53-51c15-15 34-24 55-25l130-9c24-2 47 3 67 15l71 52-376 18Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="m264 87-19 73M397 78l16 72M74 178l55-3M537 148l57 16M40 201h568" stroke="currentColor" strokeWidth="1.2" />
    <path d="M136 199a44 44 0 0 1 88 0m215 0a44 44 0 0 1 88 0" stroke="currentColor" strokeWidth="2" />
    <circle cx="180" cy="203" r="33" stroke="currentColor" strokeWidth="2" /><circle cx="483" cy="203" r="33" stroke="currentColor" strokeWidth="2" />
    <circle cx="180" cy="203" r="15" stroke="currentColor" /><circle cx="483" cy="203" r="15" stroke="currentColor" />
    <path d="M30 237h580M61 251h145M435 251h145" stroke="currentColor" strokeOpacity=".45" />
  </svg>
}

function dateLabel(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FeedPage({ posts }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const visible = filterAndSortPosts(posts, { query, sort })

  return <>
    <section className="hero-section">
      <div className="hero-grid page-container">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> THE CAR DESIGN COMMUNITY</span>
          <h1>Ideas in <em>motion.</em></h1>
          <p>From the first line of a sketch to the last millimeter of a surface, great cars start with a conversation. Share your thinking. Get a fresh perspective. Shape what comes next.</p>
          <Link className="button button-primary" to="/new">Start a discussion <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="hero-art"><div className="hero-art-grid" /><span className="art-index">FIG. 01&nbsp; / &nbsp;CONCEPT STUDY</span><CarSketch /><span className="art-caption">DESIGN IS A DIALOGUE <span>↗</span></span></div>
      </div>
    </section>

    <section className="feed-section page-container" aria-labelledby="feed-heading">
      <div className="section-topline"><span>THE FORUM</span><span>{posts.length.toString().padStart(2, '0')} TOTAL DISCUSSIONS</span></div>
      <div className="feed-heading-row"><div><h2 id="feed-heading">The drawing board<span className="heading-period">.</span></h2><p>Questions, ideas, and honest feedback from the studio floor.</p></div><Link className="feed-new-link" to="/new">Add your idea <span aria-hidden="true">↗</span></Link></div>
      <div className="feed-toolbar">
        <label className="search-field"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Search posts</span><input type="search" aria-label="Search posts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search post titles…" /></label>
        <label className="sort-field"><span>Sort by</span><select aria-label="Sort posts" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="popular">Most upvoted</option></select></label>
      </div>
      {visible.length ? <ol className="post-list" aria-label="Post feed">
        {visible.map((post) => <li className="post-list-item" key={post.id}><Link className="post-card" to={`/posts/${post.id}`} aria-label={post.title}>
          <time dateTime={post.created_at}>{dateLabel(post.created_at)}</time>
          <h3>{post.title}</h3>
          <span className="post-votes"><span aria-hidden="true">▲</span> {post.upvotes} {post.upvotes === 1 ? 'upvote' : 'upvotes'}</span>
          <span className="post-arrow" aria-hidden="true">↗</span>
        </Link></li>)}
      </ol> : <div className="empty-state"><span className="empty-glyph">⌕</span><h3>{query ? 'No matching discussions.' : 'The drawing board is yours.'}</h3><p>{query ? 'Try a different title search.' : 'Start the first conversation about car design.'}</p>{!query && <Link className="button button-primary" to="/new">Start a discussion ↗</Link>}</div>}
    </section>
    <section className="bottom-callout page-container"><span>01 / SKETCH</span><span>02 / DISCUSS</span><span>03 / REFINE</span><p>Better ideas are built together.</p></section>
  </>
}
