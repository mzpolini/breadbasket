import Link from 'next/link'
import { fullTime, timeAgo, type DayCount, type PersonStatus } from '@/lib/admin'

export function Tile({
  label,
  value,
  note,
  href,
  accent = false,
}: {
  label: string
  value: React.ReactNode
  note?: React.ReactNode
  href?: string
  accent?: boolean
}) {
  const className = `adm-tile${accent ? ' adm-tile--accent' : ''}`
  const body = (
    <>
      <span className="adm-tile-label">{label}</span>
      <span className="adm-tile-value">{value}</span>
      {note && <span className="adm-tile-note">{note}</span>}
    </>
  )
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

const STATUS_LABEL: Record<PersonStatus, string> = {
  admin: 'admin',
  farmer: 'farmer',
  pending: 'needs a farm',
  uninvited: 'not invited',
  invited: 'invited',
  revoked: 'revoked',
}

export function StatusBadge({ status }: { status: PersonStatus }) {
  return <span className={`adm-badge adm-badge--${status}`}>{STATUS_LABEL[status]}</span>
}

/** A relative time, with the full one on hover. */
export function When({ at, now }: { at: Date | null; now: Date }) {
  if (!at) return <span className="adm-muted">—</span>
  return (
    <time dateTime={at.toISOString()} title={fullTime(at)} className="when">
      {timeAgo(at, now)}
    </time>
  )
}

/**
 * Messages per day as bars. One series, so the heading names it and there is
 * no legend; each bar has a hover/focus tooltip, and a screen reader gets the
 * same numbers from the labels.
 */
export function DailyBars({ days }: { days: DayCount[] }) {
  const peak = Math.max(1, ...days.map((d) => d.messages))
  const label = (day: string) => {
    const [y, m, d] = day.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
  return (
    <div className="adm-chart">
      <div className="adm-bars" role="list">
        {days.map((d) => (
          <div
            key={d.day}
            className="adm-bar"
            role="listitem"
            tabIndex={0}
            aria-label={`${label(d.day)}: ${d.messages} messages from ${d.people} ${d.people === 1 ? 'person' : 'people'}`}
          >
            <div className="adm-bar-fill" style={{ height: `${(d.messages / peak) * 100}%` }}>
              {d.messages === peak && d.messages > 0 && (
                <span className="adm-bar-value" aria-hidden>
                  {d.messages}
                </span>
              )}
            </div>
            <span className="adm-bar-tip" aria-hidden>
              <strong>{label(d.day)}</strong>
              <br />
              {d.messages} message{d.messages === 1 ? '' : 's'} · {d.people}{' '}
              {d.people === 1 ? 'person' : 'people'}
            </span>
          </div>
        ))}
      </div>
      <div className="adm-axis" aria-hidden>
        {days.map((d, i) => (
          <span key={d.day}>{(days.length - 1 - i) % 2 === 0 ? Number(d.day.slice(8)) : ''}</span>
        ))}
      </div>
    </div>
  )
}
