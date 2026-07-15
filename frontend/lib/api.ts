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