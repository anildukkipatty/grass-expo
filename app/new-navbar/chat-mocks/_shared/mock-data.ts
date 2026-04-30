import type { MockConversation } from "./mock-types";

export const mockConversation: MockConversation = {
  repoName: "pingpong-api",
  repoPath: "/Users/anil/code/pingpong-api",
  branch: "feat/jwt-auth",
  agent: "claude-code",
  modelLabel: "Sonnet 4.6",
  sessionTitle: "Refactor auth middleware",
  streaming: true,
  messages: [
    {
      id: "m1",
      role: "user",
      content:
        "refactor the auth middleware to use JWT instead of sessions. keep it backwards compatible for the next 2 weeks.",
    },
    {
      id: "m2",
      role: "tool",
      tool: "read",
      label: "src/middleware/auth.ts",
    },
    {
      id: "m3",
      role: "tool",
      tool: "grep",
      label: '"session" in src/',
    },
    {
      id: "m4",
      role: "assistant",
      content: `I'll migrate the middleware in three steps and gate JWT behind a feature flag so we can roll back instantly.

### Plan
1. Add a \`verifyJwt\` helper alongside the existing \`verifySession\`.
2. Switch the middleware to try JWT first, fall back to session cookies for the next 2 weeks.
3. Update \`User\` types so \`req.user\` carries the token \`sub\` instead of a session row.

The new middleware signature looks like:
\`\`\`ts
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (token) return verifyJwt(token, req, next);
  return verifySession(req, res, next);
}
\`\`\``,
    },
    {
      id: "m5",
      role: "tool",
      tool: "edit",
      label: "src/middleware/auth.ts",
    },
    {
      id: "m6",
      role: "tool",
      tool: "edit",
      label: "src/types/user.ts",
    },
    {
      id: "m7",
      role: "permission",
      toolName: "Bash",
      command: "npm install jsonwebtoken @types/jsonwebtoken",
    },
    {
      id: "m8",
      role: "user",
      content: "yeah go ahead. also add refresh token logic while you're in there.",
    },
    {
      id: "m9",
      role: "assistant",
      content: `Approved — installed and wired up. Here's how the two strategies compare:

| Aspect | Sessions | JWT |
| --- | --- | --- |
| Storage | Server-side row | Stateless |
| Revocation | Instant | Refresh-token rotation |
| Mobile | Cookie quirks | Trivial |

I'll add a **refresh token** stored in an httpOnly cookie, with a 7-day TTL and rotation on every refresh.`,
    },
    {
      id: "m10",
      role: "tool",
      tool: "write",
      label: "src/middleware/refresh.ts",
    },
    {
      id: "m11",
      role: "tool",
      tool: "bash",
      label: "npm test -- auth",
    },
    {
      id: "m12",
      role: "assistant",
      content: `All 14 auth tests pass. Next steps when you're ready:

- Hook \`/auth/refresh\` into the router.
- Update the mobile client to read \`Authorization: Bearer\`.
- Decide on a deprecation date for the session fallback.`,
    },
  ],
};
