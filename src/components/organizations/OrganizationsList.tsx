import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import { SiGithub } from "react-icons/si";
import type { Organization } from "@/lib/db/schema";
import type { FilterParams } from "@/types/filter";
import Fuse from "fuse.js";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { getStatusColor } from "@/lib/utils";

interface OrganizationListProps {
  organizations: Organization[];
  isLoading: boolean;
  filter: FilterParams;
  setFilter: (filter: FilterParams) => void;
  onMirror: ({ orgId }: { orgId: string }) => Promise<void>;
  loadingOrgIds: Set<string>;
  onAddOrganization?: () => void;
}

export function OrganizationList({
  organizations,
  isLoading,
  filter,
  setFilter,
  onMirror,
  loadingOrgIds,
  onAddOrganization,
}: OrganizationListProps) {
  const hasAnyFilter = Object.values(filter).some(
    (val) => val?.toString().trim() !== ""
  );

  const filteredOrganizations = useMemo(() => {
    let result = organizations;

    if (filter.membershipRole) {
      result = result.filter((org) => org.membershipRole === filter.membershipRole);
    }

    if (filter.status) {
      result = result.filter((org) => org.status === filter.status);
    }

    if (filter.searchTerm) {
      const fuse = new Fuse(result, {
        keys: ["name", "type"],
        threshold: 0.3,
      });
      result = fuse.search(filter.searchTerm).map((res) => res.item);
    }

    return result;
  }, [organizations, filter]);

  return isLoading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[136px] w-full" />
      ))}
    </div>
  ) : filteredOrganizations.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No organizations found</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
        {hasAnyFilter
          ? "Try adjusting your search or filter criteria."
          : "Add GitHub organizations to mirror their repositories."}
      </p>
      {hasAnyFilter ? (
        <Button
          variant="outline"
          onClick={() => {
            setFilter({
              searchTerm: "",
              membershipRole: "",
            });
          }}
        >
          Clear Filters
        </Button>
      ) : (
        <Button onClick={onAddOrganization}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      )}
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredOrganizations.map((org, index) => {
        const isLoading = loadingOrgIds.has(org.id ?? "");

        return (
          <Card key={index} className="overflow-hidden p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <a 
                  href={`/repositories?organization=${encodeURIComponent(org.name || '')}`}
                  className="font-medium hover:underline cursor-pointer"
                >
                  {org.name}
                </a>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full capitalize ${
                  org.membershipRole === "member"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {org.membershipRole}
                {/* needs to be updated  */}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {org.repositoryCount}{" "}
              {org.repositoryCount === 1 ? "repository" : "repositories"}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id={`include-${org.id}`}
                  name={`include-${org.id}`}
                  checked={org.status === "mirrored"}
                  disabled={
                    loadingOrgIds.has(org.id ?? "") ||
                    org.status === "mirrored" ||
                    org.status === "mirroring"
                  }
                  onCheckedChange={async (checked) => {
                    if (checked && !org.isIncluded && org.id) {
                      onMirror({ orgId: org.id });
                    }
                  }}
                />
                <label
                  htmlFor={`include-${org.id}`}
                  className="ml-2 text-sm select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include in mirroring
                </label>

                {isLoading && (
                  <RefreshCw className="opacity-50 h-4 w-4 animate-spin ml-4" />
                )}
              </div>

              <Button variant="ghost" size="icon" asChild>
                <a
                  href={`https://github.com/${org.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                   <SiGithub className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* dont know if this looks good. maybe revised  */}
            <div className="flex items-center gap-2 justify-end mt-4">
              <div
                className={`h-2 w-2 rounded-full ${getStatusColor(org.status)}`}
              />
              <span className="text-sm capitalize">{org.status}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
