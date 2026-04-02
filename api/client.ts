const BASE_URL = "https://uat.revise.network/grass"; 
// const BASE_URL = "http://100.70.11.43:4008";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  token?: string;
};

type ApiResponse<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: string;
  status: number;
};

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, token } = options;

  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  if (body) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message ?? data?.error ?? "Something went wrong",
        status: response.status,
      };
    }

    return { ok: true, data: data as T };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message ?? "Network error",
      status: 0,
    };
  }
}
