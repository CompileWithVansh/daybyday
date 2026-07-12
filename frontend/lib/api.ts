import Cookies from "js-cookie";
import type { ApiResponse } from "@/types";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const JWT_COOKIE_NAME = "jwt";

/**
 * Retrieves the JWT token from cookies.
 * Uses js-cookie on the client side.
 */
function getToken(): string | undefined {
  return Cookies.get(JWT_COOKIE_NAME);
}

/**
 * Builds a URL with optional query parameters appended.
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(`/api${endpoint}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Base fetch wrapper that attaches JWT from cookies and handles errors.
 * Redirects to /login on 401 responses.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string | number | boolean | undefined>
): Promise<ApiResponse<T>> {
  const token = getToken();
  const url = buildUrl(endpoint, params);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear token and redirect to login
    Cookies.remove(JWT_COOKIE_NAME);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized - redirecting to login");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  const data: ApiResponse<T> = await response.json();
  return data;
}

/**
 * GET request to Strapi API.
 * @param endpoint - API path without /api prefix (e.g. "/meeting-dates")
 * @param params - Optional query parameters
 */
export async function strapiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: "GET" }, params);
}

/**
 * POST request to Strapi API.
 * @param endpoint - API path without /api prefix
 * @param data - Request body payload
 */
export async function strapiPost<T>(
  endpoint: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUT request to Strapi API.
 * @param endpoint - API path without /api prefix (e.g. "/meeting-dates/1")
 * @param data - Request body payload
 */
export async function strapiPut<T>(
  endpoint: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request to Strapi API.
 * @param endpoint - API path without /api prefix (e.g. "/photos/1")
 */
export async function strapiDelete<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: "DELETE" });
}

export { fetchApi };
