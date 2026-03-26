
// const API_BASE =
//   import.meta.env.VITE_API_BASE_URL ||
//   "http://multiclout.in";

// export const apiFetch = async (
//   url: string,
//   token?: string,
//   options: RequestInit = {}
// ) => {
//   const res = await fetch(`${API_BASE}${url}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//       ...(options.headers || {}),
//     },
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.error || "API Error");
//   }

//   return res.json();
// };

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://multiclout.in";

/* ================= API FETCH ================= */
export const apiFetch = async (
  url: string,
  token?: string,
  options: any = {}   // 🔥 TYPE FIX (NO TS ERROR)
) => {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: options.method || "GET",

      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },

      // 🔥 AUTO JSON HANDLE
      body:
        options.body && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || "API Error");
    }

    return data;

  } catch (err: any) {
    console.error("API ERROR:", err.message);
    throw err;
  }
};