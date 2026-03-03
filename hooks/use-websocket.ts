import { useState, useEffect, useCallback } from 'react';
import {
  openConnection,
  subscribeToConnection,
  getEntry,
  sendMessage,
  abortConnection,
  respondPermissionStore,
  listSessionsStore,
  initSessionStore,
  listReposStore,
  selectRepoStore,
  selectAgentStore,
  listDirStore,
  readFileStore,
} from '@/store/connection-store';

// Re-export types so existing importers keep working
export type { Message, PermissionItem, Session, Repo, DirEntry, FileContentResult } from '@/store/connection-store';

export interface UseWebSocketResult {
  connected: boolean;
  reconnecting: boolean;
  streaming: boolean;
  messages: import('@/store/connection-store').Message[];
  activity: { label: string } | null;
  permissionQueue: import('@/store/connection-store').PermissionItem[];
  sessionId: string | null;
  sessionsList: import('@/store/connection-store').Session[];
  cwd: string | null;
  repos: import('@/store/connection-store').Repo[];
  send: (text: string) => void;
  abort: () => void;
  respondPermission: (approved: boolean) => void;
  listSessions: () => void;
  initSession: (id: string | null) => void;
  listRepos: () => void;
  selectRepo: (path: string) => void;
  selectAgent: (agent: string) => void;
  dirListing: import('@/store/connection-store').DirEntry[] | null;
  fileContent: import('@/store/connection-store').FileContentResult | null;
  listDir: (path?: string) => void;
  readFile: (path: string) => void;
}

export function useWebSocket(wsUrl: string | null): UseWebSocketResult {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!wsUrl) return;
    openConnection(wsUrl);
    return subscribeToConnection(wsUrl, () => forceUpdate(n => n + 1));
  }, [wsUrl]);

  const entry = wsUrl ? getEntry(wsUrl) : null;

  const send        = useCallback((text: string) => { if (wsUrl) sendMessage(wsUrl, text); }, [wsUrl]);
  const abort       = useCallback(() => { if (wsUrl) abortConnection(wsUrl); }, [wsUrl]);
  const respondPerm = useCallback((ok: boolean) => { if (wsUrl) respondPermissionStore(wsUrl, ok); }, [wsUrl]);
  const listSess    = useCallback(() => { if (wsUrl) listSessionsStore(wsUrl); }, [wsUrl]);
  const initSess    = useCallback((id: string | null) => { if (wsUrl) initSessionStore(wsUrl, id); }, [wsUrl]);
  const listRepos   = useCallback(() => { if (wsUrl) listReposStore(wsUrl); }, [wsUrl]);
  const selectRepo  = useCallback((path: string) => { if (wsUrl) selectRepoStore(wsUrl, path); }, [wsUrl]);
  const selectAgent = useCallback((agent: string) => { if (wsUrl) selectAgentStore(wsUrl, agent); }, [wsUrl]);
  const listDir     = useCallback((path?: string) => { if (wsUrl) listDirStore(wsUrl, path); }, [wsUrl]);
  const readFile    = useCallback((path: string)  => { if (wsUrl) readFileStore(wsUrl, path); }, [wsUrl]);

  return {
    connected:       entry?.connected       ?? false,
    reconnecting:    entry?.reconnecting    ?? false,
    streaming:       entry?.streaming       ?? false,
    messages:        entry?.messages        ?? [],
    activity:        entry?.activity        ?? null,
    permissionQueue: entry?.permissionQueue ?? [],
    sessionId:       entry?.sessionId       ?? null,
    sessionsList:    entry?.sessionsList    ?? [],
    cwd:             entry?.cwd             ?? null,
    repos:           entry?.repos           ?? [],
    dirListing:      entry?.dirListing      ?? null,
    fileContent:     entry?.fileContent     ?? null,
    send,
    abort,
    respondPermission: respondPerm,
    listSessions: listSess,
    initSession: initSess,
    listRepos,
    selectRepo,
    selectAgent,
    listDir,
    readFile,
  };
}
