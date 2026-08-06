let counter = 0

/**
 * Deterministic-enough unique id generator. Avoids `crypto.randomUUID` so the
 * demo works in every browser and in jsdom without polyfills.
 */
export function createId(prefix = 'id'): string {
  counter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${counter.toString(36)}${random}`
}

/** Test helper: makes ids reproducible across runs. */
export function resetIdCounter(): void {
  counter = 0
}
