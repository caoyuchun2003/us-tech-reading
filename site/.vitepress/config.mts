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
