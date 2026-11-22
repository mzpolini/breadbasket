import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/current-user'
import {
  colophon,
  entries,
  howToRead,
  preface,
  reading,
  soil,
  tended,
  words,
  type Entry,
  type Standing,
} from '@/lib/almanac/content'
import styles from './almanac.module.css'

export const metadata: Metadata = {
  title: "Farmer's Almanac · Breadbasket",
  description: 'The beliefs Breadbasket is built on, and what each one commits the directory to.',
}

const LEAD: Record<Standing, string> = {
  decided: 'The yes',
  hypothesis: 'The working belief',
  open: 'The question',
}

const STANDING_LABEL: Record<Standing, string> = {
  decided: 'Decided',
  hypothesis: 'Hypothesis',
  open: 'Open',
}

const GROUPS: { standing: Standing; id: string; title: string; lede: string }[] = [
  {
    standing: 'decided',
    id: 'decisions',
    title: 'Decisions',
    lede: 'In force. A partner can build on these. Changing one is a change to the product, and sometimes to the API.',
  },
  {
    standing: 'hypothesis',
    id: 'hypotheses',
    title: 'Hypotheses',
    lede: 'What we are operating on, and have not closed with him. Safe to assume for the pilot. Not safe to treat as permanent.',
  },
  {
    standing: 'open',
    id: 'open',
    title: 'Open',
    lede: 'Named so a later yes has somewhere to land. Nothing here is a field a partner should invent on our behalf.',
  },
]

function count(standing: Standing): number {
  return entries.filter((entry) => entry.standing === standing).length
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <article id={entry.id} className={styles.entry}>
      <div className={styles.entryHead}>
        <span className={styles.num}>{entry.number}</span>
        <span className={`${styles.status} ${styles[entry.standing]}`}>{STANDING_LABEL[entry.standing]}</span>
      </div>
      <h3>{entry.title}</h3>
      <p className={styles.leadLabel}>{LEAD[entry.standing]}</p>
      <p className={styles.lead}>{entry.lead}</p>
      <dl className={styles.map}>
        <div className={styles.mapRow}>
          <dt className={styles.kSoil}>Soil</dt>
          <dd>{entry.soil}</dd>
        </div>
        <div className={styles.mapRow}>
          <dt className={styles.kRequirement}>Requirement</dt>
          <dd>{entry.requirement}</dd>
        </div>
        <div className={styles.mapRow}>
          <dt className={styles.kConsequence}>Consequence</dt>
          <dd>{entry.consequence}</dd>
        </div>
      </dl>
      <p className={styles.source}>{entry.source}</p>
    </article>
  )
}

export default async function AlmanacPage() {
  await requireAdmin()

  return (
    <div className={styles.root}>
      <div className={styles.sheet}>
        <header className={styles.mast}>
          <p className={styles.kicker}>Farmer&rsquo;s Almanac</p>
          <h1>What a small yes commits us to.</h1>
          <p className={styles.tended}>Pilot · tended {tended}</p>
          <ul className={styles.counts}>
            {GROUPS.map((group) => (
              <li key={group.id}>
                <Link href={`#${group.id}`}>
                  {count(group.standing)} {STANDING_LABEL[group.standing].toLowerCase()}
                </Link>
              </li>
            ))}
            <li>
              <Link href="#words">Words</Link>
            </li>
          </ul>
        </header>

        <p className={styles.preface}>{preface}</p>

        <dl className={styles.how}>
          {howToRead.map((part) => (
            <div key={part.k}>
              <dt>{part.k}</dt>
              <dd>{part.body}</dd>
            </div>
          ))}
        </dl>

        <nav className={styles.jump} aria-label="Sections">
          <a href="#soil">Soil</a>
          <a href={`#${reading.id}`}>How to say a row</a>
          {GROUPS.map((group) => (
            <a key={group.id} href={`#${group.id}`}>
              {group.title}
            </a>
          ))}
          <a href="#words">Words</a>
        </nav>

        <nav className={styles.nav} aria-label="Almanac">
          <div className={styles.navGroup}>
            <p className={styles.navLabel}>Ground</p>
            <a href="#soil">Soil</a>
            <a href={`#${reading.id}`}>How to say a row</a>
          </div>
          {GROUPS.map((group) => (
            <div key={group.id} className={styles.navGroup}>
              <p className={styles.navLabel}>
                <a href={`#${group.id}`}>{group.title}</a>
              </p>
              {entries
                .filter((entry) => entry.standing === group.standing)
                .map((entry) => (
                  <a key={entry.id} href={`#${entry.id}`}>
                    <span className={styles.navIndex}>{entry.number}</span>
                    {entry.index}
                  </a>
                ))}
            </div>
          ))}
          <div className={styles.navGroup}>
            <p className={styles.navLabel}>Language</p>
            <a href="#words">Words</a>
          </div>
        </nav>

        <div className={styles.main}>
          <section id="soil" className={styles.section}>
            <h2>Soil</h2>
            <p className={styles.lede}>
              Six beliefs. Everything filed under a number below is one of these, followed far enough to matter.
            </p>
            <div className={styles.soil}>
              {soil.map((belief) => (
                <article key={belief.id} id={belief.id}>
                  <h3>{belief.title}</h3>
                  <p>{belief.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id={reading.id} className={styles.section}>
            <h2>How to say a row</h2>
            <p className={styles.lede}>{reading.lede}</p>
            <ul className={styles.phrases}>
              {reading.rows.map((row) => (
                <li key={row.when}>
                  <p className={styles.when}>{row.when}</p>
                  <p className={styles.say}>{row.say}</p>
                </li>
              ))}
            </ul>
            <p className={styles.note}>{reading.note}</p>
          </section>

          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className={styles.section}>
              <h2>{group.title}</h2>
              <p className={styles.lede}>{group.lede}</p>
              {entries
                .filter((entry) => entry.standing === group.standing)
                .map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
            </section>
          ))}

          <section id="words" className={styles.section}>
            <h2>Words</h2>
            <p className={styles.lede}>
              The same English word is doing two jobs. The directory&rsquo;s word is a field. Ours is the thing the field was cut from.
            </p>
            {words.map((group) => (
              <div key={group.id} className={styles.glossary}>
                <h3 id={group.id}>{group.title}</h3>
                <dl className={styles.defs}>
                  {group.terms.map((word) => (
                    <div key={word.term}>
                      <dt>{word.term}</dt>
                      <dd>{word.means}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </section>

          <p className={styles.colophon}>{colophon}</p>
        </div>
      </div>
    </div>
  )
}
