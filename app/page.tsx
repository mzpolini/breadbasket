import Link from 'next/link'
import { SEED_FARM_ID, SEED_FARM_SECRET } from '@/lib/seed'

/**
 * A way in, while there is no real navigation. Both routes render from the
 * seed farm, which is generated relative to now and deliberately exercises
 * every state a position can be in.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">BreadBasket</h1>
      <p className="mt-2 opacity-70">
        A living availability layer for a local food community. Scaffolding &mdash; the
        markup is plain on purpose, waiting on a design system. The data flow underneath
        it is real.
      </p>

      <ul className="mt-10 space-y-6">
        <li>
          <Link href={`/farm/${SEED_FARM_SECRET}`} className="font-medium underline">
            The farmer&rsquo;s view
          </Link>
          <p className="mt-1 text-sm opacity-70">
            What he has, including what buyers can&rsquo;t see. Reached by secret URL,
            no login. This is the surface pilot success is measured on.
          </p>
        </li>
        <li>
          <Link href={`/f/${SEED_FARM_ID}`} className="font-medium underline">
            The public availability page
          </Link>
          <p className="mt-1 text-sm opacity-70">
            What a buyer sees. Only positions we can honestly claim &mdash; lapsed,
            sold-out and unresolvable ones are simply absent.
          </p>
        </li>
        <li>
          <Link href="/preview/read-back" className="font-medium underline">
            The read-back row
          </Link>
          <p className="mt-1 text-sm opacity-70">
            Every state at once, in isolation. The read-back belongs to the chat, which
            doesn&rsquo;t exist yet &mdash; this keeps the awkward rows honest until it does.
          </p>
        </li>
      </ul>
    </main>
  )
}
