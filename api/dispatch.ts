import { apiRequest } from "./client";

export type DispatchSessionDTO = {
  id: string;
  repo: string;
  repoPath: string;
  serverUrl: string;
  title: string;
  sessionId: string | null;
  createdAt: string;
};

// API wraps payload under `data` via formatResponse: { data: { sessions }, success, message, code }
type FetchSessionsResponse = {
  data: { sessions: DispatchSessionDTO[] };
  success: boolean;
};

export function fetchDispatchSessions(authToken: string) {
  return apiRequest<FetchSessionsResponse>("/dispatch/sessions", {
    method: "GET",
    token: authToken,
  });
}

export function ackDispatchSessions(ids: string[], authToken: string) {
  return apiRequest("/dispatch/sessions/ack", {
    method: "POST",
    body: { ids },
    token: authToken,
  });
}
