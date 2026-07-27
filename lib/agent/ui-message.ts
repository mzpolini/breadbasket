import type { InferUITools, UIDataTypes, UIMessage } from 'ai'
import type { farmTools } from './tools'

/**
 * A message in this farm's conversation, typed against the agent's own tools.
 *
 * Worth naming rather than using bare `UIMessage`: it ties the stored transcript,
 * the validation on load, and the read-back card's props to one definition of
 * what `proposeMovements` returns. Change the tool's schema and every consumer
 * of an old transcript fails to compile instead of failing to render.
 */
export type FarmTools = InferUITools<ReturnType<typeof farmTools>>

export type FarmUIMessage = UIMessage<never, UIDataTypes, FarmTools>
