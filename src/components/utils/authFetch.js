import { API_BASE } from "./config";

export async function authFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let access = localStorage.getItem("access");
  let refresh = localStorage.getItem("refresh");

  const headers = {
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // Refresh token
  if (res.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const data = await refreshRes.json();
    access = data.access;
    localStorage.setItem("access", access);

    res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${access}`,
      },
    });
  }

  return res;
}
