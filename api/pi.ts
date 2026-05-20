import { apiRequest } from "./client";

export type PiStatusResponse = {
  success: boolean;
  connected: boolean;
  authenticatedAt: string | null;
};

export type PiOAuthInitResponse = {
  success: boolean;
  sessionId?: string;
  authUrl?: string;
};

export type PiOAuthExchangeResponse = {
  success: boolean;
  message: string;
  authJson?: Record<string, unknown>;
};

export type PiDisconnectResponse = {
  success: boolean;
  message: string;
};

export function piStatus(token: string) {
  return apiRequest<PiStatusResponse>("/pi/status", {
    method: "GET",
    token,
  });
}

export function piOAuthInit(token: string) {
  return apiRequest<PiOAuthInitResponse>("/pi/oauth/init", {
    method: "POST",
    token,
  });
}

export function piOAuthExchange(
  token: string,
  body: { code: string; state: string },
) {
  return apiRequest<PiOAuthExchangeResponse>("/pi/oauth/exchange", {
    method: "POST",
    token,
    body,
  });
}

export function piDisconnect(token: string) {
  return apiRequest<PiDisconnectResponse>("/pi/disconnect", {
    method: "POST",
    token,
  });
}
