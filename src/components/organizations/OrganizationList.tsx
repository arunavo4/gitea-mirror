import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Users, ExternalLink } from "lucide-react";
import type { Organization } from "@/lib/db/schema";

interface OrganizationListProps {
  organizations: Organization[];
  onToggleInclude: (id: string, included: boolean) => void;
  onAddOrganization: () => void;
}

export function OrganizationList({
  organizations,
  onToggleInclude,
  onAddOrganization,
}: OrganizationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Filter organizations based on search term and type filter
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? org.type === typeFilter : true;

    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={typeFilter || ""}
          onChange={(e) => setTypeFilter(e.target.value || null)}
        >
          <option value="">All Types</option>
          <option value="member">Member</option>
          <option value="public">Public</option>
        </select>
        {/* 
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
          <SelectTrigger className="w-[140px] h-8 max-h-8">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="mirrored">Mirrored</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No organizations found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
            {searchTerm || typeFilter
              ? "Try adjusting your search or filter criteria."
              : "Add GitHub organizations to mirror their repositories."}
          </p>
          {searchTerm || typeFilter ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter(null);
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
          {filteredOrganizations.map((org, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">{org.name}</h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      org.type === "member"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {org.type === "member" ? "Member" : "Public"}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {org.repositoryCount} repositories
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`include-${org.id}`}
                      checked={org.isIncluded}
                      onChange={(e) =>
                        onToggleInclude(org.id || "", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`include-${org.id}`}
                      className="ml-2 text-sm"
                    >
                      Include in mirroring
                    </label>
                  </div>

                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`https://github.com/${org.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
