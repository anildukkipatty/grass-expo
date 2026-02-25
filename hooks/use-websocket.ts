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
} from '@/store/connection-store';

// Re-export types so existing importers keep working
export type { Message, PermissionItem, Session } from '@/store/connection-store';

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
  send: (text: string) => void;
  abort: () => void;
  respondPermission: (approved: boolean) => void;
  listSessions: () => void;
  initSession: (id: string | null) => void;
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
    send,
    abort,
    respondPermission: respondPerm,
    listSessions: listSess,
    initSession: initSess,
  };
}
