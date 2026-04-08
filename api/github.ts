import { apiRequest } from "./client";

export type GithubOAuthStartResponse = {
  success: boolean;
  url: string;
};

export type GithubOAuthStatusResponse = {
  success: boolean;
  connected: boolean;
  githubLogin: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
};

export type GithubOAuthDisconnectResponse = {
  success: boolean;
  message: string;
};

export type GithubRepo = {
  id: string | number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
};

export type GithubReposResponse = {
  success: boolean;
  repos: GithubRepo[];
};

export type GithubCloneResponse = {
  success: boolean;
  message: string;
  repoFullName: string;
  targetDir: string;
};

export type GithubStatusResponse = {
  success: boolean;
  status: string;
};

export type GithubPullResponse = {
  success: boolean;
  message: string;
  output: string;
};

export type GithubPushResponse = {
  success: boolean;
  message: string;
  output: string;
};

export type GithubVerifyResponse = {
  success: boolean;
  connected: boolean;
  vmConfigured: boolean;
  details: {
    helper: string | null;
    credentialsFileExists: boolean;
    hasGithubEntry: boolean;
    gitUserName: string | null;
    gitUserEmail: string | null;
  };
};

export function githubOauthStart(token: string, redirectUri?: string) {
  return apiRequest<GithubOAuthStartResponse>("/api/github/oauth/start", {
    method: "POST",
    token,
    body: redirectUri ? { redirectUri } : undefined,
  });
}

export function githubOauthStatus(token: string) {
  return apiRequest<GithubOAuthStatusResponse>("/api/github/oauth/status", {
    method: "GET",
    token,
  });
}

export function githubOauthDisconnect(token: string) {
  return apiRequest<GithubOAuthDisconnectResponse>("/api/github/oauth/disconnect", {
    method: "POST",
    token,
  });
}

export function githubVerifyVmAuth(token: string) {
  return apiRequest<GithubVerifyResponse>("/api/github/verify", {
    method: "GET",
    token,
  });
}

export function githubListRepos(token: string) {
  return apiRequest<GithubReposResponse>("/api/github/repos", {
    method: "GET",
    token,
  });
}

export function githubCloneRepo(
  token: string,
  body: { repoFullName: string; branch?: string; targetDir?: string }
) {
  return apiRequest<GithubCloneResponse>("/api/github/clone", {
    method: "POST",
    token,
    body,
  });
}

export function githubRepoStatus(token: string, body: { repoPath: string }) {
  return apiRequest<GithubStatusResponse>("/api/github/status", {
    method: "POST",
    token,
    body,
  });
}

export function githubPullRepo(token: string, body: { repoPath: string; branch?: string }) {
  return apiRequest<GithubPullResponse>("/api/github/pull", {
    method: "POST",
    token,
    body,
  });
}

export function githubPushRepo(
  token: string,
  body: {
    repoPath: string;
    branch: string;
    commitMessage: string;
    authorName?: string;
    authorEmail?: string;
  }
) {
  return apiRequest<GithubPushResponse>("/api/github/push", {
    method: "POST",
    token,
    body,
  });
}
