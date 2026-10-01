// export const API_URL =
//   import.meta.env.VITE_API_URL || "http://142.93.58.173:5001/api";

export const API_URL = "http://142.93.58.173:5001/api";
export const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

export async function api(path, options = {}) {
  const token = localStorage.getItem("rentreino_token");
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("rentreino:unauthorized"));
    throw new Error(data?.message || data || "Request failed");
  }
  return data;
}

export const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
export const shortDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "—";
