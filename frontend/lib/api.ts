const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ivision_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("ivision_token", token);
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

export const api = {
  register: (email: string, password: string, full_name?: string) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name })
    }),
  login: (email: string, password: string) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  listChats: () => request("/api/chats"),
  createChat: (title?: string) =>
    request("/api/chats", { method: "POST", body: JSON.stringify({ title }) }),
  getMessages: (chatId: string) => request(`/api/chats/${chatId}/messages`),
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
