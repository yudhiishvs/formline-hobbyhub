import { useNavigate } from 'react-router'
import PostForm from '../components/PostForm.jsx'

export default function FormPage({ post, onSave }) {
  const navigate = useNavigate()
  async function save(input) {
    const result = await onSave(input)
    navigate(`/posts/${result.id}`)
  }

  return <div className="page-container interior-page">
    <div className="page-kicker"><span>FORMLINE / {post ? 'EDIT DISCUSSION' : 'NEW DISCUSSION'}</span><span>DESIGN IDEAS BEGIN HERE</span></div>
    <div className="form-layout">
      <div className="form-intro"><span className="eyebrow">{post ? 'REFINE THE IDEA' : 'OPEN THE CONVERSATION'}</span><h1>{post ? <>Keep the idea <em>moving.</em></> : <>Put your idea <em>in motion.</em></>}</h1><p>{post ? 'Update your thinking and give the community a clearer view.' : 'A question, a sketch, a small detail that changes everything. Share what is on your mind.'}</p><div className="form-side-note"><span>✳</span><p>The best design critiques start with curiosity.</p></div></div>
      <div className="form-panel"><div className="panel-topline"><span>{post ? 'EDIT POST' : 'CREATE POST'}</span><span>01—03</span></div><PostForm post={post} onSave={save} /></div>
    </div>
  </div>
}
