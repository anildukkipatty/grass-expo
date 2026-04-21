# Potential Issues with OpenCode Client Flow

## 1. Race Condition in Agent Selection

**Location:** `app/folders.tsx:339-346`

```typescript
function handleSelectAgent(agentId: string) {
  if (!pendingRepo || !serverUrl) return;
  setPendingRepo(null);  // Cleared immediately
  router.push({
    pathname: '/sessions',
    params: { serverUrl, repoPath: pendingRepo.path, repoName: pendingRepo.name, agent: agentId },
  });
}
```

**Issue:** `pendingRepo` is cleared immediately before navigation occurs. If navigation fails or is cancelled, the user loses the selected repo context.

**Severity:** Medium

**Recommended Fix:** Only clear `pendingRepo` after successful navigation, or persist it until a new selection is made.

---

## 2. No Agent Context Persistence

**Issue:** Agent selection (`agent` param) is only passed via URL params. If user navigates to diffs and back, agent context may be lost.

**Related Code:** `app/chat.tsx:65` uses agent from URL params, but there's no validation that it matches the current session.

**Severity:** Medium

**Recommended Fix:** 
- Store the selected agent in the connection store
- Verify agent context when navigating back to sessions/chat
- Provide fallback to default agent if context is lost

---

## 3. Inconsistent iPad vs iPhone Flow

**Issue:** There are two different UX paths:
- **iPad:** folders → project → sessions
- **iPhone:** folders → agent picker modal → sessions

**Location:** `app/folders.tsx:329-337`

```typescript
function openAgentPicker(repo: Repo) {
  if (isIPad) {
    router.push({
      pathname: '/project',
      params: { serverUrl: serverUrl!, repoPath: repo.path, repoName: repo.name },
    });
  } else {
    setPendingRepo(repo);
  }
}
```

**Severity:** Low

**Recommended Fix:** Consider standardizing the flow or document the intentional differences clearly.

---

## 4. Session Initialization Without Validation

**Location:** `app/chat.tsx:62-68`

```typescript
useEffect(() => {
  if (!sessionInitialized.current && serverUrl) {
    sessionInitialized.current = true;
    ws.initSession(initialSessionId ?? null, agent ?? null, repoPath ?? null);
  }
}, []);
```

**Issue:** Only runs once. If user switches between agents for same repo, session won't reinitialize with new agent.

**Severity:** Medium

**Recommended Fix:** 
- Track current agent in state and reinitialize when it changes
- Clear session when agent changes
- Consider using `useEffect` with agent dependency

---

## 5. SSE Stream State on App State Changes

**Location:** `store/connection-store.ts:319-336`

```typescript
AppState.addEventListener('change', (next) => {
  if (next !== 'active') {
    for (const [url] of _connections) closeSSEStream(url);
  } else {
    for (const [url, entry] of _connections) {
      if (entry.currentSessionId && entry.streaming) {
        openSSEStream(url, entry.currentSessionId);
      }
    }
  }
});
```

**Issue:** On quick state changes (active → inactive → active within seconds), can trigger multiple SSE stream reconnects, causing duplicate messages.

**Severity:** High

**Recommended Fix:** 
- Add debounce logic to prevent rapid reconnection attempts
- Track last state and ignore consecutive changes to same state
- Add connection id/nonce to safely ignore stale events

---

## 6. No Error Boundary for Agent Selection

**Issue:** If `selectAgent` is called before agent picker modal fully renders, or if server responds slowly, user gets no feedback.

**Severity:** Low

**Recommended Fix:** Add loading states and error messages for agent selection operations.

---

## 7. Missing Agent Session Affinity

**Issue:** The flow doesn't enforce that sessions belong to the selected agent. User could have sessions from multiple agents for same repo from `sessions` screen, leading to confusion.

**Severity:** Medium

**Recommended Fix:**
- Filter sessions by agent in the sessions list
- Store agent association with each session
- Show agent badge on session items to clarify ownership

---

---

## 8. SSE Stream Drop Clears `streaming` Flag While Agent Still Running

**Location:** `store/connection-store.ts` — `openSSEStream` (lines ~446–455)

**Bug:** The `streaming` flag is unconditionally set to `false` whenever the SSE `ReadableStream` reader resolves `done: true` or the fetch throws — regardless of whether the agent actually finished. This happens even when the stream drops due to a network blip or the server closing the HTTP connection for a non-terminal reason (keepalive timeout, proxy reset, etc.).

