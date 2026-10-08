'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useSession } from './session';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = useSession.getState().token;
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && token) {
    useSession.getState().logout();
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new ApiError(msg || 'Sunucuya ulaşılamadı. Lütfen tekrar deneyin.', res.status);
  }
  return data as T;
}

export function useApi<T>(path: string | null, key?: QueryKey) {
  return useQuery<T>({
    queryKey: key ?? [path],
    queryFn: () => api<T>(path!),
    enabled: !!path,
  });
}

/** Yazma isteği; başarılı olunca verilen önekle başlayan tüm sorguları yeniler. */
export function useAction<TBody = unknown, TRes = unknown>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string | ((body: TBody) => string),
  opts: { onSuccess?: (res: TRes, body: TBody) => void } = {},
) {
  const qc = useQueryClient();
  return useMutation<TRes, ApiError, TBody>({
    mutationFn: (body) => api<TRes>(typeof path === 'function' ? path(body) : path, { method, body: method === 'DELETE' ? undefined : body }),
    onSuccess: (res, body) => {
      qc.invalidateQueries();
      opts.onSuccess?.(res, body);
    },
  });
}
