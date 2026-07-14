# US Tech Reading Course Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a VitePress MVP for「给国内新手的美股科技公司阅读课」with course-first home, 8 lessons (3 free / 5 gated), ¥99 pay instructions, unlock-code gate, ink-blue study theme, and full disclaimer.

**Architecture:** VitePress site rooted at `site/` (so design docs under `docs/superpowers/` stay separate). Custom theme extends default Layout to enforce paywall from frontmatter + `localStorage` token. Unlock codes are never committed; only SHA-256 hashes enter the build via `VITE_UNLOCK_CODE_HASHES`. Pure unlock helpers live in `site/.vitepress/theme/lib/unlock.ts` and are unit-tested with Vitest.

**Tech Stack:** VitePress (latest), Vue 3, TypeScript, Vitest, Node 20+, GitHub Pages (`peaceiris/actions-gh-pages` or native Pages from Actions).

**Spec:** `docs/superpowers/specs/2026-07-14-us-tech-reading-design.md`

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Scripts: `dev`, `build`, `preview`, `test`; deps |
| `.env.example` | Documents `VITE_UNLOCK_CODE_HASHES` (no real codes) |
| `.gitignore` | Already ignores `.env`, `node_modules`, dist caches |
| `README.md` | Setup, hash-codes script, deploy notes, compliance note |
| `site/index.md` | Course-first landing (hero + CTA + 8-row schedule) |
| `site/pay.md` | ¥99 education product + payment instructions placeholders |
| `site/unlock.md` | Embeds `<UnlockForm />` |
| `site/about.md` | Soft track-record copy + link to disclaimer |
| `site/disclaimer.md` | Full non-advice legal text |
| `site/course/01.md` … `08.md` | Lessons; frontmatter `title`, `order`, `free` |
| `site/course/worksheet.md` | Optional one-pager template linked from 08 |
| `site/.vitepress/config.mts` | Title, themeConfig nav/sidebar, `base` for Pages |
| `site/.vitepress/theme/index.ts` | Extends default theme; registers components |
| `site/.vitepress/theme/Layout.vue` | Wraps default Layout; injects `PaywallGate` in doc slot |
| `site/.vitepress/theme/custom.css` | Ink-blue tokens, fonts, CTA |
| `site/.vitepress/theme/components/PaywallGate.vue` | Hides paid content without token |
| `site/.vitepress/theme/components/UnlockForm.vue` | Code input → verify → persist → redirect |
| `site/.vitepress/theme/lib/unlock.ts` | Hash normalize, verify, token read/write |
| `scripts/hash-code.mjs` | CLI: plain code → sha256 hex for env var |
| `tests/unlock.test.ts` | Unit tests for unlock helpers |
| `.github/workflows/deploy.yml` | Build + GitHub Pages; inject secret hashes |

---

### Task 1: Scaffold package + VitePress `site/`

**Files:**
- Create: `package.json`
- Create: `site/.vitepress/config.mts`
- Create: `site/index.md` (minimal stub)
- Modify: `.gitignore` (ensure `site/.vitepress/dist` / cache covered)

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "us-tech-reading",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev site",
    "build": "vitepress build site",
    "preview": "vitepress preview site",
    "test": "vitest run",
    "test:watch": "vitest",
    "hash-code": "node scripts/hash-code.mjs"
  },
  "devDependencies": {
    "vitepress": "^1.6.3",
    "vitest": "^3.0.5",
    "vue": "^3.5.13"
  }
}
```

- [ ] **Step 2: Write minimal `site/.vitepress/config.mts`**

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '美股科技阅读课',
  description: '给国内新手的美股科技公司阅读课',
  lang: 'zh-CN',
  base: '/us-tech-reading/',
  themeConfig: {
    nav: [
      { text: '课纲', link: '/course/01' },
      { text: '购买', link: '/pay' },
      { text: '解锁', link: '/unlock' },
      { text: '关于', link: '/about' }
    ],
    sidebar: [
      {
        text: '课程',
        items: [
          { text: '01 质量价值是什么', link: '/course/01' },
          { text: '02 能力圈与美股科技', link: '/course/02' },
          { text: '03 读懂生意', link: '/course/03' },
          { text: '04 护城河', link: '/course/04' },
          { text: '05 财报抓手', link: '/course/05' },
          { text: '06 估值常识', link: '/course/06' },
          { text: '07 风险清单', link: '/course/07' },
          { text: '08 一页纸作业', link: '/course/08' }
        ]
      }
    ],
    outline: { label: '本页目录' },
    docFooter: { prev: '上一课', next: '下一课' }
  }
})
```

