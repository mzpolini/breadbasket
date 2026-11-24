import Link from 'next/link'
import './public.css'
import { Sprout } from './_components/brand'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-site">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <Link href="/" className="wordmark" aria-label="Breadbasket home"><Sprout />Breadbasket</Link>
      <nav aria-label="Main navigation"><Link href="/account">For members</Link><Link href="/find">Find fresh food</Link><Link href="/partners#wholesale">For buyers</Link><Link href="/about">Our roots</Link></nav>
      <Link href="/account" className="signin">Member sign in <span aria-hidden="true">↗</span></Link>
    </header>
    {children}
    <footer className="site-footer"><div className="wrap footer-top"><div><Link href="/" className="wordmark"><Sprout />Breadbasket</Link><p>Good things grow in community.</p></div><div><p className="eyebrow">BUILT WITH</p><p>The Black Farmer Directory, a farmer-owned resource of MABFC</p></div><div className="footer-links"><a href="https://blackfarmers.localfoodmarketplace.com/Producers" target="_blank" rel="noopener noreferrer">Become a member ↗</a><Link href="/find">Find fresh food ↗</Link><Link href="/about">Our story ↗</Link></div></div><div className="wrap footer-bottom"><span>Rooted in the land. Built for what’s next.</span><div><Link href="/privacy">Privacy</Link><Link href="/sms">Texting & consent</Link><span>© {new Date().getFullYear()} Breadbasket</span></div></div></footer>
  </div>
}
