// 统一 API Client
// - 基于 fetch
// - 使用 JWT Bearer Token（不再使用 Cookie）
// - 统一处理 401 / 登录失效

const BASE_URL = 'http://localhost:8104';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  status?: number;
  detail?: any;

  constructor(message: string, status?: number, detail?: any) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    throw new ApiError('UNAUTHORIZED', 401);
  }

  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {}
    throw new ApiError('API_ERROR', res.status, detail);
  }

  // 部分接口返回 null / empty body
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}
