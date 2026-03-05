const CURSOR_COLORS = [
  { name: "Blue", hex: "#3B82F6", bg: "bg-blue-500" },
  { name: "Red", hex: "#EF4444", bg: "bg-red-500" },
  { name: "Green", hex: "#22C55E", bg: "bg-green-500" },
  { name: "Purple", hex: "#A855F7", bg: "bg-purple-500" },
  { name: "Orange", hex: "#F97316", bg: "bg-orange-500" },
  { name: "Pink", hex: "#EC4899", bg: "bg-pink-500" },
  { name: "Teal", hex: "#14B8A6", bg: "bg-teal-500" },
  { name: "Yellow", hex: "#EAB308", bg: "bg-yellow-500" },
] as const;

export function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
