


const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://mbbsgyan.com";

export const apiFetch = async (
  url: string,
  token?: string,
  options: RequestInit = {}
) => {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "API Error");
  }

  return res.json();
};