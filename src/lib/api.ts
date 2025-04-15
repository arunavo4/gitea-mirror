import type { Config, Repository, Organization, MirrorJob, User } from './db/schema';

// Base API URL
const API_BASE = '/api';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(error.message || 'An unknown error occurred');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  getCurrentUser: () => apiRequest<User>('/auth/me'),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Config API
export const configApi = {
  getConfigs: () => apiRequest<Config[]>('/config'),

  getConfig: (id: string) => apiRequest<Config>(`/config/${id}`),

  createConfig: (config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<Config>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  updateConfig: (id: string, config: Partial<Config>) =>
    apiRequest<Config>(`/config/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    }),

  deleteConfig: (id: string) =>
    apiRequest<{ success: boolean }>(`/config/${id}`, {
      method: 'DELETE',
    }),
};

// GitHub API
export const githubApi = {
  testConnection: (token: string) =>
    apiRequest<{ success: boolean }>('/github/test-connection', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getRepositories: (config: Partial<Config>) =>
    apiRequest<Repository[]>('/github/repositories', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  getOrganizations: (token: string) =>
    apiRequest<Organization[]>('/github/organizations', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

// Gitea API
export const giteaApi = {
  testConnection: (url: string, token: string) =>
    apiRequest<{ success: boolean }>('/gitea/test-connection', {
      method: 'POST',
      body: JSON.stringify({ url, token }),
    }),

  createOrganization: (url: string, token: string, name: string, visibility: string) =>
    apiRequest<{ success: boolean }>('/gitea/create-organization', {
      method: 'POST',
      body: JSON.stringify({ url, token, name, visibility }),
    }),
};

// Mirror API
export const mirrorApi = {
  startMirror: (configId: string, repositoryIds?: string[]) =>
    apiRequest<MirrorJob>('/mirror/start', {
      method: 'POST',
      body: JSON.stringify({ configId, repositoryIds }),
    }),

  getMirrorJobs: (configId: string) =>
    apiRequest<MirrorJob[]>(`/mirror/jobs/${configId}`),

  getMirrorJob: (jobId: string) =>
    apiRequest<MirrorJob>(`/mirror/job/${jobId}`),

  cancelMirrorJob: (jobId: string) =>
    apiRequest<{ success: boolean }>(`/mirror/job/${jobId}/cancel`, {
      method: 'POST',
    }),
};

// Repository API
export const repositoryApi = {
  getRepositories: (configId: string) =>
    apiRequest<Repository[]>(`/repository/${configId}`),

  updateRepository: (id: string, data: Partial<Repository>) =>
    apiRequest<Repository>(`/repository/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Organization API
export const organizationApi = {
  getOrganizations: (configId: string) =>
    apiRequest<Organization[]>(`/organization/${configId}`),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    apiRequest<Organization>(`/organization/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
