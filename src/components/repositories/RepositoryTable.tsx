"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import {
  GitFork,
  ExternalLink,
  Search,
  Filter as FilterIcon,
  RefreshCw,
} from "lucide-react";
import type { Repository } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Filter } from "@/types/Repository";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface RepositoryTableProps {
  repositories: Repository[];
  onMirrorNow: (repositoryId: string) => void;
}

export function RepositoryTable({
  repositories,
  onMirrorNow,
}: RepositoryTableProps) {
  const [filter, setFilter] = useState<Filter>({
    searchTerm: "",
    status: "",
    name: "",
    organization: "",
    owner: "",
    lastMirrored: "",
  });

  const hasAnyFilter = Object.values(filter).some(
    (val) => val?.toString().trim() !== ""
  );

  const filteredRepositories = useMemo(() => {
    let result = repositories;

    // Apply status filter
    if (filter.status) {
      result = result.filter((repo) => repo.status === filter.status);
    }

    // Apply Fuse.js fuzzy search
    if (filter.searchTerm) {
      const fuse = new Fuse(result, {
        keys: ["name", "fullName", "owner", "organization"],
        threshold: 0.3,
      });

      result = fuse.search(filter.searchTerm).map((res) => res.item);
    }

    return result;
  }, [repositories, filter]);

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* Search Input */}
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

        {/* Filter Controls */}
        <div className="flex gap-x-4">
          <Select
            defaultValue="pending"
            value={filter.status}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                status: value as "" | "pending" | "mirrored" | "failed",
              }))
            }
          >
            <SelectTrigger className="w-[140px] h-9 max-h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="mirrored">Mirrored</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <FilterIcon className="h-4 w-4 mr-2" />
            More Filters
          </Button>

          <Button variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* No Repositories State */}
      {filteredRepositories.length === 0 ? (
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
                  name: "",
                  organization: "",
                  owner: "",
                  lastMirrored: "",
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
        // Repository Table
        <div className="border rounded-md">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">
                  Repository
                </th>
                <th className="text-left p-3 text-sm font-medium">Owner</th>
                <th className="text-left p-3 text-sm font-medium">
                  Organization
                </th>
                <th className="text-left p-3 text-sm font-medium">
                  Last Mirrored
                </th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-right p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepositories.map((repo) => (
                <tr key={repo.id} className="border-b hover:bg-muted/50">
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
                      ? formatDate(repo.lastMirrored)
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
                      <Button
                        variant="ghost"
                        onClick={() => onMirrorNow(repo.id || "")}
                        disabled={repo.status === "pending"}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Mirror
                      </Button>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "mirrored":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    case "pending":
    default:
      return "bg-yellow-500";
  }
}
