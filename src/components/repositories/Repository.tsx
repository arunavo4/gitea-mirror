import { useEffect, useState } from "react";
import { RepositoryTable } from "./RepositoryTable";
import type { Repository } from "@/lib/db/schema";
import { useAuth } from "@/hooks/useAuth";
import type {
  Filter,
  RepositoryApiResponse,
  RepoStatus,
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
import { Search, Filter as FilterIcon, RefreshCw } from "lucide-react";
import type { MirrorRepoRequest, MirrorRepoResponse } from "@/types/mirror";

export default function Repository() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>({
    searchTerm: "",
    status: "",
    name: "",
    organization: "",
    owner: "",
    lastMirrored: "",
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

        if (response.repositories) {
          console.log("Repositories:", response.repositories);
          setRepositories(response.repositories);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching repositories:", error);
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

      if (response.repositories) {
        console.log("Repositories:", response.repositories);
        setRepositories(response.repositories);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error refreshing repositories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMirror = async ({ repoId }: { repoId: string }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      const reqPayload: MirrorRepoRequest = {
        userId: user.id,
        repositoryIds: [repoId],
      };

      const response = await apiRequest<MirrorRepoResponse>("/job/mirror", {
        method: "POST",
        data: reqPayload,
      });

      if (response.success) {
        console.log("Mirror job started successfully:", response);
        setRepositories((prevRepos) =>
          prevRepos.map((repo) => {
            const updated = response.repositories.find((r) => r.id === repo.id);
            return updated ? updated : repo;
          })
        );
      } else {
        console.error("Error mirroring repository:", response.error);
      }
    } catch (error) {
      console.error("Error mirroring repository:", error);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-md">
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

        <div className="flex gap-x-4">
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
            <FilterIcon className="h-4 w-4 mr-2" />
            More Filters
          </Button>

          <Button variant="default" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <RepositoryTable
        repositories={repositories}
        isLoading={isLoading}
        filter={filter}
        setFilter={setFilter}
        onMirror={handleMirror}
      />
    </div>
  );
}
