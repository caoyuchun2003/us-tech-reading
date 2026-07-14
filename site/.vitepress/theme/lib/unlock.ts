export const TOKEN_KEY = 'ustr_unlocked_v1'

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function codeMatchesHashes(
  code: string,
  hashes: string[]
): Promise<boolean> {
  const hex = await sha256Hex(normalizeCode(code))
  const set = new Set(hashes.map((h) => h.trim().toLowerCase()).filter(Boolean))
  return set.has(hex)
}

export function parseHashEnv(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
}

export function setUnlockedToken(codeHash: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(TOKEN_KEY, codeHash)
}

export function clearUnlockedToken(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function isUnlocked(): boolean {
  if (typeof localStorage === 'undefined') return false
  return Boolean(localStorage.getItem(TOKEN_KEY))
}