```typescript
// After the read loop exits (done or error):
const e = _connections.get(serverKey);
if (e) {
  e.sseAbortController = null;
  e.streaming = false;   // ← always set false, even on unexpected drops
  notifyListeners(serverKey);
}
```

**Condition that triggers it:**
- The SSE connection drops mid-session (network blip, server keepalive timeout, Expo fetch layer closing the stream) without a `result`, `done`, `error`, or `aborted` event being received.
- The reader loop exits cleanly (`done: true`) but no terminal SSE event was handled, so `entry.streaming` was never set false by the event handler — yet the finally block sets it false anyway.

**Observed symptom:** The abort button disappears and the input becomes editable mid-session. Navigating to the sessions list and re-opening the chat restores the streaming state because `initSessionStore` hits `/sessions/:id/status`, sees `streaming: true` on the server, and re-attaches the SSE stream.

**Root cause:** No distinction between "stream ended because agent finished" vs "stream ended because connection dropped."

**Recommended Fix:**
Track whether a terminal SSE event was received within `openSSEStream`. Only set `streaming = false` in the cleanup block if a terminal event was seen. If the stream ended without one and the session is still active, attempt a reconnect instead.

```typescript
let receivedTerminal = false;

// In handleSSEEvent, set receivedTerminal = true on result/done/error/aborted
// ...

// Cleanup block:
const e = _connections.get(serverKey);
if (e) {
  e.sseAbortController = null;
  if (receivedTerminal) {
    // agent genuinely finished — streaming already set false by event handler
  } else {
    // unexpected drop — don't clear streaming; attempt reconnect
    if (e.currentSessionId && !controller.signal.aborted) {
      void openSSEStream(serverKey, e.currentSessionId); // reconnect
    } else {
      e.streaming = false;
      notifyListeners(serverKey);
    }
  }
}
```

**Severity:** High

**Priority:** P0

---

## 9. Permission Mode Change Silently Discards Pending Permission Cards

**Location:** `store/connection-store.ts` — `patchSessionPermissionModeStore` (lines ~766–790)

**Bug:** When the user switches to "Allow all edits" or "YOLO" from the mode sheet in `chat.tsx`, pending permission cards are cleared from both `entry.permissionQueue` and `_permissionsSSE` optimistically and synchronously — before the PATCH request reaches the server. No explicit approval or denial is sent for the discarded items.

**What happens:**
- `entry.permissionQueue = []` drops any queued per-session permission items silently.
- `pEntry.permissions = []` + `notifyPermissionsListeners()` causes `chat.tsx` and `perms.tsx` to re-render immediately, removing the permission card from the UI.
- The PATCH `{ permissionMode }` is sent to the server *after* the UI clears.
- If the server auto-resolves pending permissions when the mode changes, this works. If the server only applies the new mode to *future* requests and still waits on the current one, the agent is silently stuck with no way for the user to recover (they can no longer see or respond to the pending item).
- If the PATCH fails (network error, server error), the client is in "allow-all" mode locally but the server is still in "ask-permissions" mode — and the pending permission the user never responded to is gone from the UI.

**Conditions that trigger it:**
- User has a pending permission card visible on screen.
- User opens the mode sheet and selects "Allow all edits" or "YOLO".

**Observed symptom:** Permission card disappears without user explicitly approving or denying. Agent may appear stuck if server doesn't auto-resolve pending items on mode change.

**Recommended Fix:**
Option A — Send explicit approvals for all pending items before clearing:
```typescript
// Before clearing queues, approve all pending global permissions
if (permissionMode !== 'ask-permissions' && pEntry) {
  for (const p of pEntry.permissions) {
    void respondGlobalPermission(serverUrl, p.sessionId, p.toolUseID, true);
  }
}
```
Option B — Don't clear the queues client-side at all; let the server's SSE `permissions` event push an empty list after it processes the mode change. Only apply optimistic clear after the PATCH 200s.

**Severity:** Medium

**Priority:** P1

---

## Summary

| Issue | Severity | Priority |
|-------|----------|----------|
| SSE Stream State on App State Changes | High | P0 |
| SSE Stream Drop Clears `streaming` Mid-Session | High | P0 |
| Race Condition in Agent Selection | Medium | P1 |
| No Agent Context Persistence | Medium | P1 |
| Session Initialization Without Validation | Medium | P1 |
| Missing Agent Session Affinity | Medium | P1 |
| Permission Mode Change Silently Discards Pending Permissions | Medium | P1 |
| Inconsistent iPad vs iPhone Flow | Low | P2 |
| No Error Boundary for Agent Selection | Low | P2 |