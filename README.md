<p align="center">
  <img src="assets/images/logo.png" alt="Grass" width="500" />
</p>

<p align="center">
  <strong>A mobile client for AI-powered code generation</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &nbsp;&bull;&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;&bull;&nbsp;
  <a href="#usage">Usage</a> &nbsp;&bull;&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;&bull;&nbsp;
  <a href="#server-api">Server API</a> &nbsp;&bull;&nbsp;
  <a href="#contributing">Contributing</a>
</p>

---

Grass is an iOS-first mobile client for the [Grass CLI](https://github.com/anildukkipatty/grass-ide). Connect to your Grass server from your phone, browse repositories, chat with an AI coding assistant, review diffs, and approve tool executions — all from the couch.

## Features

- **QR Code Connect** — Scan a QR code to instantly connect to any Grass server (QR codes emit `http://` URLs directly)
- **Multi-Server** — Save and manage multiple server connections with swipe-to-delete; newest connections appear first
- **Multi-Agent** — Choose between Claude Code and OpenCode per session from an inline agent picker
- **Repository Browser** — List, clone, and create repos on the connected server; view git branch, last commit, and dominant language per repo
- **Real-Time Chat** — Stream AI responses over SSE with full markdown and syntax highlighting; deduplicates message chunks by sequence number
- **File Explorer** — Browse the repository's directory tree from within the chat screen
- **Diff Viewer** — Review color-coded file diffs with line numbers and per-file stats
- **Permission Requests** — Approve or deny tool executions from a native modal; permission queue is managed globally across all connected servers so nothing gets missed
- **Background Safety** — All SSE streams are closed when the app backgrounds; active streams are re-attached when the app returns to the foreground
- **Dark Mode** — Manual light/dark theme toggle (sun/moon icons in chat header), persisted in AsyncStorage
- **iPad Support** — Wider layout with a 52px sidebar on iPad via `project.tsx`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS: Xcode and an Apple Developer account (free tier works)
- A running [Grass](https://github.com/anildukkipatty/grass-ide) server to connect to

### Installation

```bash
git clone https://github.com/korgy/grass.git
cd grass
npm install
```

### Running

```bash
# Start the Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Building for Device (iOS)

```bash
# Generate the native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/*.xcworkspace
```

Configure your signing team in Xcode, select your device, and hit Run. Free Apple Developer accounts require re-signing every 7 days.

## Usage

1. **Add a server** — Tap "Scan QR Code" on the home screen to scan your Grass server's QR code. The QR code encodes an `http://` URL directly. You can also manage previously scanned servers from the home screen list (swipe to delete).
2. **Pick a repo** — Tap a server to see its repositories. You can clone a remote repo or create a new folder from this screen. Tap a repo to open the agent picker.
3. **Pick an agent** — Choose Claude Code or OpenCode. This opens the session list for that repo/agent combination.
4. **Pick or start a session** — Select an existing session to resume it, or tap the "+" button to start a new one.
5. **Chat** — Send messages to your AI assistant and watch responses stream in real-time. Use the file explorer panel to browse the repo while you work.
6. **Review diffs** — Tap the "Diffs" button in the chat header to see what code changes the assistant has made.
7. **Approve tools** — When the assistant wants to run a tool, a permission modal pops up for you to allow or deny. If you navigate away, the modal appears wherever you are in the app.

## Architecture

```
app/
├── _layout.tsx          # Root stack navigator, theme provider, global permission modal manager
├── index.tsx            # Always redirects to /home
├── home.tsx             # Server list + QR scanner (static grey health dots)
├── folders.tsx          # Repo list; tap repo → inline agent picker modal → /sessions
├── sessions.tsx         # Session list for a repo/agent; tap → /chat
├── chat.tsx             # Chat interface, file explorer panel, diff button
├── diffs.tsx            # Diff viewer modal (fade_from_bottom presentation)
├── project.tsx          # iPad workspace layout with 52px sidebar
└── agent-picker.tsx     # Legacy screen (kept but no longer in main nav flow)

components/
├── MessageBubble.tsx    # Markdown-rendered chat messages with syntax highlighting
├── ActivityBar.tsx      # Animated "Working..." indicator
├── PermissionModal.tsx  # Tool approval dialog
├── SyntaxBlock.tsx      # Code block with syntax highlighting
├── DiffViewer.tsx       # Calls getDiffsStore on mount; subscribes to connection state
└── ExplorerPanel.tsx    # Directory tree browser; calls useServer; listDir on path change

hooks/
├── use-server.ts        # Primary hook: useServer(serverUrl); exposes initSession, listSessions, etc.
└── use-websocket.ts     # Compatibility shim re-exporting from use-server.ts; adds connected=false,
                         #   reconnecting=false, cwd=null, no-op selectRepo/selectAgent

store/
├── connection-store.ts  # Module-level Map<url, ConnectionEntry>; REST + SSE operations
├── theme-store.ts       # Light/dark theme persistence (AsyncStorage)
└── url-store.ts         # Server URL list (AsyncStorage key: grass_server_urls);
                         #   migrates old grass_ws_urls on first read (ws:// → http://)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) 54 + [React Native](https://reactnative.dev) 0.81 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based stack) |
| Language | TypeScript 5.9 |
| Transport | REST (stateless ops) + SSE via `expo/fetch` (streaming chat) |
| Markdown | react-native-markdown-display + react-syntax-highlighter |
| Animations | react-native-reanimated |
| Storage | @react-native-async-storage/async-storage |
| Camera | expo-camera — QR scanning via `CameraView.launchScanner()` |
| Haptics | expo-haptics |

### REST + SSE Transport

The app communicates with Grass servers using plain HTTP REST for stateless operations and Server-Sent Events (SSE) for streaming chat responses. This replaced the original WebSocket architecture.

**Stateless REST calls** (via `connection-store.ts`):
- `GET /repos` — list repositories
- `POST /repos/clone` — clone a remote repo
- `POST /folders` — create a new folder
- `GET /dir` — browse directory contents
- `GET /file` — read a file
- `GET /diffs` — get `git diff HEAD` output
- `GET /agents` — list available agents
- `GET /sessions` — list past sessions for a repo/agent
- `GET /sessions/:id/history` — load full message history
- `GET /sessions/:id/status` — check if a session is actively streaming
- `POST /chat` — start or resume a session, returns `{ sessionId }`
- `POST /sessions/:id/abort` — abort a running session
- `POST /sessions/:id/permission` — respond to a tool permission request

**Streaming via SSE** (`GET /events?sessionId=<id>`):

Each SSE frame carries a sequence number (`id: <seq>`), an event type, and a JSON payload. The client uses the sequence number to deduplicate `assistant` message chunks on reconnect. The stream closes automatically after `done`, `error`, or `aborted`.

| Event | Meaning |
|-------|---------|
| `user_prompt` | Echoed prompt — marks the start of a run |
| `system` | SDK init metadata (claude-code only) |
| `status` | Agent activity: `thinking`, `tool`, `tool_summary` |
| `tool_use` | A tool was invoked (name + human-readable input) |
| `assistant` | Text response chunk; opencode sends accumulating full-text replacements |
| `result` | Final summary with cost, duration, turn count (claude-code only) |
| `permission_request` | Tool needs user approval; respond via `POST /sessions/:id/permission` |
| `done` | Session completed — stream closes |
| `error` | Session failed — stream closes |
| `aborted` | Session aborted by user — stream closes |

### Routing Params

`agent` and `repoPath` are passed as URL params on every navigation push — they are not stored as server-side state. The full param chain is:

```
/home
  → /folders?serverUrl=<url>
    → /sessions?serverUrl=<url>&repoPath=<path>&repoName=<name>&agent=<agent>
      → /chat?serverUrl=<url>&sessionId=<id>&repoPath=<path>&agent=<agent>
```

### Global Permission Manager

`_layout.tsx` mounts a `GlobalPermissionsManager` component that subscribes to permission queues across all connected servers. The first pending permission in the queue is always surfaced in a `PermissionModal`, regardless of which screen the user is on. Responding approves or denies via `respondGlobalPermission`, which calls `POST /sessions/:id/permission` and removes the item from the queue.

### AppState Handling

`connection-store.ts` listens to React Native's `AppState`. When the app moves to the background all active SSE streams are closed. When it returns to the foreground, any entry that was streaming when backgrounded re-attaches its SSE connection automatically.

### URL Storage & Migration

Server URLs are stored in AsyncStorage under the key `grass_server_urls`. On first read the store transparently migrates any URLs from the old `grass_ws_urls` key, converting `ws://` prefixes to `http://` in the process. Duplicate URLs are removed on save; the most recently used URL appears first.

## Server API

Full API reference is in [docs.md](docs.md). The quick summary:

- **Port range:** `32100–32199` (auto-selected or set with `-p`)
- **CORS:** fully open — any origin allowed
- **Base URL:** `http://<host>:<port>`

See [docs.md](docs.md) for complete endpoint documentation, request/response shapes, and the full SSE event reference.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create your branch (`git checkout -b my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
