import type {
  Config,
  Repository,
  Organization,
  MirrorJob,
  User,
} from "./db/schema";

// Base API URL
const API_BASE = "/api";

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An unknown error occurred",
    }));
    throw new Error(error.message || "An unknown error occurred");
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await fetch("/api/auth?endpoint=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Send cookies
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Login failed");
    return await res.json(); // returns user
  },

  register: async (username: string, email: string, password: string) => {
    const res = await fetch("/api/auth?endpoint=register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) throw new Error("Registration failed");
    return await res.json(); // returns user
  },

  getCurrentUser: async () => {
    const res = await fetch("/api/auth", {
      method: "GET",
      credentials: "include", // Send cookies
    });

    if (!res.ok) throw new Error("Not authenticated");
    return await res.json();
  },

  logout: async () => {
    await fetch("/api/auth?endpoint=logout", {
      method: "POST",
      credentials: "include",
    });
  },
};

// GitHub API
export const githubApi = {
  testConnection: (token: string) =>
    apiRequest<{ success: boolean }>("/github/test-connection", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  getRepositories: (config: Partial<Config>) =>
    apiRequest<Repository[]>("/github/repositories", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  getOrganizations: (token: string) =>
    apiRequest<Organization[]>("/github/organizations", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

// Gitea API
export const giteaApi = {
  testConnection: (url: string, token: string) =>
    apiRequest<{ success: boolean }>("/gitea/test-connection", {
      method: "POST",
      body: JSON.stringify({ url, token }),
    }),

  createOrganization: (
    url: string,
    token: string,
    name: string,
    visibility: string
  ) =>
    apiRequest<{ success: boolean }>("/gitea/create-organization", {
      method: "POST",
      body: JSON.stringify({ url, token, name, visibility }),
    }),
};

// Mirror API
export const mirrorApi = {
  startMirror: (configId: string, repositoryIds?: string[]) =>
    apiRequest<MirrorJob>("/mirror/start", {
      method: "POST",
      body: JSON.stringify({ configId, repositoryIds }),
    }),

  getMirrorJobs: (configId: string) =>
    apiRequest<MirrorJob[]>(`/mirror/jobs/${configId}`),

  getMirrorJob: (jobId: string) =>
    apiRequest<MirrorJob>(`/mirror/job/${jobId}`),

  cancelMirrorJob: (jobId: string) =>
    apiRequest<{ success: boolean }>(`/mirror/job/${jobId}/cancel`, {
      method: "POST",
    }),
};

// Repository API
export const repositoryApi = {
  getRepositories: (configId: string) =>
    apiRequest<Repository[]>(`/repository/${configId}`),

  updateRepository: (id: string, data: Partial<Repository>) =>
    apiRequest<Repository>(`/repository/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Organization API
export const organizationApi = {
  getOrganizations: (configId: string) =>
    apiRequest<Organization[]>(`/organization/${configId}`),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    apiRequest<Organization>(`/organization/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
