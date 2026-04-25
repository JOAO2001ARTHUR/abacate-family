import { createClient } from "@/utils/supabase/client";

const API_BASE_URL = "/api";

async function getAuthHeader() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return { "Authorization": `Bearer ${session.access_token}` };
  }
  return {};
}

export const api = {
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    const authHeader = await getAuthHeader();
    
    const response = await fetch(`${API_BASE_URL}${path}${query}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async post<T>(path: string, body: any): Promise<T> {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async put<T>(path: string, body: any): Promise<T> {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async delete<T>(path: string): Promise<T> {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