- [ ] **Step 3: Stub `site/index.md`**

```md
---
layout: home
---

# 给国内新手的美股科技公司阅读课

[开始第 1 课](/course/01)
```

- [ ] **Step 4: Install and verify dev server starts**

Run:
```bash
cd /Users/Admin/Documents/us-tech-reading
npm install
npm run dev
```
Expected: VitePress serves without error; open local URL shows stub home.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json site .gitignore
git commit -m "chore: scaffold VitePress site package"
```

---

### Task 2: Unlock library + Vitest

**Files:**
- Create: `site/.vitepress/theme/lib/unlock.ts`
- Create: `tests/unlock.test.ts`
- Create: `vitest.config.ts`
- Create: `scripts/hash-code.mjs`
- Create: `.env.example`

- [ ] **Step 1: Write failing tests**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node'
  }
})
```

Create `tests/unlock.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeCode,
  sha256Hex,
  codeMatchesHashes,
  TOKEN_KEY,
  setUnlockedToken,
  clearUnlockedToken,
  isUnlocked
} from '../site/.vitepress/theme/lib/unlock'

describe('normalizeCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeCode('  ab-cd  ')).toBe('AB-CD')
  })
})

describe('codeMatchesHashes', () => {
  it('accepts a code whose sha256 is in the list', async () => {
    const code = 'TEST-CODE-1'
    const hash = await sha256Hex(normalizeCode(code))
    expect(await codeMatchesHashes(code, [hash])).toBe(true)
  })

  it('rejects unknown codes', async () => {
    expect(await codeMatchesHashes('NOPE', ['deadbeef'])).toBe(false)
  })
})

describe('token storage', () => {
  beforeEach(() => {
    clearUnlockedToken()
  })

  it('round-trips unlock flag in localStorage', async () => {
    const hash = await sha256Hex('ABC')
    setUnlockedToken(hash)
    expect(isUnlocked()).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test`  
Expected: FAIL — module or exports missing.

- [ ] **Step 3: Implement `site/.vitepress/theme/lib/unlock.ts`**

```ts
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
```

Note: Vitest node environment needs `localStorage` mock OR switch token tests to `happy-dom` / `jsdom`. Prefer adding `"environment": "happy-dom"` in vitest config and dependency `happy-dom`. For `crypto.subtle` in Node 20+, global crypto exists.

If `crypto.subtle` missing in test, use:
```ts
import { webcrypto } from 'node:crypto'
globalThis.crypto = webcrypto as Crypto
```
at top of `unlock.ts` only when `typeof crypto === 'undefined'` — better put polyfill in `tests/setup.ts`.

- [ ] **Step 4: Add test setup + happy-dom; run tests PASS**

`tests/setup.ts`:
```ts
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) {
  // @ts-expect-error node webcrypto
  globalThis.crypto = webcrypto
}
```

Update vitest.config.ts:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts']
  }
})
```

Run: `npm install -D happy-dom && npm test`  
Expected: all PASS.

- [ ] **Step 5: Add `scripts/hash-code.mjs` and `.env.example`**

`scripts/hash-code.mjs`:
```js
import { createHash } from 'node:crypto'

