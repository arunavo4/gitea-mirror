import { useCallback, useEffect, useState } from "react";
import { RepositoryTable } from "./RepositoryTable";
import type { MirrorJob, Repository } from "@/lib/db/schema";
import { useAuth } from "@/hooks/useAuth";
import type { RepositoryApiResponse, RepoStatus } from "@/types/Repository";
import { apiRequest } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";
import type { MirrorRepoRequest, MirrorRepoResponse } from "@/types/mirror";
import { useSSE } from "@/hooks/useSEE";
import { useFilterParams } from "@/hooks/useFilterParams";
import { toast } from "sonner";

export default function Repository() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    status: "",
  });

  const [loadingRepoIds, setLoadingRepoIds] = useState<Set<string>>(new Set()); // this is used when the api actions are performed

  // Create a stable callback using useCallback
  const handleNewMessage = useCallback((data: MirrorJob) => {
    if (data.repositoryId) {
      setRepositories((prevRepos) =>
        prevRepos.map((repo) =>
          repo.id === data.repositoryId
            ? { ...repo, status: data.status, details: data.details }
            : repo
        )
      );
    }

    console.log("Received new log:", data);
  }, []);

  // Use the SSE hook
  const { connected } = useSSE({
    userId: user?.id,
    onMessage: handleNewMessage,
  });

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        if (!user) {
          return;
        }

        setIsLoading(true);

        const response = await apiRequest<RepositoryApiResponse>(
          `/github/repositories?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        if (response.success) {
          setRepositories(response.repositories);
        } else {
          toast.error(response.error || "Error fetching repositories");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error fetching repositories"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [user]);

  const handleRefresh = async () => {
    try {
      if (!user) {
        return;
      }

      setIsLoading(true);

      const response = await apiRequest<RepositoryApiResponse>(
        `/github/repositories?userId=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setRepositories(response.repositories);
        toast.success("Repositories refreshed successfully.");
      } else {
        toast.error(response.error || "Error refreshing repositories");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error refreshing repositories"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMirrorRepo = async ({ repoId }: { repoId: string }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      setLoadingRepoIds((prev) => new Set(prev).add(repoId));

      const reqPayload: MirrorRepoRequest = {
        userId: user.id,
        repositoryIds: [repoId],
      };

      const response = await apiRequest<MirrorRepoResponse>(
        "/job/mirror-repo",
        {
          method: "POST",
          data: reqPayload,
        }
      );

      if (response.success) {
        toast.success(`Mirroring started for repository ID: ${repoId}`);
        setRepositories((prevRepos) =>
          prevRepos.map((repo) => {
            const updated = response.repositories.find((r) => r.id === repo.id);
            return updated ? updated : repo;
          })
        );
      } else {
        toast.error(response.error || "Error starting mirror job");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error starting mirror job");
    } finally {
      setLoadingRepoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      {/* Combine search and actions into a single flex row */}
      <div className="flex flex-row items-center gap-4 w-full">
        <div className="relative flex-grow"> {/* Use flex-grow for search */}
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search repositories..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filter.searchTerm}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
          />
        </div>

        <Select
            value={filter.status || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                status: value === "all" ? "" : (value as RepoStatus),
              }))
            }
          >
            <SelectTrigger className="w-[140px] h-9 max-h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="imported">Imported</SelectItem>
              <SelectItem value="mirroring">Mirroring</SelectItem>
              <SelectItem value="mirrored">Mirrored</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="syncing">Syncing</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
            </SelectContent>
          </Select>

        <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>

        <Button variant="default" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
      </div>

      <RepositoryTable
        repositories={repositories}
        isLoading={isLoading || !connected}
        filter={filter}
        setFilter={setFilter}
        onMirror={handleMirrorRepo}
        loadingRepoIds={loadingRepoIds}
      />
    </div>
  );
}
