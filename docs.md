# Grass Server API

The server runs on a port in the range `32100–32199` (auto-selected, or specified with `-p`). All responses are JSON unless noted.

CORS is fully open — any origin is allowed.

---

## Workspace

### `GET /agents`
Returns the agents available on this server.

**Response**
```json
{ "agents": ["claude-code", "opencode"] }
```

---

### `GET /repos`
Lists repositories in the server's workspace directory.

**Response**
```json
{ "repos": [{ "name": "my-app", "path": "/workspace/my-app" }] }
```

---

### `POST /repos/clone`
Clones a git repository into the workspace.

**Body**
```json
{ "url": "https://github.com/user/repo" }
```

**Response**
```json
{ "path": "/workspace/repo", "name": "repo" }
```

---

### `POST /folders`
Creates a new folder in the workspace.

**Body**
```json
{ "name": "my-project" }
```

**Response**
```json
{ "path": "/workspace/my-project", "name": "my-project" }
```

---

### `GET /dir?repoPath=<path>&path=<subpath>`
Lists directory contents. `repoPath` is required and serves as the sandbox root. `path` defaults to `repoPath`.

**Response**
```json
{
  "entries": [
    { "name": "src", "type": "directory" },
    { "name": "index.ts", "type": "file", "size": 1024 }
  ]
}
```

---

### `GET /file?repoPath=<path>&path=<filePath>`
Reads a file. Both params required. `path` must be inside `repoPath`.

**Response**
```json
{ "content": "file contents here", "size": 1024 }
```

---

### `GET /diffs?repoPath=<path>`
Returns `git diff HEAD` output for the given repo. `repoPath` defaults to the server's working directory.

**Response**
```json
{ "diff": "diff --git a/..." }
```

---

## Sessions

### `GET /sessions?repoPath=<path>&agent=<agent>`
Lists past sessions for a repo. `agent` is `claude-code` or `opencode`; defaults to `claude-code`. `repoPath` defaults to the server's working directory.

**Response**
```json
{
  "sessions": [
    { "id": "uuid", "preview": "Fix the login bug — I'll look at...", "updatedAt": "2025-01-01T00:00:00.000Z" }
  ]
}
```

---

### `GET /sessions/:id/history?agent=<agent>&repoPath=<path>`
Loads the message history for a session. For `claude-code`, reads from the local `.jsonl` transcript; for `opencode`, fetches from the opencode server.

- `agent` — required when the session is not currently active in memory (`claude-code` or `opencode`)
- `repoPath` — required for `claude-code` sessions not in memory

**Response**
```json
{
  "messages": [
    { "role": "user", "content": "Fix the login bug" },
    { "role": "assistant", "content": "I'll look at the auth module..." }
  ]
}
```

---

### `GET /sessions/:id/status`
Returns whether a session is currently running. Only works for sessions active in the current server process.

**Response**
```json
{ "streaming": true }
```

**Errors**
- `404` — session not in memory

---

## Chat

### `POST /chat`
Starts a new agent run or resumes an existing session.

**Body**
```json
{
  "repoPath": "/workspace/my-app",
  "agent": "claude-code",
  "prompt": "Fix the login bug",
  "sessionId": "uuid"
}
```

- `repoPath` — required. Absolute path to the repo the agent should work in.
- `agent` — required. `"claude-code"` or `"opencode"`.
- `prompt` — required. The message to send.
- `sessionId` — optional. Pass an existing session ID to continue that conversation. If omitted, a new session is created.

**Response**
```json
{ "sessionId": "uuid" }
```

The returned `sessionId` is stable for the lifetime of the session. Use it for all subsequent calls (`/events`, `/abort`, `/permission`).

**Errors**
- `400` — missing fields or unavailable agent
- `409` — session is already running

---

## Events (SSE)

### `GET /events?sessionId=<id>`
Opens a Server-Sent Events stream for a session. Replays all buffered events from the beginning (or from `Last-Event-ID` if provided).

The stream closes automatically when the session finishes (`done`, `error`, or `aborted` event).

**Headers**
```
Accept: text/event-stream
Last-Event-ID: <seq>   (optional, to resume from a specific event)
```

Each SSE frame has the format:
```
id: <seq>
event: <type>
data: <json>
```

### Event Types

#### `user_prompt`
Echoed when the prompt is accepted. Appears as the first event in every run.
```json
{ "seq": 1, "type": "user_prompt", "prompt": "Fix the login bug" }
```

#### `system`
Internal SDK initialization event (claude-code only).
```json
{ "seq": 2, "type": "system", "subtype": "init", "data": { ... } }
```

#### `status`
Indicates what the agent is doing. Show as activity indicator.
```json
{ "seq": 3, "type": "status", "status": "thinking" }
{ "seq": 4, "type": "status", "status": "tool", "tool_name": "Bash", "elapsed": 1.2 }
{ "seq": 5, "type": "status", "status": "tool_summary", "summary": "Ran 3 commands" }
```

#### `tool_use`
A tool was invoked. `tool_input` is a human-readable string describing the call.
```json
{ "seq": 6, "type": "tool_use", "tool_name": "Edit", "tool_input": "src/auth.ts" }
```

#### `assistant`
A chunk of the assistant's text response. For claude-code this is a complete message block; for opencode it is an accumulating string (each event replaces the previous one for the current turn).
```json
{ "seq": 7, "type": "assistant", "content": "I found the issue in auth.ts..." }
```

#### `result`
Final result summary (claude-code only).
```json
{ "seq": 8, "type": "result", "subtype": "success", "result": "...", "cost": 0.004, "duration_ms": 12000, "num_turns": 3 }
{ "seq": 8, "type": "result", "subtype": "error_during_execution", "errors": [...], "cost": 0.002, "duration_ms": 5000 }
```

#### `permission_request`
The agent needs approval to use a tool. Respond with `POST /sessions/:id/permission`.
```json
{
  "seq": 9,
  "type": "permission_request",
  "toolUseID": "tool_abc123",
  "toolName": "Bash",
  "input": { "command": "rm -rf dist/" }
}
```

#### `done`
The session completed successfully. The SSE stream closes after this.
```json
{ "seq": 10, "type": "done" }
```

#### `error`
The session failed. The SSE stream closes after this.
```json
{ "seq": 10, "type": "error", "message": "API quota exceeded" }
```

#### `aborted`
The session was aborted by the user. The SSE stream closes after this.
```json
{ "seq": 10, "type": "aborted", "message": "Request aborted by user" }
```

---

## Session Actions

### `POST /sessions/:id/abort`
Aborts a running session.

**Response**
```json
{ "ok": true }
```

**Errors**
- `404` — session not found

---

### `POST /sessions/:id/permission`
Responds to a pending permission request.

**Body**
```json
{ "toolUseID": "tool_abc123", "approved": true }
```

- `toolUseID` — the ID from the `permission_request` event
- `approved` — `true` to allow, `false` to deny

**Response**
```json
{ "ok": true }
```

**Errors**
- `400` — missing `toolUseID`
- `404` — session not found

---

## Typical Flow

```
1. GET /repos                          → pick a repo
2. GET /agents                         → pick an agent
3. GET /sessions?repoPath=...&agent=.. → list past sessions (optional)
4. GET /sessions/:id/history           → load messages for a past session (optional)
5. POST /chat { repoPath, agent, prompt, sessionId? }
   → returns { sessionId }
6. GET /events?sessionId=...           → stream events
   - handle permission_request → POST /sessions/:id/permission
   - handle done/error/aborted → close stream
7. POST /chat { ..., sessionId }       → send follow-up in same session
```
