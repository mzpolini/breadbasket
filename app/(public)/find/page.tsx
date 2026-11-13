import type { Metadata } from 'next'
import Link from 'next/link'
import { StandPreview } from '../_components/brand'
export const metadata: Metadata = { title: 'Find fresh food | Breadbasket' }
export default function Page() {
 return <main id="main"><section className="wrap inner-hero"><p className="eyebrow">FIND FRESH FOOD</p><h1>A good week<br />starts at the farm.</h1><p>See what a farmer has this week. Then make the connection yourself.</p></section><section className="wrap inner-content"><div className="notice"><p><strong>We’re starting small.</strong></p><p>During the beta, participating farmers share their own farm stand links directly. Ask your farmer or your co-op for their page. A searchable directory and map connection are coming later.</p></div><h2>A peek at a farm stand.</h2><p>This is an illustrative example using the produce in our sample conversation. It isn’t a live farm or an offer of food for sale.</p><StandPreview /><h2>From their field to your table.</h2><p>A farm stand tells you what’s available and what’s coming soon. Look for when the farmer last updated the page, then arrange your visit or purchase directly with them.</p><p>During the beta, older availability is marked as not recently confirmed. Check with the farmer before making the trip.</p><Link className="text-link" href="/about">Meet the community behind Breadbasket ↗</Link></section></main>
}
