import { useState, useEffect, useCallback } from 'react';
import {
  openConnection,
  subscribeToConnection,
  getEntry,
  sendMessageStore,
  abortStore,
  respondPermissionStore,
  listSessionsStore,
  initSessionStore,
  listReposStore,
  listDirStore,
  readFileStore,
  getSessionConfigStore,
  patchSessionPermissionModeStore,
} from '@/store/connection-store';

// Re-export types so existing importers keep working
export type { Message, PermissionItem, Session, Repo, DirEntry, FileContentResult, RepoDetails, PermissionMode, SessionConfig } from '@/store/connection-store';

export interface UseServerResult {
  // connected: boolean;      // TODO: revisit connection health indicators
  // reconnecting: boolean;   // TODO: revisit connection health indicators
  sessionLoading: boolean;
  streaming: boolean;
  messages: import('@/store/connection-store').Message[];
  activity: { label: string } | null;
  permissionQueue: import('@/store/connection-store').PermissionItem[];
  sessionId: string | null;       // session ID set from POST /chat response
  sdkSessionId: string | null;    // SDK session ID (from SSE system event)
  grassId: string | null;         // GRASS UUID (from POST /chat response)
  sessionsList: import('@/store/connection-store').Session[];
  repos: import('@/store/connection-store').Repo[];
  repoDetails: Map<string, import('@/store/connection-store').RepoDetails>;
  permissionMode: import('@/store/connection-store').PermissionMode;
  send: (text: string, model?: string, mode?: 'plan' | 'build', permissionMode?: import('@/store/connection-store').PermissionMode, attachments?: string[]) => void;
  abort: () => void;
  respondPermission: (approved: boolean) => void;
  listSessions: (repoPath?: string, agent?: string) => void;
  initSession: (id: string | null, agent?: string | null, repoPath?: string | null, resumeLatest?: boolean) => void;
  listRepos: () => void;
  dirListing: import('@/store/connection-store').DirEntry[] | null;
  fileContent: import('@/store/connection-store').FileContentResult | null;
  listDir: (path: string, repoPath: string) => void;
  readFile: (path: string, repoPath: string) => void;
  getSessionConfig: (sessionId: string) => Promise<import('@/store/connection-store').SessionConfig | null>;
  patchPermissionMode: (sessionId: string | null, mode: import('@/store/connection-store').PermissionMode) => Promise<void>;
}

export function useServer(serverUrl: string | null): UseServerResult {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!serverUrl) return;
    openConnection(serverUrl);
    return subscribeToConnection(serverUrl, () => forceUpdate(n => n + 1));
  }, [serverUrl]);

  const entry = serverUrl ? getEntry(serverUrl) : null;

  const send             = useCallback((text: string, model?: string, mode?: 'plan' | 'build', permissionMode?: import('@/store/connection-store').PermissionMode, attachments?: string[]) => { if (serverUrl) sendMessageStore(serverUrl, text, model, mode, permissionMode, attachments); }, [serverUrl]);
  const abort            = useCallback(() => { if (serverUrl) abortStore(serverUrl); }, [serverUrl]);
  const respondPerm      = useCallback((ok: boolean) => { if (serverUrl) respondPermissionStore(serverUrl, ok); }, [serverUrl]);
  const listSess         = useCallback((repoPath?: string, agent?: string) => { if (serverUrl) listSessionsStore(serverUrl, repoPath, agent); }, [serverUrl]);
  const initSess         = useCallback((id: string | null, agent?: string | null, rp?: string | null, resumeLatest?: boolean) => { if (serverUrl) initSessionStore(serverUrl, id, agent, rp, resumeLatest); }, [serverUrl]);
  const listRepos        = useCallback(() => { if (serverUrl) listReposStore(serverUrl); }, [serverUrl]);
  const listDir          = useCallback((path: string, repoPath: string) => { if (serverUrl) listDirStore(serverUrl, path, repoPath); }, [serverUrl]);
  const readFile         = useCallback((path: string, repoPath: string) => { if (serverUrl) readFileStore(serverUrl, path, repoPath); }, [serverUrl]);
  const getSessionConfig = useCallback((sessionId: string) => serverUrl ? getSessionConfigStore(serverUrl, sessionId) : Promise.resolve(null), [serverUrl]);
  const patchPermMode    = useCallback((sessionId: string, mode: import('@/store/connection-store').PermissionMode) => serverUrl ? patchSessionPermissionModeStore(serverUrl, sessionId, mode) : Promise.resolve(), [serverUrl]);

  return {
    // connected:       false,        // TODO: revisit connection health indicators
    // reconnecting:    false,        // TODO: revisit connection health indicators
    sessionLoading:  entry?.sessionLoading  ?? false,
    streaming:       entry?.streaming       ?? false,
    messages:        entry?.messages        ?? [],
    activity:        entry?.activity        ?? null,
    permissionQueue: entry?.permissionQueue ?? [],
    sessionId:       entry?.sessionId       ?? null,
    sdkSessionId:    entry?.sdkSessionId    ?? null,
    grassId:         entry?.currentSessionId ?? null,
    sessionsList:    entry?.sessionsList    ?? [],
    repos:           entry?.repos           ?? [],
    repoDetails:     entry?.repoDetails     ?? new Map(),
    permissionMode:  entry?.permissionMode  ?? 'ask-permissions',
    dirListing:      entry?.dirListing      ?? null,
    fileContent:     entry?.fileContent     ?? null,
    send,
    abort,
    respondPermission: respondPerm,
    listSessions: listSess,
    initSession: initSess,
    listRepos,
    listDir,
    readFile,
    getSessionConfig,
    patchPermissionMode: patchPermMode,
  };
}

// Backwards-compat alias so existing screens can migrate one at a time
export function useWebSocket(serverUrl: string | null): UseServerResult & { connected: boolean; reconnecting: boolean; cwd: string | null; selectRepo: (path: string) => void; selectAgent: (agent: string) => void } {
  const base = useServer(serverUrl);
  return {
    ...base,
    connected: false,       // TODO: revisit connection health indicators
    reconnecting: false,    // TODO: revisit connection health indicators
    cwd: null,              // no push equivalent in REST API
    selectRepo: (_path: string) => { /* local state only — pass via routing params */ },
    selectAgent: (_agent: string) => { /* local state only — pass via routing params */ },
  };
}
