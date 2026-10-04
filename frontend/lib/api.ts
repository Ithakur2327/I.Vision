const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ivision_token");
}

export function getStoredToken(): string | null {
  return getToken();
}

export function setToken(token: string) {
  window.localStorage.setItem("ivision_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("ivision_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface StreamDone {
  id: string;
  citations: { source_title: string; chunk_text: string; score: number }[];
  created_at: string;
  chat_title?: string | null;
}

/** Parses the backend's `data: {...}\n\n` SSE stream, calling onChunk for
 * each token as it arrives. Returns null (not a throw) if the caller
 * aborted via `signal` — that's a user-initiated stop, not a failure, and
 * the backend has already persisted whatever was generated so far. */
async function streamRequest(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<StreamDone | null> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    throw err;
  }

  if (!res.ok || !res.body) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: StreamDone | null = null;

  try {
    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const evt = JSON.parse(part.slice(6));
        if (evt.type === "chunk") onChunk(evt.text);
        else if (evt.type === "done") done = evt;
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError" || signal?.aborted) return null;
    throw err;
  }

  return done;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export const api = {
  register: (email: string, password: string, full_name?: string): Promise<TokenResponse> =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name })
    }),
  login: (email: string, password: string): Promise<TokenResponse> =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: (): Promise<{ id: string; email: string; full_name?: string | null }> =>
    request("/api/auth/me"),
  addGithub: (url: string) =>
    request("/api/integrations/github", { method: "POST", body: JSON.stringify({ url }) }),
  addYoutube: (url: string) =>
    request("/api/integrations/youtube", { method: "POST", body: JSON.stringify({ url }) }),
  addWebsite: (url: string) =>
    request("/api/integrations/website", { method: "POST", body: JSON.stringify({ url }) }),
  addLeetcode: (username: string) =>
    request("/api/integrations/leetcode", { method: "POST", body: JSON.stringify({ username }) }),
  listGithub: () => request("/api/integrations/github"),
  listYoutube: () => request("/api/integrations/youtube"),
  listWebsite: () => request("/api/integrations/website"),
  listLeetcode: () => request("/api/integrations/leetcode"),
  deleteGithub: (id: string) => request(`/api/integrations/github/${id}`, { method: "DELETE" }),
  deleteYoutube: (id: string) => request(`/api/integrations/youtube/${id}`, { method: "DELETE" }),
  deleteWebsite: (id: string) => request(`/api/integrations/website/${id}`, { method: "DELETE" }),
  deleteLeetcode: (id: string) => request(`/api/integrations/leetcode/${id}`, { method: "DELETE" }),
  listChats: () => request("/api/chats"),
  createChat: (title?: string) =>
    request("/api/chats", { method: "POST", body: JSON.stringify({ title }) }),
  getMessages: (chatId: string) => request(`/api/chats/${chatId}/messages`),
  deleteChat: (chatId: string) => request(`/api/chats/${chatId}`, { method: "DELETE" }),
  sendMessage: (chatId: string, content: string) =>
    request(`/api/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    }),
  sendMessageStream: (
    chatId: string,
    content: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ) => streamRequest(`/api/chats/${chatId}/messages/stream`, { content }, onChunk, signal),
  regenerateStream: (
    chatId: string,
    messageId: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ) => streamRequest(`/api/chats/${chatId}/messages/${messageId}/regenerate`, undefined, onChunk, signal),
  getSettings: (): Promise<{ theme: string; ai_model: string; voice_enabled: boolean }> =>
    request("/api/settings"),
  updateSettings: (payload: { theme?: string; voice_enabled?: boolean }) =>
    request("/api/settings", { method: "PUT", body: JSON.stringify(payload) }),
  listKnowledge: () => request("/api/knowledge"),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/knowledge/documents", { method: "POST", body: form });
  },
  deleteKnowledge: (id: string) =>
    request(`/api/knowledge/${id}`, { method: "DELETE" }),
  search: (q: string) => request(`/api/search?q=${encodeURIComponent(q)}`)
};