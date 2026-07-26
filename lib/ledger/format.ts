import { COUNT_UNIT, type Amount } from './types'

/**
 * How a quantity is spoken back to him.
 *
 * One function rather than a template string at each call site, because the
 * `count` unit is an internal token: it must never appear on screen, and "30
 * count of tomatoes" reaching the buyer page would be the sort of leak that
 * makes the whole thing feel like software rather than his own words.
 */
export function formatAmount(amount: Amount): string {
  return amount.unit === COUNT_UNIT ? `${amount.value}` : `${amount.value} ${amount.unit}`
}

/** The unit alone, for layouts that set the figure and the unit separately. */
export function formatUnit(unit: string): string {
  return unit === COUNT_UNIT ? '' : unit
}