const code = process.argv[2]
if (!code) {
  console.error('Usage: npm run hash-code -- YOUR-CODE')
  process.exit(1)
}
const normalized = code.trim().toUpperCase()
const hex = createHash('sha256').update(normalized).digest('hex')
console.log(hex)
```

`.env.example`:
```bash
# Comma-separated SHA-256 hex digests of normalized (trim+upper) unlock codes
# Generate: npm run hash-code -- 'YOUR-CODE'
VITE_UNLOCK_CODE_HASHES=
```

- [ ] **Step 6: Commit**

```bash
git add site/.vitepress/theme/lib/unlock.ts tests vitest.config.ts scripts .env.example package.json package-lock.json
git commit -m "feat: add unlock hash helpers with tests"
```

---

### Task 3: Theme — ink-blue CSS + Layout paywall shell

**Files:**
- Create: `site/.vitepress/theme/custom.css`
- Create: `site/.vitepress/theme/index.ts`
- Create: `site/.vitepress/theme/Layout.vue`
- Create: `site/.vitepress/theme/components/PaywallGate.vue`

- [ ] **Step 1: Implement `custom.css` tokens**

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700&display=swap');

:root {
  --ustr-bg: #f5f7fa;
  --ustr-ink: #1b3a5f;
  --ustr-text: #142033;
  --ustr-muted: #5a6578;
  --vp-c-brand-1: #1b3a5f;
  --vp-c-brand-2: #244a75;
  --vp-c-brand-3: #16304f;
  --vp-c-bg: var(--ustr-bg);
  --vp-c-text-1: var(--ustr-text);
  --vp-c-text-2: var(--ustr-muted);
  --vp-font-family-base: 'Noto Sans SC', system-ui, sans-serif;
}

.ustr-hero h1,
.vp-doc h1,
.vp-doc h2 {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  color: var(--ustr-text);
}

.ustr-cta {
  display: inline-block;
  background: var(--ustr-ink);
  color: #fff !important;
  padding: 0.65rem 1.15rem;
  border-radius: 2px;
  text-decoration: none !important;
  font-weight: 600;
}

.ustr-cta:hover {
  background: #244a75;
}

.ustr-footer-disclaimer {
  font-size: 0.8rem;
  color: var(--ustr-muted);
  border-top: 1px solid #d8dee8;
  margin-top: 2rem;
  padding-top: 1rem;
}

.ustr-paywall {
  border: 1px solid #d0d7e2;
  background: #fff;
  padding: 1.5rem;
  border-radius: 2px;
}

.ustr-schedule {
  list-style: none;
  padding: 0;
}

.ustr-schedule li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid #e2e7ef;
}
```

- [ ] **Step 2: Implement `PaywallGate.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { isUnlocked } from '../lib/unlock'

const { frontmatter, page } = useData()

const isCourse = computed(() => page.value.relativePath.startsWith('course/'))
const isFree = computed(() => frontmatter.value.free === true)
const locked = computed(
  () => isCourse.value && !isFree.value && !isUnlocked()
)
</script>

<template>
  <div v-if="locked" class="ustr-paywall">
    <h2>本课为付费内容</h2>
    <p>购买教育内容访问权（¥99）后，使用兑换码解锁第 4–8 课。</p>
    <p>
      <a class="ustr-cta" :href="withBase('/pay')">查看如何购买</a>
      &nbsp;
      <a :href="withBase('/unlock')">我有兑换码</a>
    </p>
    <p class="ustr-footer-disclaimer">本站为教育产品，不构成投资建议。</p>
  </div>
  <slot v-else />
</template>
```

- [ ] **Step 3: Implement `Layout.vue`**

```vue
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PaywallGate from './components/PaywallGate.vue'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
const { page } = useData()
</script>

<template>
  <Layout>
    <template #doc-footer-before>
      <p class="ustr-footer-disclaimer">
        内容仅供教育学习，不构成投资建议或操作指令。详见
        <a :href="page.relativePath.startsWith('disclaimer') ? '#' : '/disclaimer'">免责声明</a>。
      </p>
    </template>
  </Layout>
</template>
```

Wire paywall by wrapping content via `#doc-after` is wrong — need to hide markdown body. Prefer:

**Approach:** In `PaywallGate`, use it inside Layout as:

```vue
<template>
  <Layout>
    <template #doc-before>
      <PaywallGate v-if="shouldGate" />
    </template>
  </Layout>
</template>
```

Better reliable approach for VitePress: set paid lesson markdown body to a short stub in git **OR** use CSS + client script. Spec allows client gate: keep full markdown in repo (accepted bypass) and use Layout slot `#home-hero` irrelevant.

**Chosen MVP approach:** `PaywallGate` replaces `Content` by custom Layout:

