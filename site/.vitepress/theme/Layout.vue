<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-footer-before>
      <p class="ustr-footer-disclaimer">
        内容仅供教育学习，不构成投资建议。详见
        <a :href="withBase('/disclaimer')">免责声明</a>。
        若有帮助，欢迎
        <a :href="withBase('/sponsor')">资助作者</a>。
      </p>
    </template>
  </Layout>
</template>
