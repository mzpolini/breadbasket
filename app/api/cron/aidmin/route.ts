import { runReview } from '@/lib/aidmin/run'

export const maxDuration = 60

/**
 * The morning briefing. Vercel calls this with `Authorization: Bearer $CRON_SECRET`.
 *
 * `?mode=scan` writes a row only when someone is stuck, so a more frequent
 * schedule can watch for emergencies without filing a calm day twice. The
 * scheduled run is the daily one: the plan this project is on allows one cron
 * a day, and the morning is when an admin will actually read it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization')
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = new URL(request.url).searchParams.get('mode') === 'scan' ? 'scan' : 'daily'
  try {
    const result = await runReview(mode)
    return Response.json({ ok: true, mode, ...result })
  } catch (error) {
    console.error('aidmin cron failed', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}