```vue
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import PaywallGate from './components/PaywallGate.vue'
import { isUnlocked } from './lib/unlock'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

const showPaywall = computed(() => {
  const course = page.value.relativePath.startsWith('course/')
  const paid = frontmatter.value.free !== true
  return course && paid && !isUnlocked()
})
</script>

<template>
  <Layout>
    <template v-if="showPaywall" #doc-after>
      <!-- force-hide via CSS class on wrapper -->
    </template>
  </Layout>
</template>
```

Simplest robust MVP: **paid pages' visible markdown is only a placeholder** in the built site is NOT ideal for authoring.

**Final approach for this plan:** Theme `Layout.vue` extends default and uses:

```vue
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, Content } from 'vitepress'
import { computed, ref, onMounted } from 'vue'
import { isUnlocked } from './lib/unlock'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()
const unlocked = ref(false)

onMounted(() => {
  unlocked.value = isUnlocked()
})

const gated = computed(() => {
  return (
    page.value.relativePath.startsWith('course/') &&
    frontmatter.value.free !== true &&
    !unlocked.value
  )
})
</script>

<template>
  <Layout>
    <template #doc-footer-before>
      <div v-if="gated" class="ustr-paywall">
        <h2>本课为付费内容</h2>
        <p>支付 ¥99 获取教育内容访问权后，在「解锁」页输入兑换码。</p>
        <p>
          <a class="ustr-cta" href="/pay">去购买说明</a>
          <a href="/unlock" style="margin-left:1rem">我有兑换码</a>
        </p>
      </div>
      <p v-else class="ustr-footer-disclaimer">
        内容仅供教育学习，不构成投资建议。详见 <a href="/disclaimer">免责声明</a>。
      </p>
    </template>
  </Layout>
</template>
```

And add CSS to hide `.vp-doc > *` when body has class `ustr-locked` set onMounted on `document.documentElement`.

Implement lock class in Layout:

```ts
onMounted(() => {
  unlocked.value = isUnlocked()
  if (gated.value) document.documentElement.classList.add('ustr-locked')
  else document.documentElement.classList.remove('ustr-locked')
})
```

```css
html.ustr-locked .vp-doc {
  display: none;
}
html.ustr-locked .ustr-paywall-banner {
  display: block;
}
```

Put paywall banner in `#doc-before` so it shows when doc hidden.

- [ ] **Step 4: Wire `theme/index.ts`**

```ts
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import UnlockForm from './components/UnlockForm.vue'
import './custom.css'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('UnlockForm', UnlockForm)
  }
} satisfies Theme
```

(UnlockForm created in Task 4 — for this task register a temporary stub component if needed.)

- [ ] **Step 5: Manual check**

Run `npm run dev`, open a stub paid course page with `free: false`, confirm body hidden and banner shown without token.

- [ ] **Step 6: Commit**

```bash
git commit -am "feat: add ink-blue theme and client paywall gate"
```

---

### Task 4: UnlockForm + pay / unlock / about / disclaimer pages

**Files:**
- Create: `site/.vitepress/theme/components/UnlockForm.vue`
- Create: `site/unlock.md`
- Create: `site/pay.md`
- Create: `site/about.md`
- Create: `site/disclaimer.md`

- [ ] **Step 1: Implement `UnlockForm.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import {
  codeMatchesHashes,
  parseHashEnv,
  setUnlockedToken,
  sha256Hex,
  normalizeCode
} from '../lib/unlock'

const code = ref('')
const message = ref('')
const busy = ref(false)

async function onSubmit() {
  busy.value = true
  message.value = ''
  try {
    const hashes = parseHashEnv(import.meta.env.VITE_UNLOCK_CODE_HASHES)
    if (!hashes.length) {
      message.value = '站点尚未配置兑换码，请稍后再试或联系作者。'
      return
    }
    const ok = await codeMatchesHashes(code.value, hashes)
    if (!ok) {
      message.value = '兑换码无效，请检查后重试。'
      return
    }
    const hash = await sha256Hex(normalizeCode(code.value))
    setUnlockedToken(hash)
    message.value = '解锁成功，正在跳转第 4 课…'
    window.location.href = withBase('/course/04')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="ustr-paywall" @submit.prevent="onSubmit">
    <label>
      兑换码
      <input v-model="code" type="text" autocomplete="off" required />
    </label>
    <p>
      <button class="ustr-cta" type="submit" :disabled="busy">解锁</button>
    </p>
    <p v-if="message">{{ message }}</p>
  </form>
</template>
```

