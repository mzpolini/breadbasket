/**
 * Clerk's sign-in, sign-up and user menu, in Organic.
 *
 * Literal values rather than `var(--color-*)`: Clerk derives hover and
 * disabled shades from these, and it can't do that arithmetic on a CSS
 * variable. Keep them in step with the tokens in globals.css.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#c67139', // --color-accent
    colorPrimaryForeground: '#f5ead8', // --color-bg
    colorBackground: '#f9f4ed', // --color-neutral-100
    colorForeground: '#201e1d', // --color-text
    colorMutedForeground: '#645c50', // --color-neutral-700
    colorInput: '#ffffff',
    colorInputForeground: '#201e1d',
    colorNeutral: '#2e2b25', // --color-neutral-900
    colorDanger: '#8c491a', // --color-accent-700: stale is never red, and neither is a typo
    fontFamily: 'var(--font-figtree), system-ui, sans-serif',
    fontFamilyButtons: 'var(--font-caprasimo), serif',
    borderRadius: '12px',
  },
  elements: {
    card: { boxShadow: '0 3px 10px rgba(46, 43, 37, 0.16)', border: '1px solid rgba(32, 30, 29, 0.16)' },
    headerTitle: { fontFamily: 'var(--font-caprasimo), serif', fontWeight: 400, fontSize: '24px' },
    formButtonPrimary: { borderRadius: '999px', fontWeight: 400, textTransform: 'none' as const },
  },
}
