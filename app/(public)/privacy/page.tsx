import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy | Breadbasket' }
export default function Page() {
 return <main id="main"><section className="wrap inner-hero"><p className="eyebrow">PRIVACY</p><h1>Your words<br />deserve care.</h1><p>A plain-language guide to the public site and the farmer beta.</p></section><section className="wrap inner-content"><h2>What becomes public.</h2><p>A farm stand displays the availability a farmer has approved, along with freshness information. Don’t include private information in an update you intend to publish.</p><h2>Signing in.</h2><p>Farmer accounts use Clerk for sign-in. Account access is separate from viewing this public website. You don’t need an account to read these pages.</p><h2>Before joining the pilot.</h2><p>Ask your co-op contact for the pilot’s full privacy terms, including how conversations are stored, who can access them, and how to request removal. This page is an overview; the pilot’s full privacy terms still need to be provided before enrollment.</p></section></main>
}
