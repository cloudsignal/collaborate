/**
 * Last-Write-Wins merge for useSharedState.
 * Compares timestamps — the message with the newer timestamp wins.
 */
export interface LWWEntry<T> {
  value: T
  ts: number
  userId: string
}

export function lwwMerge<T>(
  current: LWWEntry<T>,
  incoming: LWWEntry<T>,
): LWWEntry<T> {
  return incoming.ts > current.ts ? incoming : current
}
