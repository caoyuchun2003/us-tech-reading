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
