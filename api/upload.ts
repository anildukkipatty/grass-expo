import { getToken } from '@/store/auth-store';

import { BASE_URL } from './client';

export async function uploadImage(
  localUri: string,
  mimeType?: string | null,
  fileName?: string | null,
): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const mime = mimeType ?? 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const name = fileName?.includes('.') ? fileName : `upload.${ext}`;

  console.log('[uploadImage] uri:', localUri.slice(-40), 'mime:', mime, 'name:', name);

  const form = new FormData();
  form.append('file', { uri: localUri, type: mime, name } as any);

  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = await res.json() as { success: boolean; url?: string; message?: string };
  console.log('[uploadImage] status:', res.status, 'body:', json);
  if (!json.success || !json.url) throw new Error(json.message ?? 'Upload failed');
  return json.url;
}
