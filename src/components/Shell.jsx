import { Link, NavLink } from 'react-router'

export default function Shell({ children, mode, postCount }) {
  return <div className="site-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="Formline home">
          <span className="brand-icon" aria-hidden="true"><span /></span>
          <span>FORMLINE<span className="wordmark-dot">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          <NavLink to="/" end>Discussions</NavLink>
          <NavLink to="/new">New post</NavLink>
        </nav>
        <div className="header-right">
          <span className="header-status"><span className="status-light" />{mode === 'demo' ? 'BROWSER DEMO' : 'SUPABASE LIVE'}</span>
          <Link className="header-cta" to="/new">New discussion <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
    {mode === 'demo' && <div className="demo-notice"><div className="notice-inner"><span className="notice-label">DEMO MODE</span><span>Posts are saved in this browser. Connect Supabase to share the forum across devices.</span></div></div>}
    <main id="main-content">{children}</main>
    <footer className="site-footer"><div className="footer-inner"><span className="footer-brand">FORMLINE<span>.</span></span><span>A place for the people who draw what moves us.</span><span>{postCount} discussion{postCount === 1 ? '' : 's'}</span></div></footer>
  </div>
}
