import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "Unknown error");
      toast.error(`API Error ${res.status}: ${message}`);
      throw new Error(message);
    }
    return res.json();
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const res = await fetch(`${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "Unknown error");
      toast.error(`API Error ${res.status}`);
      throw new Error(message);
    }
    return res.json();
  },
};