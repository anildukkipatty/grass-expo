# Maestro E2E — Codex agent

This directory holds the end-to-end UI tests that drive the iOS simulator
against the Expo app and exercise the **codex** agent path end-to-end.

The single flow today is `codex_e2e.yaml`. It covers:

1. Tapping the Codex pill on the chat-list screen and verifying it activates.
2. Creating a new codex session and verifying the default model label
   ("GPT-5 Codex") is shown.
3. Sending a deterministic prompt and asserting the assistant reply contains
   `pong` (case-insensitive).
4. Backing out, re-opening the session, attaching an image from the photo
   library, and asking for a description — asserting a non-error reply.
5. Re-entering the session a second time and verifying the model selection
   was restored.

## Prerequisites

1. **Maestro CLI** (it's a binary, not an npm dep):

   ```bash
   brew install maestro
   # or
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **iOS simulator** with the Expo app installed. The simplest path is:

   ```bash
   cd expo-app
   npx expo run:ios
   ```

   That builds and launches the dev build into the booted simulator. The
   bundle id is `com.codeongrass` (see `app.json`).

3. **The local CLI server running**, with `OPENAI_API_KEY` exported in its
   environment, from `/Users/korgy/start/hot/pingpong/cli`. Pick whatever
   port you normally use; the server's job is to broker the codex calls.

4. **The codex CLI installed** so the server can shell out to it. Per the
   codex integration doc, this is typically:

   ```bash
   npm install -g @openai/codex
   ```

   (Check the cli repo's README for the canonical install command if that
   has changed.)

5. **The CLI server URL must be added inside the Expo app** before tests run.
   Either scan its QR code from the app's home screen or paste the URL in
   manually so it shows up as a VM in the Repos tab. The flow does **not**
   onboard the app; it assumes the Repos tab already lists at least one
   repository served by that CLI server.

## Running

From the `expo-app/` directory:

```bash
npm run test:e2e
```

Which is sugar for:

```bash
maestro test .maestro/codex_e2e.yaml
```

Expect ~3-5 minutes wall time. The flow makes two real codex round-trips
(text reply, image description), so it **hits OpenAI and may incur a small
charge** on whatever account `OPENAI_API_KEY` belongs to.

## Debugging & recording

- **Live exploration / picking selectors**: `maestro studio` opens an
  interactive viewer where you can inspect the running app's view hierarchy
  and try out taps before committing them to the flow.

- **Verbose trace dump**:

  ```bash
  maestro test --debug-output ./.maestro/debug .maestro/codex_e2e.yaml
  ```

  Drops screenshots and a per-step report under `.maestro/debug/`.

- **Single-step replay**: comment out a chunk of the YAML and re-run; the
  flow file is read top-to-bottom every invocation.

## TestIDs added for this flow

The codex pill, send button, attach button, model dropdown, and chat input
are icon-only or duplicated labels, so they got stable testIDs. These are
the only production-source changes for E2E:

| testID                       | File                                  | Purpose                                              |
|------------------------------|---------------------------------------|------------------------------------------------------|
| `agent-pill-claude`          | `app/new-navbar/chat-list.tsx`        | Claude tab in the agent picker row                   |
| `agent-pill-opencode`        | `app/new-navbar/chat-list.tsx`        | Opencode tab                                         |
| `agent-pill-codex`           | `app/new-navbar/chat-list.tsx`        | Codex tab (inactive state)                           |
| `agent-pill-codex-active`    | `app/new-navbar/chat-list.tsx`        | Codex tab (active state — used to assert selection)  |
| `chat-input`                 | `app/new-navbar/chat.tsx`             | Multiline text input                                 |
| `chat-send-button`           | `app/new-navbar/chat.tsx`             | Up-arrow send button                                 |
| `chat-stop-button`           | `app/new-navbar/chat.tsx`             | Stop / abort button shown while streaming            |
| `chat-attach-button`         | `app/new-navbar/chat.tsx`             | Paperclip / photos toolbar button                    |
| `chat-model-dropdown`        | `app/new-navbar/chat.tsx`             | Model picker chip (label is the visible model name)  |

Everything else the flow targets is matched by visible text ("New chat",
"GPT-5 Codex", "Photos", "Repos", `(?i)pong`, etc.) or by screen position
for the system iOS photo picker.

## Assets

- `assets/test-image.png` — a tiny 100×100 solid-color PNG bundled here in
  case a future variant of the flow needs to push a fixture image onto the
  simulator. The current flow uses the system Photos library directly, so
  the picked image is whatever's there; if you're running on a fresh
  simulator with no photos, drag `assets/test-image.png` onto the simulator
  window before running the flow.
