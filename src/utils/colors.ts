const CURSOR_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#22C55E', // Green
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#EAB308', // Yellow
  '#6366F1', // Indigo
  '#F43F5E', // Rose
] as const

/**
 * Deterministic color assignment based on userId.
 * Same user always gets the same color across sessions.
 */
export function getColorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

/**
 * Get user initials from display name (for avatars).
 * "Alice Smith" → "AS", "bob" → "B"
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
