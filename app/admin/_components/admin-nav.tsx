'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/people', label: 'People' },
  { href: '/admin/farms', label: 'Farms' },
  { href: '/admin/aidmin', label: 'AIdmin' },
  { href: '/admin/api-keys', label: 'API keys' },
  { href: '/admin/almanac', label: 'Almanac' },
]

export function AdminNav({ waiting, alarms }: { waiting: number; alarms: number }) {
  const pathname = usePathname()
  return (
    <nav className="adm-nav" aria-label="Admin">
      {LINKS.map((link) => {
        const active =
          link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
        return (
          <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}>
            {link.label}
            {link.href === '/admin/people' && waiting > 0 && (
              <span className="adm-count" title={`${waiting} waiting for a farm`}>
                {waiting}
              </span>
            )}
            {link.href === '/admin/aidmin' && alarms > 0 && (
              <span className="adm-count" title={`${alarms} stuck in the last two days`}>
                {alarms}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
