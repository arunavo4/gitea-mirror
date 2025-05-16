import { useCallback, useEffect, useState } from "react";
import RepositoryTable from "./RepositoryTable";
import type { MirrorJob, Repository } from "@/lib/db/schema";
import { useAuth } from "@/hooks/useAuth";
import {
  repoStatusEnum,
  type AddRepositoriesApiRequest,
  type AddRepositoriesApiResponse,
  type RepositoryApiResponse,
  type RepoStatus,
} from "@/types/Repository";
import { apiRequest } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, FlipHorizontal } from "lucide-react";
import type { MirrorRepoRequest, MirrorRepoResponse } from "@/types/mirror";
import { useSSE } from "@/hooks/useSEE";
import { useFilterParams } from "@/hooks/useFilterParams";
import { toast } from "sonner";
import type { SyncRepoRequest, SyncRepoResponse } from "@/types/sync";
import { OwnerCombobox, OrganizationCombobox } from "./RepositoryComboboxes";
import type { RetryRepoRequest, RetryRepoResponse } from "@/types/retry";
import AddRepositoryDialog from "./AddRepositoryDialog";

export default function Repository() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    status: "",
    organization: "",
    owner: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Read organization filter from URL when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orgParam = urlParams.get("organization");

    if (orgParam) {
      setFilter((prev) => ({ ...prev, organization: orgParam }));
    }
  }, [setFilter]);

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

  const fetchRepositories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await apiRequest<RepositoryApiResponse>(
        `/github/repositories?userId=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setRepositories(response.repositories);
        return true;
      } else {
        toast.error(response.error || "Error fetching repositories");
        return false;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error fetching repositories"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const handleRefresh = async () => {
    const success = await fetchRepositories();
    if (success) {
      toast.success("Repositories refreshed successfully.");
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
      toast.error(
        error instanceof Error ? error.message : "Error starting mirror job"
      );
    } finally {
      setLoadingRepoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  const handleMirrorAllRepos = async () => {
    try {
      if (!user || !user.id || repositories.length === 0) {
        return;
      }

      // Filter out repositories that are already mirroring to avoid duplicate operations. also filter out mirrored (mirrored can be synced and not mirrored again)
      const eligibleRepos = repositories.filter(
        (repo) =>
          repo.status !== "mirroring" && repo.status !== "mirrored" && repo.id //not ignoring failed ones because we want to retry them if not mirrored. if mirrored, gitea fucnion handlers will silently ignore them
      );

      if (eligibleRepos.length === 0) {
        toast.info("No eligible repositories to mirror");
        return;
      }

      // Get all repository IDs
      const repoIds = eligibleRepos.map((repo) => repo.id as string);

      // Set loading state for all repositories being mirrored
      setLoadingRepoIds((prev) => {
        const newSet = new Set(prev);
        repoIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      const reqPayload: MirrorRepoRequest = {
        userId: user.id,
        repositoryIds: repoIds,
      };

      const response = await apiRequest<MirrorRepoResponse>(
        "/job/mirror-repo",
        {
          method: "POST",
          data: reqPayload,
        }
      );

      if (response.success) {
        toast.success(`Mirroring started for ${repoIds.length} repositories`);
        setRepositories((prevRepos) =>
          prevRepos.map((repo) => {
            const updated = response.repositories.find((r) => r.id === repo.id);
            return updated ? updated : repo;
          })
        );
      } else {
        toast.error(response.error || "Error starting mirror jobs");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error starting mirror jobs"
      );
    } finally {
      // Reset loading states - we'll let the SSE updates handle status changes
      setLoadingRepoIds(new Set());
    }
  };

  const handleSyncRepo = async ({ repoId }: { repoId: string }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      setLoadingRepoIds((prev) => new Set(prev).add(repoId));

      const reqPayload: SyncRepoRequest = {
        userId: user.id,
        repositoryIds: [repoId],
      };

      const response = await apiRequest<SyncRepoResponse>("/job/sync-repo", {
        method: "POST",
        data: reqPayload,
      });

      if (response.success) {
        toast.success(`Syncing started for repository ID: ${repoId}`);
        setRepositories((prevRepos) =>
          prevRepos.map((repo) => {
            const updated = response.repositories.find((r) => r.id === repo.id);
            return updated ? updated : repo;
          })
        );
      } else {
        toast.error(response.error || "Error starting sync job");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error starting sync job"
      );
    } finally {
      setLoadingRepoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  const handleRetryRepoAction = async ({ repoId }: { repoId: string }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      setLoadingRepoIds((prev) => new Set(prev).add(repoId));

      const reqPayload: RetryRepoRequest = {
        userId: user.id,
        repositoryIds: [repoId],
      };

      const response = await apiRequest<RetryRepoResponse>("/job/retry-repo", {
        method: "POST",
        data: reqPayload,
      });

      if (response.success) {
        toast.success(`Retrying job for repository ID: ${repoId}`);
        setRepositories((prevRepos) =>
          prevRepos.map((repo) => {
            const updated = response.repositories.find((r) => r.id === repo.id);
            return updated ? updated : repo;
          })
        );
      } else {
        toast.error(response.error || "Error retrying job");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error retrying job"
      );
    } finally {
      setLoadingRepoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  const handleAddRepository = async ({
    repo,
    owner,
  }: {
    repo: string;
    owner: string;
  }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      const reqPayload: AddRepositoriesApiRequest = {
        userId: user.id,
        repo,
        owner,
      };

      const response = await apiRequest<AddRepositoriesApiResponse>(
        "/sync/repository",
        {
          method: "POST",
          data: reqPayload,
        }
      );

      if (response.success) {
        toast.success(`Repository added successfully`);
        setRepositories((prevRepos) => [...prevRepos, response.repository]);

        await fetchRepositories();

        setFilter((prev) => ({
          ...prev,
          searchTerm: repo,
        }));
      } else {
        toast.error(response.error || "Error adding repository");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error adding repository"
      );
    }
  };

  // Get unique owners and organizations for comboboxes
  const ownerOptions = Array.from(
    new Set(
      repositories.map((repo) => repo.owner).filter((v): v is string => !!v)
    )
  ).sort();
  const orgOptions = Array.from(
    new Set(
      repositories
        .map((repo) => repo.organization)
        .filter((v): v is string => !!v)
    )
  ).sort();

  return (
    <div className="flex flex-col gap-y-8">
      {/* Combine search and actions into a single flex row */}
      <div className="flex flex-row items-center gap-4 w-full flex-wrap">
        <div className="relative flex-grow min-w-[180px]">
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

        {/* Owner Combobox */}
        <OwnerCombobox
          options={ownerOptions}
          value={filter.owner || ""}
          onChange={(owner: string) =>
            setFilter((prev) => ({ ...prev, owner }))
          }
        />

        {/* Organization Combobox */}
        <OrganizationCombobox
          options={orgOptions}
          value={filter.organization || ""}
          onChange={(organization: string) =>
            setFilter((prev) => ({ ...prev, organization }))
          }
        />

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
            {["all", ...repoStatusEnum.options].map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all"
                  ? "All Status"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="default" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>

        <Button
          variant="default"
          onClick={handleMirrorAllRepos}
          disabled={isLoading || loadingRepoIds.size > 0}
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Mirror All
        </Button>
      </div>

      <RepositoryTable
        repositories={repositories}
        isLoading={isLoading || !connected}
        filter={filter}
        setFilter={setFilter}
        onMirror={handleMirrorRepo}
        onSync={handleSyncRepo}
        onRetry={handleRetryRepoAction}
        loadingRepoIds={loadingRepoIds}
      />

      <AddRepositoryDialog
        onAddRepository={handleAddRepository}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}
