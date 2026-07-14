import { createHash } from 'node:crypto'

const code = process.argv[2]
if (!code) {
  console.error('Usage: npm run hash-code -- <code>')
  process.exit(1)
}

const normalized = code.trim().toUpperCase()
const hex = createHash('sha256').update(normalized).digest('hex')
console.log(hex)
