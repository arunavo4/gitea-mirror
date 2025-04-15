import { describe, it, expect, vi, beforeEach } from 'vitest';
import { githubApi, giteaApi, mirrorApi } from '../lib/api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('githubApi', () => {
    it('testConnection should make a POST request to /api/github/test-connection', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await githubApi.testConnection('test-token');

      expect(global.fetch).toHaveBeenCalledWith('/api/github/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'test-token' }),
      });
      expect(result).toEqual({ success: true });
    });

    it('getRepositories should make a POST request to /api/github/repositories', async () => {
      const mockConfig = {
        github: {
          username: 'test-user',
        },
      };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ id: '1', name: 'test-repo' }]),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await githubApi.getRepositories(mockConfig);

      expect(global.fetch).toHaveBeenCalledWith('/api/github/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockConfig),
      });
      expect(result).toEqual([{ id: '1', name: 'test-repo' }]);
    });
  });

  describe('giteaApi', () => {
    it('testConnection should make a POST request to /api/gitea/test-connection', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await giteaApi.testConnection('https://gitea.example.com', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith('/api/gitea/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://gitea.example.com', token: 'test-token' }),
      });
      expect(result).toEqual({ success: true });
    });

    it('createOrganization should make a POST request to /api/gitea/create-organization', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await giteaApi.createOrganization(
        'https://gitea.example.com',
        'test-token',
        'test-org',
        'public'
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/gitea/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://gitea.example.com',
          token: 'test-token',
          name: 'test-org',
          visibility: 'public',
        }),
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('mirrorApi', () => {
    it('startMirror should make a POST request to /api/mirror/start', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: '1', status: 'pending' }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await mirrorApi.startMirror('config-1', ['repo-1']);

      expect(global.fetch).toHaveBeenCalledWith('/api/mirror/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId: 'config-1', repositoryIds: ['repo-1'] }),
      });
      expect(result).toEqual({ id: '1', status: 'pending' });
    });

    it('getMirrorJobs should make a GET request to /api/mirror/jobs/:configId', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ id: '1', status: 'pending' }]),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await mirrorApi.getMirrorJobs('config-1');

      expect(global.fetch).toHaveBeenCalledWith('/api/mirror/jobs/config-1', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual([{ id: '1', status: 'pending' }]);
    });

    it('getMirrorJob should make a GET request to /api/mirror/job/:jobId', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: '1', status: 'pending' }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await mirrorApi.getMirrorJob('job-1');

      expect(global.fetch).toHaveBeenCalledWith('/api/mirror/job/job-1', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual({ id: '1', status: 'pending' });
    });

    it('cancelMirrorJob should make a POST request to /api/mirror/job/:jobId/cancel', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await mirrorApi.cancelMirrorJob('job-1');

      expect(global.fetch).toHaveBeenCalledWith('/api/mirror/job/job-1/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
