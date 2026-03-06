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

## Summary

| Issue | Severity | Priority |
|-------|----------|----------|
| SSE Stream State on App State Changes | High | P0 |
| Race Condition in Agent Selection | Medium | P1 |
| No Agent Context Persistence | Medium | P1 |
| Session Initialization Without Validation | Medium | P1 |
| Missing Agent Session Affinity | Medium | P1 |
| Inconsistent iPad vs iPhone Flow | Low | P2 |
| No Error Boundary for Agent Selection | Low | P2 |