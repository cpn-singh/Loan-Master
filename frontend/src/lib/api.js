const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");
export const TOKEN_KEY = "loanwise_token";

// Send JSON requests and add the login token when one is available.
export async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Token " + token } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the Django API at ${API_BASE_URL}. Check that the backend is running and VITE_API_URL is correct.`,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const validationMessage = Object.values(body)
      .flat()
      .filter((item) => typeof item === "string")
      .join(" ");
    throw new Error(
      body.detail || validationMessage || "The request could not be completed.",
    );
  }

  return response.status === 204 ? null : response.json();
}
