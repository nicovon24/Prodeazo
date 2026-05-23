export type BzzoiroImageType = 'team' | 'league' | 'player' | 'manager' | 'venue'

export function getBzzoiroImageUrl(
  type: BzzoiroImageType,
  id: string | number | null | undefined
): string | null {
  if (id === null || id === undefined || id === '') return null
  return `https://sports.bzzoiro.com/img/${type}/${encodeURIComponent(String(id))}/`
}