- [ ] **Step 2: Write `site/unlock.md`**

```md
# 解锁付费课程

输入购买后收到的兑换码。解锁状态保存在本浏览器。

<UnlockForm />

本站售卖的是教育内容访问权，不构成投资建议。
```

- [ ] **Step 3: Write `site/pay.md`**

```md
# 购买说明

## 产品

- **名称：** 美股科技阅读课（第 4–8 课访问权）
- **价格：** ¥99（教育内容，非投资顾问服务）
- **包含：** 护城河 / 财报抓手 / 估值常识 / 风险清单 / Apple 一页纸作业

## 如何购买

1. 使用微信或支付宝转账 **¥99** 至作者收款码（下方占位，上线前替换为图片或说明）。
2. 转账备注：`阅读课` + 你的联系方式（邮箱或微信号）。
3. 作者核对后发送**兑换码**。
4. 打开 [解锁页](/unlock) 输入兑换码。

> TODO 作者：替换为真实收款方式与联系渠道。上线前删除本提示。

## 声明

内容仅供学习方法与框架，不构成任何证券投资建议或操作指令。
```

- [ ] **Step 4: Write `site/about.md` and `site/disclaimer.md`**

`about.md`: 弱披露「长期关注并实盘美股科技，经历过回撤」；不写倍数；链到 disclaimer。

`disclaimer.md`: 明确非投顾、案例为教学、数据可能过时、过往表现不代表未来、读者自负决策责任。

- [ ] **Step 5: Manual test unlock**

```bash
npm run hash-code -- 'DEMO-001'
# put hash into site/.env : VITE_UNLOCK_CODE_HASHES=<hash>
npm run dev
```
Unlock with `DEMO-001`, confirm redirect and paid pages visible.

- [ ] **Step 6: Commit**

```bash
git add site
git commit -m "feat: add pay, unlock, about, disclaimer pages"
```

---

### Task 5: Course-first home page

**Files:**
- Modify: `site/index.md`

- [ ] **Step 1: Replace home with course-first layout (no default VitePress features dump)**

Use custom layout home content (plain markdown + HTML allowed in VitePress):

```md
---
layout: doc
title: 给国内新手的美股科技公司阅读课
---

<div class="ustr-hero">

# 美股科技阅读课

给国内新手的美股科技公司阅读课。

用质量价值框架读懂生意、护城河与财报抓手——主案例 Apple。不提供买卖建议。

<p><a class="ustr-cta" href="./course/01.html">开始第 1 课（免费）</a></p>

</div>

## 课表

<ul class="ustr-schedule">
  <li><a href="./course/01.html">01 质量价值是什么</a> <span>免费</span></li>
  <li><a href="./course/02.html">02 能力圈与美股科技</a> <span>免费</span></li>
  <li><a href="./course/03.html">03 读懂生意</a> <span>免费</span></li>
  <li><a href="./course/04.html">04 护城河</a> <span>付费</span></li>
  <li><a href="./course/05.html">05 财报抓手</a> <span>付费</span></li>
  <li><a href="./course/06.html">06 估值常识</a> <span>付费</span></li>
  <li><a href="./course/07.html">07 风险清单</a> <span>付费</span></li>
  <li><a href="./course/08.html">08 一页纸作业</a> <span>付费</span></li>
</ul>

<p class="ustr-footer-disclaimer">教育产品，非投资建议。详见 <a href="./disclaimer.html">免责声明</a>。</p>
```

Prefer VitePress links without `.html` where possible: `/course/01`.

