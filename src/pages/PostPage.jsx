import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { isAuthor } from '../domain/posts.js'

function dateLabel(value) {
  return new Date(value).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PostPage({ post, userId, repository, onUpvote, onDelete }) {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentStatus, setCommentStatus] = useState('loading')
  const [error, setError] = useState('')
  const [voting, setVoting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setCommentStatus('loading')
    repository.listComments(post.id).then((rows) => {
      if (active) { setComments(rows); setCommentStatus('ready') }
    }).catch((cause) => {
      if (active) { setError(cause.message || 'Could not load comments.'); setCommentStatus('error') }
    })
    return () => { active = false }
  }, [post.id, repository])

  async function vote() {
    if (voting) return
    setVoting(true)
    setError('')
    try { await onUpvote(post.id) } catch (cause) { setError(cause.message || 'Could not upvote this post.') }
    finally { setVoting(false) }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const row = await repository.addComment(post.id, commentText)
      setComments((current) => [...current, row])
      setCommentText('')
    } catch (cause) { setError(cause.message || 'Could not post your comment.') }
    finally { setSubmitting(false) }
  }

  async function remove() {
    if (deleting) return
    setDeleting(true)
    setError('')
    try { await onDelete(post.id); navigate('/') }
    catch (cause) { setError(cause.message || 'Could not delete this post.'); setDeleting(false) }
  }

  return <div className="page-container interior-page post-detail-page">
    <div className="page-kicker"><span>FORMLINE / DISCUSSION</span><Link to="/">← All discussions</Link></div>
    <article className="detail-grid">
      <div className="detail-main">
        <span className="eyebrow">DESIGN DISCUSSION <span className="detail-line" /></span>
        <h1>{post.title}</h1>
        <div className="detail-meta"><time dateTime={post.created_at}>{dateLabel(post.created_at)}</time><span>·</span><span>{isAuthor(post, userId) ? 'Posted by you' : 'Community post'}</span></div>
        {post.body && <p className="post-body">{post.body}</p>}
        {post.image_url && <figure className="post-image"><img src={post.image_url} alt={`Concept shared with ${post.title}`} loading="lazy" /><figcaption>SHARED DESIGN REFERENCE</figcaption></figure>}
        <div className="detail-action-bar"><button className="vote-button" type="button" onClick={vote} disabled={voting} aria-label="Upvote post"><span aria-hidden="true">▲</span> Upvote</button><strong>{post.upvotes} {post.upvotes === 1 ? 'upvote' : 'upvotes'}</strong><span className="action-spacer" />{isAuthor(post, userId) && <><Link className="text-action" to={`/posts/${post.id}/edit`}>Edit post ↗</Link><button className="text-action danger-action" type="button" onClick={() => setConfirming(true)}>Delete post</button></>}</div>
        {confirming && <div className="delete-confirm" role="alertdialog" aria-label="Confirm deletion"><strong>Delete this discussion?</strong><p>This removes the post and its comments.</p><div><button className="button button-danger" type="button" onClick={remove} disabled={deleting}>Yes, delete post</button><button className="button button-text" type="button" onClick={() => setConfirming(false)}>Cancel</button></div></div>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <section className="comments-section" aria-labelledby="comments-heading"><div className="comments-heading"><span className="eyebrow">THE CONVERSATION</span><h2 id="comments-heading">Comments <span>{comments.length.toString().padStart(2, '0')}</span></h2></div>
          {commentStatus === 'loading' ? <p className="comments-status" role="status">Loading comments…</p> : commentStatus === 'error' ? <p className="comments-status">Comments could not be loaded.</p> : comments.length ? <ol className="comments-list">{comments.map((comment) => <li key={comment.id}><div className="comment-meta"><span className="comment-avatar" aria-hidden="true">{isAuthor(comment, userId) ? 'Y' : 'D'}</span><strong>{isAuthor(comment, userId) ? 'You' : 'Designer'}</strong><time dateTime={comment.created_at}>{dateLabel(comment.created_at)}</time></div><p>{comment.body}</p></li>)}</ol> : <p className="no-comments">No comments yet. Start the conversation.</p>}
          <form className="comment-form" onSubmit={submitComment}><label htmlFor="comment-input">Add a comment</label><textarea id="comment-input" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="What do you think about this design idea?" maxLength="1000" rows="4" required /><div><span>Keep it constructive and curious.</span><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post comment'} <span aria-hidden="true">↗</span></button></div></form>
        </section>
      </div>
      <aside className="detail-aside"><span className="aside-number">01 / DISCUSSION</span><div className="aside-art" aria-hidden="true"><span>FORM<br />FOLLOWS<br /><em>FEELING.</em></span><div className="aside-arc" /></div><p>Every line is a decision. Every perspective makes it sharper.</p><Link to="/new">Have your own idea? <span aria-hidden="true">↗</span></Link></aside>
    </article>
  </div>
}
