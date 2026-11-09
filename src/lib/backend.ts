import "server-only";
import axios from "axios";
import { getAccessToken } from "@/auth";

/** Axios client for the Spring Boot leave API. Each request carries the signed-in user's Keycloak token. */
export const backend = axios.create({
  baseURL: process.env.BACKEND_API_URL,
  timeout: 10_000,
});

backend.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type BackendResult = {
  path: string;
  status: number | null;
  data: unknown;
  error?: string;
};

/** GETs a path and reports what came back, including failures, instead of throwing. */
export async function probe(path: string): Promise<BackendResult> {
  try {
    const response = await backend.get(path);
    return { path, status: response.status, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { path, status: error.response?.status ?? null, data: error.response?.data ?? null, error: error.message };
    }
    return { path, status: null, data: null, error: String(error) };
  }
}