- [ ] **Step 2: Visual check in browser** — first viewport = brand/title, one sentence, one CTA, schedule; no stats strip.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: course-first landing page"
```

---

### Task 6: Eight lesson markdown skeletons + worksheet

**Files:**
- Create: `site/course/01.md` … `08.md`
- Create: `site/course/worksheet.md`

Each lesson target **1500–3500 Chinese characters** for publishable drafts; MVP may ship **outline-complete drafts** (≥800 chars) for 01–03 first, with 04–08 clearly structured placeholders if needed — but plan requires at least full outlines + key sections so the site is teachable.

Frontmatter template:
```md
---
title: 01 质量价值是什么
order: 1
free: true
---
```

Paid lessons: `free: false`.

- [ ] **Step 1: Create 01–03 with real teaching prose** (quality value; circle of competence; reading a business via Apple). Must obey compliance red lines.

- [ ] **Step 2: Create 04–08 with full section headings and substantive paragraphs** (moat, financials, valuation without target prices, risks, one-pager assignment). Link 08 → `/course/worksheet`.

- [ ] **Step 3: Create `worksheet.md`** — one-page template fields: 生意、用户、收入、护城河、财务抓手、估值思考、风险、我不懂的地方。

- [ ] **Step 4: `npm run build` must succeed**

- [ ] **Step 5: Commit**

```bash
git add site/course
git commit -m "content: add eight-lesson curriculum and worksheet"
```

---

### Task 7: README + deploy workflow (GitHub Pages)

**Files:**
- Create: `README.md`
- Create: `.github/workflows/deploy.yml`
- Modify: `site/.vitepress/config.mts` (`base` already `/us-tech-reading/`)

- [ ] **Step 1: Write README** covering clone, `npm i`, `npm run dev`, hashing codes, setting `VITE_UNLOCK_CODE_HASHES`, compliance one-liner, link to design spec.

- [ ] **Step 2: Add deploy workflow**

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_UNLOCK_CODE_HASHES: ${{ secrets.VITE_UNLOCK_CODE_HASHES }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/.vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Local production build**

```bash
VITE_UNLOCK_CODE_HASHES=$(npm run hash-code -- 'DEMO-001' | tail -1) npm run build
npm run preview
```
Expected: preview works; unlock works with DEMO-001.

- [ ] **Step 4: Commit**

```bash
git add README.md .github site
git commit -m "ci: add GitHub Pages deploy workflow"
```

- [ ] **Step 5: Create remote + push (human/agent when asked)**

```bash
gh repo create caoyuchun2003/us-tech-reading --private --source=. --remote=origin --push
```
Then set Actions secret `VITE_UNLOCK_CODE_HASHES` and enable Pages (Source: GitHub Actions).

---

### Task 8: Compliance copy pass + smoke checklist

**Files:**
- Modify: any lesson / pay / about copy that violates red lines

- [ ] **Step 1: Search repo for banned operational phrasing**

Run:
```bash
rg -n '买入|卖出|加仓|目标价|止损位|仓位比例|稳赚|荐股' site/
```
Expected: no instructional hits on tickers (概念解释若命中需改写语境)。

- [ ] **Step 2: Manual smoke checklist**

1. Home: one CTA, schedule visible  
2. 01–03 readable without unlock  
3. 04 locked without token  
4. Unlock with valid code → 04 readable  
5. Footer disclaimer on lesson pages  
6. `/pay` states education product ¥99  

- [ ] **Step 3: Final commit if copy changed**

```bash
git commit -am "docs: compliance copy pass before launch"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|---|---|
| VitePress static course site | Task 1 |
| Course-first home | Task 5 |
| Paths: course/pay/unlock/about/disclaimer | Tasks 4–6 |
| 8 lessons, 1–3 free, Apple throughline | Task 6 |
| ¥99 + WeChat/Alipay manual | Task 4 `pay.md` |
| Unlock code + localStorage | Tasks 2–4 |
| Codes not in git plaintext | Task 2 `.env.example`, Task 7 secrets |
| Ink-blue theme | Task 3 |
| Disclaimer / no advice | Tasks 4, 8 |
| No行情/社区/账号 | Honored (no tasks) |
| Deploy Pages | Task 7 |
| Failure metric content-first | README note only |

**Placeholder scan:** `pay.md` contains an explicit author TODO to replace payment details — required ops step, not an implementation gap. No TBD in code tasks.

**Type consistency:** `TOKEN_KEY`, `sha256Hex`, `codeMatchesHashes`, `parseHashEnv`, `isUnlocked`, `setUnlockedToken` used consistently across tests, UnlockForm, PaywallGate.
