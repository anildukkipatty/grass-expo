# Relay Migration — Expo App Changes

## Background

A relay server has been built at `/pingpong/relay/`. It allows the GRASS server to connect
outbound to the relay via WebSocket, bypassing firewall restrictions. The iOS app talks to the
relay over standard HTTP/SSE — from the app's perspective it is just a different server URL.

The GRASS CLI now supports `grass start -r ws://relay.example.com` which:
1. Dials the relay WebSocket at `ws://relay.example.com/grass-connect`
2. Receives a session token from the relay
3. Prints a QR code with the app-facing URL: `http://relay.example.com/s/<token>`

The app scans that QR code and uses the relay URL exactly as it would a direct server URL.

---

## Core principle

**The app requires zero protocol changes.** The relay speaks the same REST + SSE protocol as
the GRASS server. Every existing fetch call, SSE stream, and route path works unchanged.
The relay URL (`http://relay.example.com/s/<token>`) is stored and used as `serverUrl`
throughout the app — no special casing for relay vs direct.

---

## What changes in the app

### 1. `store/url-store.ts` — saveUrl deduplication

**Current behaviour:** `saveUrl(url)` dedupes by exact string match. If the user scans a new
relay QR (new token, same relay host), a second entry is added to the list because the token
changed.

**Required change:** No code change needed. Token rotation requires a manual re-scan by
design — the user re-scans, the new URL is added to the list, and the old dead entry can be
manually removed. This is the accepted UX trade-off.

**No changes to:** `saveVmUrl`, `getPrimaryVmUrl`, `resolveServerKey`, `resolveServerUrl`,
`GRASS_VM_KEY`. Relay URLs are NOT VM URLs and do not interact with any VM URL infrastructure.

---

### 2. `store/url-store.ts` — relay URL detection helper (new)

Add a utility function that identifies whether a stored URL is a relay URL. This is used only
for display purposes (see section 4).

```typescript
// Returns true if the URL looks like a relay session URL: /s/<token>
export function isRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^\/s\/[^/]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

// Extracts the relay base host for display (e.g. "relay.example.com")
export function relayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
```

---

### 3. `store/connection-store.ts` — no changes

All fetch calls use `entry.baseUrl` which is set from `serverUrl`. Since the relay URL
(`http://relay.example.com/s/<token>`) is just a base URL, every path appended to it
(`/health`, `/sessions`, `/chat`, `/events`, `/repos`, etc.) correctly becomes
`http://relay.example.com/s/<token>/health` etc., which the relay routes to GRASS.

The SSE stream, permission polling, and all other logic are unchanged.

---

### 4. Home screen server list — display label for relay URLs (cosmetic, optional)

The home screen currently shows the raw server URL as the label for each server entry.
For relay URLs like `http://relay.example.com/s/abc123XYZ...` this is ugly.

**Suggested change:** In whatever component renders the server list on the home screen,
use `isRelayUrl(url)` to detect relay entries and display `relayHost(url) + " (relay)"`
instead of the full URL.

This is cosmetic only and can be deferred. The app functions correctly without it.

---

### 5. QR scan flow — no changes

The QR scanner in the app saves any scanned URL via `saveUrl()`. The relay QR emits
`http://relay.example.com/s/<token>` — this is already an `http://` URL and is handled
identically to a direct server QR. No changes needed.

---

### 6. Version compatibility check — works as-is

The version compat check hits `GET /health` on the server URL. Through the relay this
becomes `GET /s/<token>/health` → relay forwards to GRASS → returns the real GRASS health
payload including `serverVersion` and `clientVersionRange`. The existing compat logic in
`store/version-compat.ts` works without changes.

---

## Token rotation behaviour

When the GRASS server disconnects from the relay and reconnects, the relay issues a **new
token**. The old relay URL (`/s/<old-token>`) becomes permanently dead — the relay returns
404 for it.

**In the app this means:**
- Any active SSE stream dies (the relay closes it with `event: error`)
- The `connection-store` entry for the old URL goes into an error/disconnected state
- The user must re-scan the new QR printed by the GRASS server
- The new URL is saved as a new entry in the server list
- The old dead entry remains in the list until the user manually removes it

This is intentional. No automatic token refresh logic is needed in the app.

---

## Relay wire protocol (for reference, no app changes needed)

The relay and GRASS communicate over WebSocket using these frame types. The app never sees
these — it only sees standard HTTP/SSE responses.

```
// Relay → GRASS
{ type: "token", token: string }
{ requestId: string, type: "request", method, path, headers, body }

// GRASS → Relay
{ requestId: string, type: "response_start", statusCode, headers }
{ requestId: string, type: "data", chunk: string }
{ requestId: string, type: "end" }
{ requestId: string, type: "error", message: string }
```

---

## Files changed summary

| File | Change |
|---|---|
| `store/url-store.ts` | Add `isRelayUrl()` and `relayHost()` helpers |
| Home screen server list component | Use helpers to display friendly relay label (optional/cosmetic) |
| Everything else | No changes |

---

## Relay server location

`/Users/korgy/start/hot/pingpong/relay/`

Run with: `npm run dev` (port 4000 by default, override with `PORT=xxxx`)

GRASS connects with: `grass start -r ws://localhost:4000`

App scans QR printed by GRASS: `http://localhost:4000/s/<token>`
