import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Texting & consent | Breadbasket' }
export default function Page() {
 return <main id="main"><section className="wrap inner-hero"><p className="eyebrow">TEXTING & CONSENT</p><h1>A conversation<br />you choose.</h1><p>Texting is part of the farmer pilot. This website does not enroll you in messages.</p></section><section className="wrap inner-content"><h2>Join through your co-op.</h2><p>Participating farmers receive account-claiming and texting instructions through the co-op. Use only the number provided with those instructions.</p><h2>Know what you’re agreeing to.</h2><p>Before opting in, the pilot needs to provide its message frequency, any carrier charges, instructions for stopping messages or requesting help, and full privacy terms. Ask your co-op contact for those details before sending your first message.</p><p>Creating a browser account or visiting this page does not give consent to receive text messages.</p><Link className="text-link" href="/farmers">Back to the farmer guide ↗</Link></section></main>
}
