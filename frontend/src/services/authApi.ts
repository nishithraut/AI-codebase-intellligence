
const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}/auth${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Authentication request failed.");
  }

  return data as T;
}

export const registerUser = (
  name: string,
  email: string,
  password: string
) =>
  request<AuthResponse>("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const loginUser = (email: string, password: string) =>
  request<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getCurrentUser = () =>
  request<{ success: boolean; user: AuthUser }>("/me", {
    method: "GET",
  });

export const logoutUser = () =>
  request<{ success: boolean; message: string }>("/logout", {
    method: "POST",
  });
