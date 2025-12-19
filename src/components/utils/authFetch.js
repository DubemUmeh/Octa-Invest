import { API_BASE } from "./config";

export async function authFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let access = localStorage.getItem("access");
  let refresh = localStorage.getItem("refresh");

  // If no tokens at all, don't attempt request
  if (!access && !refresh) {
    throw new Error("No authentication tokens found");
  }

  const init = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    credentials: "include",
  };

  let res = await fetch(url, init);

  // Retry with refresh token if 401
  if (res.status === 401 && refresh) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        credentials: "include",
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        access = data.access;
        localStorage.setItem("access", access);

        const retryInit = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${access}`,
          },
          credentials: "include",
        };

        res = await fetch(url, retryInit);
      } else {
        // Only redirect if refresh fails
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        // Use setTimeout to avoid redirect during render
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
        
        throw new Error("Session expired. Please log in again.");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
      
      throw error;
    }
  }

  return res;
}
