# Pre-launch smoke checklist

Verified by reading site frontmatter, theme, and pages (2026-07-14).

- [x] Home: one CTA (`开始第 1 课（免费）`), schedule visible (`.ustr-schedule`)
- [x] 01–03 readable without unlock (`free: true` in frontmatter)
- [x] 04 locked without token (`free: false`; `Layout.vue` gates when not unlocked)
- [x] Unlock form exists (`UnlockForm.vue`) and uses env hashes (`VITE_UNLOCK_CODE_HASHES`)
- [x] Footer disclaimer path exists (`/disclaimer` on home + layout footer)
- [x] `/pay` states education product ¥99
