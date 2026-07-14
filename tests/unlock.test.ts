import { beforeEach, describe, expect, it } from 'vitest'
import {
  TOKEN_KEY,
  clearUnlockedToken,
  codeMatchesHashes,
  isUnlocked,
  normalizeCode,
  setUnlockedToken,
  sha256Hex
} from '../site/.vitepress/theme/lib/unlock'

describe('normalizeCode', () => {
  it('trims whitespace and uppercases', () => {
    expect(normalizeCode('  abc-123  ')).toBe('ABC-123')
  })
})

describe('codeMatchesHashes', () => {
  it('accepts a code whose normalized SHA-256 is in the hash list', async () => {
    const code = 'secret-code'
    const hex = await sha256Hex(normalizeCode(code))
    await expect(codeMatchesHashes(code, [hex])).resolves.toBe(true)
  })

  it('rejects a code that does not match any hash', async () => {
    await expect(
      codeMatchesHashes('wrong', ['deadbeef'.padEnd(64, '0')])
    ).resolves.toBe(false)
  })
})

describe('token storage', () => {
  beforeEach(() => {
    clearUnlockedToken()
  })

  it('round-trips unlocked token via localStorage', () => {
    expect(isUnlocked()).toBe(false)
    setUnlockedToken('abc123')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123')
    expect(isUnlocked()).toBe(true)
    clearUnlockedToken()
    expect(isUnlocked()).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
