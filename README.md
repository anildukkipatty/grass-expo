<p align="center">
  <img src="assets/images/logo.png" alt="Grass" width="220" />
</p>

<h1 align="center">Grass Mobile</h1>
<p align="center"><strong>Your coding agent, in your pocket.</strong></p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#grassvm-vs-local-server">GrassVM vs Local Server</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#contributors">Contributors</a>
</p>

---

Grass Mobile lets you run and monitor AI coding sessions from your phone.

Use it with:
- **GrassVM** (managed cloud VM)
- **Your own machine** running `@grass-ai/ide` (local or remote)

## Features

- OTP login + onboarding
- Multi-machine carousel (GrassVM + custom machines)
- Repo browser with branch/language metadata
- Claude Code + Opencode support
- Streaming chat (SSE)
- Global tool permission queue (approve/deny)
- Diff viewer for code changes
- Session history and quick resume

## GrassVM vs Local Server

### GrassVM
Best for zero setup.
1. Sign in
2. Complete onboarding
3. Start coding immediately

### Local Server (your machine)
Best for full control.
1. Run on your machine:
   ```bash
   npx @grass-ai/ide start
   ```
2. Scan QR from mobile app (**Connect your Laptop**)
3. Pick repo and start chatting

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Xcode (iOS) and/or Android Studio (Android)

### Install

```bash
git clone <repo-url>
cd expo-app
npm install
```

### Run

```bash
npm start
npm run ios
npm run android
npm run web
```

---

## App structure (important)

> Current user-facing app is in **`app/new-navbar/*`**.
> Legacy screens exist in `app/(tabs)` and older routes.

Key files:
- `app/new-navbar/(tabs)` — main tabs (Chats/Home/Permissions/Repos)
- `app/new-navbar/chat.tsx` — chat UI
- `app/new-navbar/diffs.tsx` — diff UI
- `contexts/navbar-context.tsx` — machine/session orchestration
- `store/connection-store.ts` — REST + SSE state + permissions stream
- `store/url-store.ts` — machine URL persistence

---

## Troubleshooting

- **No repos:** verify selected machine is online/reachable.
- **QR scan fails:** grant camera permission in OS settings.
- **GrassVM unavailable:** retry from Home; app heartbeat checks VM state.
- **Version mismatch:** update both app and `@grass-ai/ide` CLI.

---

## Contributors

### Development notes
- Prioritize changes in `app/new-navbar/*`
- Preserve SSE/permission behavior in `store/connection-store.ts`
- Keep TypeScript strict and consistent with current patterns

### Lint

```bash
npm run lint
```

---

## License

MIT — see [LICENSE](LICENSE).
