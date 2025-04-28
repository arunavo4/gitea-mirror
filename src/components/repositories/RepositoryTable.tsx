import { useMemo } from "react";
import Fuse from "fuse.js";
import { GitFork, ExternalLink, RefreshCw } from "lucide-react";
import type { Repository } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor } from "@/lib/utils";
import type { RepoFilter } from "@/types/Repository";
import { Skeleton } from "@/components/ui/skeleton";

interface RepositoryTableProps {
  repositories: Repository[];
  isLoading: boolean;
  filter: RepoFilter;
  setFilter: (filter: RepoFilter) => void;
  onMirror: ({ repoId }: { repoId: string }) => Promise<void>;
  loadingRepoIds: Set<string>;
}

export function RepositoryTable({
  repositories,
  isLoading,
  filter,
  setFilter,
  onMirror,
  loadingRepoIds,
}: RepositoryTableProps) {
  const hasAnyFilter = Object.values(filter).some(
    (val) => val?.toString().trim() !== ""
  );

  const filteredRepositories = useMemo(() => {
    let result = repositories;

    if (filter.status) {
      result = result.filter((repo) => repo.status === filter.status);
    }

    if (filter.searchTerm) {
      const fuse = new Fuse(result, {
        keys: ["name", "fullName", "owner", "organization"],
        threshold: 0.3,
      });

      result = fuse.search(filter.searchTerm).map((res) => res.item);
    }

    return result;
  }, [repositories, filter]);

  return isLoading ? (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 text-sm font-medium">Repository</th>
            <th className="text-left p-3 text-sm font-medium">Owner</th>
            <th className="text-left p-3 text-sm font-medium">Organization</th>
            <th className="text-left p-3 text-sm font-medium">Last Mirrored</th>
            <th className="text-left p-3 text-sm font-medium">Status</th>
            <th className="text-right p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="p-3">
                  <Skeleton className="h-10 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : filteredRepositories.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <GitFork className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No repositories found</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
        {hasAnyFilter
          ? "Try adjusting your search or filter criteria."
          : "Configure your GitHub connection to start mirroring repositories."}
      </p>
      {hasAnyFilter ? (
        <Button
          variant="outline"
          onClick={() =>
            setFilter({
              searchTerm: "",
              status: "",
            })
          }
        >
          Clear Filters
        </Button>
      ) : (
        <Button asChild>
          <a href="/config">Configure GitHub</a>
        </Button>
      )}
    </div>
  ) : (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 text-sm font-medium">Repository</th>
            <th className="text-left p-3 text-sm font-medium">Owner</th>
            <th className="text-left p-3 text-sm font-medium">Organization</th>
            <th className="text-left p-3 text-sm font-medium">Last Mirrored</th>
            <th className="text-left p-3 text-sm font-medium">Status</th>
            <th className="text-right p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRepositories.map((repo, index) => {
            const isLoading = loadingRepoIds.has(repo.id ?? "");

            return (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{repo.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {repo.fullName}
                      </div>
                    </div>
                    {repo.isPrivate && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                        Private
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm">{repo.owner}</td>
                <td className="p-3 text-sm">{repo.organization || "-"}</td>
                <td className="p-3 text-sm">
                  {repo.lastMirrored
                    ? formatDate(new Date(repo.lastMirrored))
                    : "Never"}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        repo.status
                      )}`}
                    />
                    <span className="text-sm capitalize">{repo.status}</span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {repo.status === "mirrored" ||
                    repo.status === "syncing" ||
                    repo.status === "synced" ? (
                      <Button
                        variant="ghost"
                        disabled={repo.status === "syncing" || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                            Sync
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={repo.status === "mirroring" || isLoading}
                        onClick={() => onMirror({ repoId: repo.id ?? "" })}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                            Mirror
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Mirror
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
