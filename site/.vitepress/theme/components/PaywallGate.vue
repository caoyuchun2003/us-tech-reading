<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="ustr-paywall">
    <h2>本课为付费内容</h2>
    <p>购买教育内容访问权（¥99）后，使用兑换码解锁第 4–8 课。</p>
    <p>
      <a class="ustr-cta" :href="withBase('/pay')">查看如何购买</a>
      &nbsp;
      <a :href="withBase('/unlock')">我有兑换码</a>
    </p>
    <p class="ustr-footer-disclaimer">本站为教育产品，不构成投资建议。</p>
  </div>
</template>
