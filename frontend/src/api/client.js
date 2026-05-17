// Central fetch wrapper: prefixes the API base URL and attaches the
// JWT bearer token (when present) to every request.
const BASE = "http://localhost:8000";
const TOKEN_KEY = "flashcards_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token missing/expired — drop it so the app returns to the login screen.
    setToken(null);
    window.dispatchEvent(new Event("auth-expired"));
  }

  if (!res.ok) {
    let detail = "Request failed";
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }

  return res.status === 204 ? null : res.json();
}
