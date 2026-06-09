import { apiRequest } from "./client";

export type CodexStartResponse = {
  success: boolean;
  alreadyAuthenticated?: boolean;
  sessionId?: string;
  authUrl?: string;
  cmdId?: string;
};

export type CodexCompleteResponse = {
  success: boolean;
  message: string;
};

export type CodexStatusResponse = {
  success: boolean;
  connected: boolean;
  authenticatedAt: string | null;
};

export type CodexDisconnectResponse = {
  success: boolean;
  message: string;
};

export function codexStatus(token: string) {
  return apiRequest<CodexStatusResponse>("/codex/status", {
    method: "GET",
    token,
  });
}

export function codexStart(token: string) {
  return apiRequest<CodexStartResponse>("/codex/start", {
    method: "POST",
    token,
  });
}

export function codexComplete(
  token: string,
  body: { authCode: string; sessionId: string; cmdId: string },
) {
  return apiRequest<CodexCompleteResponse>("/codex/complete", {
    method: "POST",
    token,
    body,
  });
}

export function codexDisconnect(token: string) {
  return apiRequest<CodexDisconnectResponse>("/codex/disconnect", {
    method: "POST",
    token,
  });
}
