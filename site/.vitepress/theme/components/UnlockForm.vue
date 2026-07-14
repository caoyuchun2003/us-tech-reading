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
