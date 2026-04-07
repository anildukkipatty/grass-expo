import { apiRequest } from "./client";

export type OpencodeStatusResponse = {
  success: boolean;
  connected: boolean;
  authenticatedAt: string | null;
};

export type OpencodeConnectResponse = {
  success: boolean;
  alreadyAuthenticated?: boolean;
  message: string;
};

export type OpencodeDisconnectResponse = {
  success: boolean;
  message: string;
};

export function opencodeStatus(token: string) {
  return apiRequest<OpencodeStatusResponse>("/api/opencode/status", {
    method: "GET",
    token,
  });
}

export function opencodeConnect(token: string, body: { apiKey: string }) {
  return apiRequest<OpencodeConnectResponse>("/api/opencode/connect", {
    method: "POST",
    token,
    body,
  });
}

export function opencodeDisconnect(token: string) {
  return apiRequest<OpencodeDisconnectResponse>("/api/opencode/disconnect", {
    method: "POST",
    token,
  });
}
