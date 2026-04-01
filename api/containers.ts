import { apiRequest } from "./client";

export type RequestContainerResponse = {
  success: boolean;
  message: string;
  sandboxId: string | null;
  url: string;
};

export type HeartbeatResponse = {
  container: "running" | "stopped" | "not found" | "provisioning";
  grass: boolean;
};

export function requestContainer(token: string) {
  return apiRequest<RequestContainerResponse>("/api/containers/request", {
    method: "POST",
    token,
  });
}

export function heartbeat(token: string) {
  return apiRequest<HeartbeatResponse>("/api/containers/heartbeat", {
    method: "GET",
    token,
  });
}
