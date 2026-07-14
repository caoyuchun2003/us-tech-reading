# 美股科技阅读课

给国内新手的美股科技公司阅读课。

## Local setup

```bash
npm i
npm run dev      # VitePress dev server
npm test         # Vitest
npm run build    # production build → site/.vitepress/dist
```

## Unlock codes

Codes are never committed. Only SHA-256 hashes enter the build.

Generate a hash:

```bash
npm run hash-code -- 'YOUR-CODE'
```

Set the comma-separated hashes locally in `.env` (see `.env.example`):

```bash
VITE_UNLOCK_CODE_HASHES=<hash>[,<hash>...]
```

For GitHub Pages deploys, set the same value as the Actions secret `VITE_UNLOCK_CODE_HASHES`.

## Compliance

This is an educational product, not investment advice. It does not recommend buying or selling any security.

## Design

See [docs/superpowers/specs/2026-07-14-us-tech-reading-design.md](docs/superpowers/specs/2026-07-14-us-tech-reading-design.md).

## Failure metric

If almost nobody finishes free lessons 1–3, fix content not features.
