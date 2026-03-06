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
} from '@/store/connection-store';

// Re-export types so existing importers keep working
export type { Message, PermissionItem, Session, Repo, DirEntry, FileContentResult } from '@/store/connection-store';

export interface UseServerResult {
  // connected: boolean;      // TODO: revisit connection health indicators
  // reconnecting: boolean;   // TODO: revisit connection health indicators
  streaming: boolean;
  messages: import('@/store/connection-store').Message[];
  activity: { label: string } | null;
  permissionQueue: import('@/store/connection-store').PermissionItem[];
  sessionId: string | null;
  sessionsList: import('@/store/connection-store').Session[];
  repos: import('@/store/connection-store').Repo[];
  send: (text: string) => void;
  abort: () => void;
  respondPermission: (approved: boolean) => void;
  listSessions: (repoPath?: string, agent?: string) => void;
  initSession: (id: string | null, agent?: string | null, repoPath?: string | null) => void;
  listRepos: () => void;
  dirListing: import('@/store/connection-store').DirEntry[] | null;
  fileContent: import('@/store/connection-store').FileContentResult | null;
  listDir: (path: string, repoPath: string) => void;
  readFile: (path: string, repoPath: string) => void;
}

export function useServer(serverUrl: string | null): UseServerResult {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!serverUrl) return;
    openConnection(serverUrl);
    return subscribeToConnection(serverUrl, () => forceUpdate(n => n + 1));
  }, [serverUrl]);

  const entry = serverUrl ? getEntry(serverUrl) : null;

  const send        = useCallback((text: string) => { if (serverUrl) sendMessageStore(serverUrl, text); }, [serverUrl]);
  const abort       = useCallback(() => { if (serverUrl) abortStore(serverUrl); }, [serverUrl]);
  const respondPerm = useCallback((ok: boolean) => { if (serverUrl) respondPermissionStore(serverUrl, ok); }, [serverUrl]);
  const listSess    = useCallback((repoPath?: string, agent?: string) => { if (serverUrl) listSessionsStore(serverUrl, repoPath, agent); }, [serverUrl]);
  const initSess    = useCallback((id: string | null, agent?: string | null, rp?: string | null) => { if (serverUrl) initSessionStore(serverUrl, id, agent, rp); }, [serverUrl]);
  const listRepos   = useCallback(() => { if (serverUrl) listReposStore(serverUrl); }, [serverUrl]);
  const listDir     = useCallback((path: string, repoPath: string) => { if (serverUrl) listDirStore(serverUrl, path, repoPath); }, [serverUrl]);
  const readFile    = useCallback((path: string, repoPath: string) => { if (serverUrl) readFileStore(serverUrl, path, repoPath); }, [serverUrl]);

  return {
    // connected:       false,        // TODO: revisit connection health indicators
    // reconnecting:    false,        // TODO: revisit connection health indicators
    streaming:       entry?.streaming       ?? false,
    messages:        entry?.messages        ?? [],
    activity:        entry?.activity        ?? null,
    permissionQueue: entry?.permissionQueue ?? [],
    sessionId:       entry?.sessionId       ?? null,
    sessionsList:    entry?.sessionsList    ?? [],
    repos:           entry?.repos           ?? [],
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
