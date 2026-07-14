<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, withBase } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'
import PaywallGate from './components/PaywallGate.vue'
import { isUnlocked } from './lib/unlock'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()
const unlocked = ref(false)

const gated = computed(
  () =>
    page.value.relativePath.startsWith('course/') &&
    frontmatter.value.free !== true &&
    !unlocked.value
)

function syncLockClass() {
  if (typeof document === 'undefined') return
  if (gated.value) document.documentElement.classList.add('ustr-locked')
  else document.documentElement.classList.remove('ustr-locked')
}

onMounted(() => {
  unlocked.value = isUnlocked()
  syncLockClass()
})

watch(gated, syncLockClass)
</script>

<template>
  <Layout>
    <template #doc-before>
      <PaywallGate v-if="gated" />
    </template>
    <template #doc-footer-before>
      <p v-if="!gated" class="ustr-footer-disclaimer">
        内容仅供教育学习，不构成投资建议。详见
        <a :href="withBase('/disclaimer')">免责声明</a>。
      </p>
    </template>
  </Layout>
</template>
