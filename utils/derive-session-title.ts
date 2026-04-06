import type { Message } from '@/store/connection-store';

/**
 * Derives a session title from conversation messages, mirroring the CLI's
 * getSessionPreview logic: "User msg — Assistant msg" truncated to 80 chars.
 *
 * Returns null if there isn't enough content yet.
 */
export function deriveSessionTitle(messages: Message[]): string | null {
  const parts: string[] = [];
  let totalLen = 0;

  for (const msg of messages) {
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;
    if (!msg.complete) continue;

    const text = msg.content.replace(/<[^>]*>/g, '').trim();
    if (!text) continue;

    parts.push(text);
    totalLen += (parts.length > 1 ? 3 : 0) + text.length; // 3 = " — "
    if (totalLen >= 80) break;
  }

  if (parts.length === 0) return null;

  const preview = parts.join(' — ');
  return preview.length > 80 ? preview.slice(0, 80) + '...' : preview;
}
