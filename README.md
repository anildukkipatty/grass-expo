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
  <a href="#contributing">Contributing</a>
</p>

---

Grass is an iOS-first mobile client for the [Pingpong](https://github.com/korgy/pingpong) CLI. Connect to your Pingpong server from your phone, chat with an AI coding assistant, review diffs, and approve tool executions — all from the couch.

## Features

- **QR Code Connect** — Scan a QR code to instantly connect to any Pingpong server
- **Multi-Server** — Save and manage multiple server connections with swipe-to-delete
- **Real-Time Chat** — Stream AI responses with full markdown and syntax highlighting
- **Diff Viewer** — Review color-coded file diffs with line numbers and file stats
- **Permission Requests** — Approve or deny tool executions from a native modal
- **Auto-Reconnect** — WebSocket connections recover automatically with exponential backoff
- **Dark Mode** — Manual light/dark theme toggle, persisted across sessions

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS: Xcode and an Apple Developer account (free tier works)
- A running [Pingpong](https://github.com/korgy/pingpong) server to connect to

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

1. **Add a server** — Tap "Scan QR Code" on the home screen to scan your Pingpong server's QR code, or manually add a WebSocket URL
2. **Pick a session** — Tap a server to see its sessions, or start a new one
3. **Chat** — Send messages to your AI assistant and watch responses stream in real-time
4. **Review diffs** — Tap the "Diffs" button to see what code changes the assistant has made
5. **Approve tools** — When the assistant wants to run a tool, a permission modal pops up for you to allow or deny

## Architecture

```
app/
├── _layout.tsx          # Root stack navigator + theme provider
├── index.tsx            # Redirects to /home
├── home.tsx             # Server list + QR scanner
├── sessions.tsx         # Session list for a server
├── chat.tsx             # Chat interface
└── diffs.tsx            # Diff viewer

components/
├── MessageBubble.tsx    # Markdown-rendered chat messages
├── ActivityBar.tsx      # Animated "Working..." indicator
├── PermissionModal.tsx  # Tool approval dialog
└── SyntaxBlock.tsx      # Code block with syntax highlighting

hooks/
└── use-websocket.ts     # WebSocket connection + message protocol

store/
├── theme-store.ts       # Light/dark theme persistence
└── url-store.ts         # Server URL list management
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) 54 + [React Native](https://reactnative.dev) 0.81 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based stack) |
| Language | TypeScript 5.9 |
| Realtime | Native WebSocket with ping/pong keep-alive |
| Markdown | react-native-markdown-display + react-syntax-highlighter |
| Animations | react-native-reanimated |
| Storage | AsyncStorage |
| Camera | expo-camera (QR scanning) |

### WebSocket Protocol

Grass communicates with Pingpong servers over WebSocket using a simple text-based protocol:

**Client → Server:** `ping`, `list_sessions`, `init {sessionId}`, `message {content}`, `abort`, `permission_response {toolUseID, approved}`

**Server → Client:** `pong`, `sessions_list`, `assistant`, `diffs`, `permission_request`, `session_status`, `history`, `status`, `result`, `error`

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create your branch (`git checkout -b my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
