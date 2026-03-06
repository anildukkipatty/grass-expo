// This file is kept as a re-export shim while screens migrate to use-server.ts
export type { Message, PermissionItem, Session, Repo, DirEntry, FileContentResult, UseServerResult as UseWebSocketResult } from '@/hooks/use-server';
export { useWebSocket, useServer } from '@/hooks/use-server';
