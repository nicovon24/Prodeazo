/**
 * Normalize a key pasted from the Bzzoiro dashboard or from curl snippets.
 * Avoids `Authorization: Token Token …` when the env value already includes the prefix.
 */
export function normalizeBzzoiroApiKey(raw: string): string {
  let s = raw.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  s = s.replace(/^token\s+/i, '').trim()
  s = s.replace(/^bearer\s+/i, '').trim()
  return s
}

/** Default `Token` per https://sports.bzzoiro.com/docs/ — set `BZZOIRO_AUTH_SCHEME=Bearer` if your account requires it. */
export function bzzoiroAuthorizationValue(apiKey: string): string {
  const scheme = (process.env.BZZOIRO_AUTH_SCHEME ?? 'Token').trim() || 'Token'
  const key = normalizeBzzoiroApiKey(apiKey)
  return `${scheme} ${key}`
}
