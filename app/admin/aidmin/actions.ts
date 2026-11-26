'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/current-user'
import { replyToAdmin, runReview } from '@/lib/aidmin/run'

/**
 * AIdmin's two doors. Both start by asking who is signed in — a Server Action
 * is a public POST, and a farmer must not be able to read every session or
 * spend an Opus call by hitting one.
 */
export type ActionResult = { ok: true } | { ok: false; error: string }

export async function reviewSessionsNow(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()
  try {
    await runReview('daily')
    revalidatePath('/admin/aidmin')
    revalidatePath('/admin', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('aidmin review failed', error)
    return { ok: false, error: "AIdmin couldn't finish the briefing. Nothing new was saved." }
  }
}

export async function askAidmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  const text = String(formData.get('body') ?? '').trim()
  if (!text) return { ok: false, error: 'Write something first.' }
  try {
    await replyToAdmin(admin.clerkId, text)
    revalidatePath('/admin/aidmin')
    return { ok: true }
  } catch (error) {
    console.error('aidmin reply failed', error)
    return {
      ok: false,
      error: "AIdmin couldn't answer. What you wrote was kept, so the next briefing still sees it.",
    }
  }
}
