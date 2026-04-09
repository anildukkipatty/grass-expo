import { apiRequest } from "./client";

export type RequestContainerResponse = {
  success: boolean;
  message: string;
  sandboxId: string | null;
  url: string;
  demoRepoReady?: boolean;
};

export type HeartbeatResponse = {
  container: "running" | "stopped" | "not found" | "provisioning";
  grass: boolean;
  url?: string;
};

export type SignedPreviewUrlResponse = {
  success: boolean;
  message: string;
  url: string;
};

export function requestContainer(token: string) {
  return apiRequest<RequestContainerResponse>("/containers/request", {
    method: "POST",
    token,
  });
}

export function heartbeat(token: string) {
  return apiRequest<HeartbeatResponse>("/containers/heartbeat", {
    method: "GET",
    token,
  });
}

export function signedPreviewUrl(token: string) {
  return apiRequest<SignedPreviewUrlResponse>("/containers/signed-preview-url", {
    method: "POST",
    token,
  });
}
