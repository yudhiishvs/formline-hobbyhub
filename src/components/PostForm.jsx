import { useState } from 'react'
import { Link } from 'react-router'

export default function PostForm({ post, onSave }) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [imageUrl, setImageUrl] = useState(post?.image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onSave({ title, body, image_url: imageUrl })
    } catch (cause) {
      setError(cause.message || 'Could not save your post.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="post-form" onSubmit={handleSubmit}>
    <div className="field-group">
      <label htmlFor="post-title">Post title <span className="required-mark" aria-hidden="true">*</span></label>
      <p className="field-hint">Lead with the design question or idea you want to explore.</p>
      <input id="post-title" name="title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. A better shape for the everyday EV" maxLength="120" required />
      <span className="field-counter">{title.length} / 120</span>
    </div>
    <div className="field-group">
      <label htmlFor="post-body">Your thoughts <span className="optional-mark" aria-hidden="true">OPTIONAL</span></label>
      <p className="field-hint">Add context, describe a sketch, or invite feedback.</p>
      <textarea id="post-body" name="body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell the community what you are working through…" rows="7" maxLength="5000" />
      <span className="field-counter">{body.length} / 5000</span>
    </div>
    <div className="field-group">
      <label htmlFor="post-image">Image URL <span className="optional-mark" aria-hidden="true">OPTIONAL</span></label>
      <p className="field-hint">Paste an external https:// image link to share a reference or concept.</p>
      <input id="post-image" name="image_url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/concept.jpg" maxLength="2048" />
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : post ? 'Save changes' : 'Publish post'} <span aria-hidden="true">↗</span></button>
      <Link className="button button-text" to={post ? `/posts/${post.id}` : '/'}>Cancel</Link>
    </div>
  </form>
}
