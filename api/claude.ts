import { apiRequest } from "./client";

export type ClaudeStartResponse = {
  success: boolean;
  alreadyAuthenticated?: boolean;
  sessionId?: string;
  authUrl?: string;
  cmdId?: string;
};

export type ClaudeCompleteResponse = {
  success: boolean;
  message: string;
};

export type ClaudeStatusResponse = {
  success: boolean;
  connected: boolean;
  authenticatedAt: string | null;
};

export type ClaudeDisconnectResponse = {
  success: boolean;
  message: string;
};

export function claudeStatus(token: string) {
  return apiRequest<ClaudeStatusResponse>("/api/claude/status", {
    method: "GET",
    token,
  });
}

export function claudeStart(token: string) {
  return apiRequest<ClaudeStartResponse>("/api/claude/start", {
    method: "POST",
    token,
  });
}

export function claudeComplete(
  token: string,
  body: { authCode: string; sessionId: string; cmdId: string },
) {
  return apiRequest<ClaudeCompleteResponse>("/api/claude/complete", {
    method: "POST",
    token,
    body,
  });
}

export function claudeDisconnect(token: string) {
  return apiRequest<ClaudeDisconnectResponse>("/api/claude/disconnect", {
    method: "POST",
    token,
  });
}
