import { useState, useEffect, useRef, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  complete: boolean;
  /** Stable unique key for FlatList — never reused, never index-based */
  msgId: string;
  /** Server-assigned stream id used only for matching streaming updates */
  wsId?: string;
  badge?: string;
}

export interface PermissionItem {
  toolUseID: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface Session {
  id: string;
  label?: string;
  preview?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface UseWebSocketResult {
  connected: boolean;
  reconnecting: boolean;
  streaming: boolean;
  messages: Message[];
  activity: { label: string } | null;
  permissionQueue: PermissionItem[];
  sessionId: string | null;
  sessionsList: Session[];
  send: (text: string) => void;
  abort: () => void;
  respondPermission: (approved: boolean) => void;
  listSessions: () => void;
  initSession: (id: string | null) => void;
}

export function useWebSocket(wsUrl: string | null): UseWebSocketResult {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<{ label: string } | null>(null);
  const [permissionQueue, setPermissionQueue] = useState<PermissionItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionsList, setSessionsList] = useState<Session[]>([]);


  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const currentSessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const msgCounterRef = useRef(0);

  function nextMsgId(): string {
    return 'm' + (++msgCounterRef.current);
  }

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
  }, []);

  const startPing = useCallback((ws: WebSocket) => {
    stopPing();
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        pongTimeoutRef.current = setTimeout(() => {
          ws.close();
        }, 5000);
      }
    }, 30000);
  }, [stopPing]);

  useEffect(() => {
    mountedRef.current = true;
    if (!wsUrl) return;

    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (connectTimeout) clearTimeout(connectTimeout);

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl!);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      connectTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, 5000);

      ws.onopen = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        if (!mountedRef.current) { ws.close(); return; }
        setConnected(true);
        setReconnecting(false);
        reconnectDelayRef.current = 1000;
        startPing(ws);
        ws.send(JSON.stringify({ type: 'list_sessions' }));
        const sid = currentSessionIdRef.current;
        if (sid) {
          ws.send(JSON.stringify({ type: 'init', sessionId: sid }));
        }
      };

      ws.onclose = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        if (!mountedRef.current) return;
        setConnected(false);
        setPermissionQueue([]);
        stopPing();
        scheduleReconnect();
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(event.data as string);
        } catch {
          return;
        }

        if (data.type === 'pong') {
          if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
          return;
        }

        if (data.type === 'sessions_list') {
          setSessionsList((data.sessions as Session[]) || []);
          return;
        }

        if (data.type === 'session_status') {
          setStreaming(data.streaming as boolean);
          if (data.streaming) {
            setActivity({ label: 'Working...' });
          }
          return;
        }

        if (data.type === 'permission_request') {
          setPermissionQueue(prev => {
            if (prev.some(p => p.toolUseID === data.toolUseID)) return prev;
            return [...prev, {
              toolUseID: data.toolUseID as string,
              toolName: data.toolName as string,
              input: (data.input as Record<string, unknown>) || {},
            }];
          });
          return;
        }

        if (data.type === 'system' && data.subtype === 'init') {
          const d = data.data as Record<string, unknown> | undefined;
          if (d?.session_id) {
            const sid = d.session_id as string;
            currentSessionIdRef.current = sid;
            setSessionId(sid);
          }
          return;
        }

        if (data.type === 'history') {
          const msgs = (data.messages as Array<{ role: string; content: string }>) || [];
          setMessages(msgs.map((m) => ({
            role: m.role as Message['role'],
            content: m.content,
            complete: true,
            msgId: nextMsgId(),
          })));
          return;
        }

        if (data.type === 'assistant') {
          setActivity(null);
          const wsId = data.id as string;
          const content = data.content as string;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.complete && last.wsId === wsId) {
              return [...prev.slice(0, -1), { ...last, content }];
            }
            return [...prev, { role: 'assistant', content, complete: false, msgId: nextMsgId(), wsId }];
          });
        } else if (data.type === 'status') {
          const status = data.status as string;
          if (status === 'thinking') {
            setActivity({ label: 'Thinking' });
          } else if (status === 'tool') {
            const elapsed = data.elapsed != null ? Math.round(data.elapsed as number) + 's' : '';
            setActivity({ label: (data.tool_name as string) + (elapsed ? ' (' + elapsed + ')' : '') });
          } else if (status === 'tool_summary') {
            setActivity({ label: data.summary as string });
          } else {
            setActivity(null);
          }
        } else if (data.type === 'tool_use') {
          setActivity({ label: (data.tool_name as string) + ': ' + (data.tool_input as string) });
        } else if (data.type === 'result') {
          setStreaming(false);
          setActivity(null);
          setMessages(prev => {
            const cost = data.cost != null ? '$' + (data.cost as number).toFixed(4) : null;
            const duration = data.duration_ms != null ? ((data.duration_ms as number) / 1000).toFixed(1) + 's' : null;
            const badge = [cost, duration].filter(Boolean).join(' · ');
            const lastIdx = prev.length - 1;
            return prev.map((msg, i) =>
              msg.role === 'assistant' && !msg.complete
                ? { ...msg, complete: true, ...(i === lastIdx ? { badge } : {}) }
                : msg
            );
          });
        } else if (data.type === 'aborted') {
          setStreaming(false);
          setActivity(null);
          setMessages(prev => [...prev, { role: 'error', content: '⚠️ ' + (data.message as string), complete: true, msgId: nextMsgId() }]);
        } else if (data.type === 'error') {
          setStreaming(false);
          setActivity(null);
          setMessages(prev => [...prev, { role: 'error', content: data.message as string, complete: true, msgId: nextMsgId() }]);
        }
      };
    }

    function scheduleReconnect() {
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setReconnecting(true);
        connect();
      }, delay);
    }

    connect();

    return () => {
      mountedRef.current = false;
      stopPing();
      if (connectTimeout) clearTimeout(connectTimeout);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [wsUrl, startPing, stopPing]);

  const send = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages(prev => [...prev, { role: 'user', content: text, complete: true, msgId: nextMsgId() }]);
    wsRef.current.send(JSON.stringify({ type: 'message', content: text }));
    setStreaming(true);
    setActivity({ label: 'Thinking' });
  }, []);

  const abort = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'abort' }));
    setPermissionQueue([]);
  }, []);

  const respondPermission = useCallback((approved: boolean) => {
    if (permissionQueue.length === 0 || !wsRef.current) return;
    const current = permissionQueue[0];
    wsRef.current.send(JSON.stringify({
      type: 'permission_response',
      toolUseID: current.toolUseID,
      approved,
    }));
    setPermissionQueue(prev => prev.slice(1));
  }, [permissionQueue]);

  const listSessions = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'list_sessions' }));
  }, []);

  const initSession = useCallback((id: string | null) => {
    currentSessionIdRef.current = id;
    setSessionId(id);
    setMessages([]);
    setActivity(null);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (id) {
      wsRef.current.send(JSON.stringify({ type: 'init', sessionId: id }));
    }
  }, []);

  return {
    connected,
    reconnecting,
    streaming,
    messages,
    activity,
    permissionQueue,
    sessionId,
    sessionsList,
    send,
    abort,
    respondPermission,
    listSessions,
    initSession,
  };
}
