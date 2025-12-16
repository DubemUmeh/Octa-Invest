import { API_BASE } from "./config";

/**
 * authFetch
 * - JWT Authorization header only
 * - Auto refresh on 401
 * - No cookies (JWT != session auth)
 */
export async function authFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let access = localStorage.getItem("access");
  let refresh = localStorage.getItem("refresh");

  const headers = {
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  // Only set JSON header if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // Access token expired → try refresh
  if (res.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshRes.ok) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const data = await refreshRes.json();

    access = data.access;
    if (data.refresh) {
      localStorage.setItem("refresh", data.refresh);
    }
    localStorage.setItem("access", access);

    const retryHeaders = {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
    };

    if (!(options.body instanceof FormData)) {
      retryHeaders["Content-Type"] = "application/json";
    }

    res = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  return res;
}
