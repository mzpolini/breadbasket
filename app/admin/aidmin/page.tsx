import { connection } from 'next/server'
import { fullTime } from '@/lib/admin'
import type { FarmerRead, Proposal, Urgency } from '@/lib/aidmin/brief'
import { requireAdmin } from '@/lib/auth/current-user'
import { listAidminMessages, listReports } from '@/lib/storage/aidmin'
import { AskForm, ReviewForm } from './forms'

export const maxDuration = 60

const URGENCY_LABEL: Record<Urgency, string> = {
  calm: 'Went well',
  watch: 'Worth a look',
  emergency: 'Stuck',
}

function asFarmers(value: unknown): FarmerRead[] {
  return Array.isArray(value) ? (value as FarmerRead[]) : []
}

function asProposals(value: unknown): Proposal[] {
  return Array.isArray(value) ? (value as Proposal[]) : []
}

/** The briefings, and the thread where admins tell AIdmin how to read the next one. */
export default async function AidminPage() {
  await requireAdmin()
  await connection()
  const [reports, messages] = await Promise.all([listReports(30), listAidminMessages(80)])

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>AIdmin</h1>
          <p className="adm-sub">
            Reads farmer sessions with Opus and says how they went, including when someone is stuck
            and when the product can&rsquo;t hold what they said.
          </p>
        </div>
        <ReviewForm />
      </header>

      <section className="adm-section" aria-labelledby="briefings">
        <h2 id="briefings">Briefings</h2>
        {reports.length === 0 ? (
          <p className="adm-empty">
            None yet. Review sessions now, or wait for the morning run. A quiet day still gets a
            note, so silence is an answer.
          </p>
        ) : (
          reports.map((report) => {
            const urgency = report.urgency as Urgency
            const farmers = asFarmers(report.farmers)
            const proposals = asProposals(report.proposals)
            return (
              <article key={report.id} className="adm-card aidmin-report">
                <header className="aidmin-report-head">
                  <span className={`adm-badge adm-badge--${urgency}`}>{URGENCY_LABEL[urgency] ?? report.urgency}</span>
                  <span className="adm-muted">{report.kind === 'emergency' ? 'Emergency' : 'Daily'}</span>
                  <time dateTime={report.createdAt.toISOString()}>{fullTime(report.createdAt)}</time>
                </header>
                <h3>{report.title}</h3>
                <p>{report.narrative}</p>
                {farmers.length > 0 && (
                  <ul className="aidmin-points">
                    {farmers.map((farmer) => (
                      <li key={`${report.id}-${farmer.farm}-${farmer.name}`}>
                        <strong>
                          {farmer.name}
                          {farmer.farm ? ` · ${farmer.farm}` : ''}
                        </strong>
                        <span>{farmer.read}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {proposals.length > 0 && (
                  <div className="aidmin-proposals">
                    <h4>What the product would have to change</h4>
                    <ul className="aidmin-points">
                      {proposals.map((proposal) => (
                        <li key={`${report.id}-${proposal.title}`}>
                          <strong>{proposal.title}</strong>
                          <span>{proposal.why}</span>
                          <span>{proposal.change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          })
        )}
      </section>

      <section className="adm-section" aria-labelledby="thread">
        <h2 id="thread">With the admins</h2>
        <p className="adm-sub aidmin-thread-note">
          What you say here is kept, and the next briefing reads it. Tell AIdmin how to treat a
          person, or what not to worry about.
        </p>
        {messages.length > 0 && (
          <ol className="aidmin-thread">
            {messages.map((message) => (
              <li key={message.id} className={`aidmin-turn aidmin-turn--${message.role}`}>
                <span className="aidmin-who">{message.role === 'admin' ? 'Admin' : 'AIdmin'}</span>
                <time dateTime={message.createdAt.toISOString()}>{fullTime(message.createdAt)}</time>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        )}
        <AskForm />
      </section>
    </>
  )
}
