export async function authFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  let access = localStorage.getItem("access");
  let refresh = localStorage.getItem("refresh");

  let res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  });

  if (res.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject("Session expired");
    }

    const data = await refreshRes.json();
    localStorage.setItem("access", data.access);

    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${data.access}`,
      },
    });
  }

  return res;
}
