// Thin fetch wrapper: base URL, JWT bearer token, JSON handling.
// Requests go to `${API_URL}/api`. In dev API_URL is "" so they hit /api and
// the Vite proxy forwards to the backend; in production API_URL points at the
// deployed backend origin (set via VITE_API_URL).

import { API_URL } from "./config";

const TOKEN_KEY = "chat-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async (method, path, body) => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body instanceof FormData) {
    opts.body = body; // let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}/api${path}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body */
  }

  if (!res.ok) {
    // A 401 on a request that carried a token means the session is invalid or
    // expired (e.g. a stale token left over from the old auth system). Clear it
    // and send the user back to the login screen instead of looping on errors.
    if (res.status === 401 && token) {
      clearToken();
      if (window.location.pathname !== "/") window.location.href = "/";
    }
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
};

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};
