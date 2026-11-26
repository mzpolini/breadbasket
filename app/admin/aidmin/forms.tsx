'use client'

import { useActionState, useEffect, useRef } from 'react'
import { askAidmin, reviewSessionsNow, type ActionResult } from './actions'

function Note({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null
  return (
    <p className="adm-alert" role="alert">
      {state.error}
    </p>
  )
}

export function ReviewForm() {
  const [state, action, pending] = useActionState(reviewSessionsNow, null)
  return (
    <form action={action} className="aidmin-review">
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Reading sessions…' : 'Review sessions now'}
      </button>
      <Note state={state} />
    </form>
  )
}

export function AskForm() {
  const [state, action, pending] = useActionState(askAidmin, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.ok) ref.current?.reset()
  }, [state])
  return (
    <form ref={ref} action={action} className="aidmin-ask">
      <label htmlFor="aidmin-body" className="adm-label">
        Talk with AIdmin
      </label>
      <textarea
        id="aidmin-body"
        name="body"
        rows={3}
        className="adm-input"
        placeholder="How should we handle this? What do you want noticed next time?"
        disabled={pending}
      />
      <div className="aidmin-ask-row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'AIdmin is thinking…' : 'Send'}
        </button>
        <Note state={state} />
      </div>
    </form>
  )
}
