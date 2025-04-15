import { useState } from 'react';
import { mirrorApi } from '@/lib/api';
import type { MirrorJob } from '@/lib/db/schema';

export function useMirror() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<MirrorJob | null>(null);
  const [jobs, setJobs] = useState<MirrorJob[]>([]);

  const startMirror = async (configId: string, repositoryIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const job = await mirrorApi.startMirror(configId, repositoryIds);
      setCurrentJob(job);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start mirroring');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getMirrorJobs = async (configId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedJobs = await mirrorApi.getMirrorJobs(configId);
      setJobs(fetchedJobs);
      return fetchedJobs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mirror jobs');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getMirrorJob = async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const job = await mirrorApi.getMirrorJob(jobId);
      setCurrentJob(job);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mirror job');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelMirrorJob = async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mirrorApi.cancelMirrorJob(jobId);
      if (result.success && currentJob?.id === jobId) {
        setCurrentJob({ ...currentJob, status: 'failed' });
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel mirror job');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    currentJob,
    jobs,
    startMirror,
    getMirrorJobs,
    getMirrorJob,
    cancelMirrorJob,
  };
}
