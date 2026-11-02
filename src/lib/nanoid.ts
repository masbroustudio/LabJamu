/** Tiny nano-ID generator (no external dep needed for this) */
export function nanoid(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Array.from(bytes, b => alphabet[b & 63]).join('')
}
