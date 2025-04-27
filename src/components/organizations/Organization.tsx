import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Filter } from "lucide-react";
import type { Organization } from "@/lib/db/schema";
import { OrganizationList } from "./OrganizationsList";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/utils";
import type {
  OrgFilter,
  OrgRelationType,
  OrganizationsApiResponse,
} from "@/types/organizations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function Organization() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const [filter, setFilter] = useState<OrgFilter>({
    searchTerm: "",
    type: "",
  });
  const [isComputing, setIsComputing] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user || !user.id) {
        return;
      }

      try {
        setIsLoading(true);

        const response = await apiRequest<OrganizationsApiResponse>(
          `/github/organizations?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        if (response.success) {
          console.log("Organizations:", response.organizations);
          setOrganizations(response.organizations);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  const handleMirrorOrganizations = async ({ orgId }: { orgId: string }) => {
    if (!user || !user.id) {
      return;
    }

    try {
      setIsComputing(true);

      const response = await apiRequest<OrganizationsApiResponse>(
        `/github/organizations/mirror?userId=${user.id}`,
        {
          method: "POST",
        }
      );

      if (response.success) {
        console.log("Organizations mirrored successfully");
        setOrganizations(response.organizations);
      }

      setIsComputing(false);
    } catch (error) {
      console.error("Error mirroring organizations:", error);
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-8">
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
            value={filter.type || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                type: value === "all" ? "" : (value as OrgRelationType),
              }))
            }
          >
            <SelectTrigger className="w-[140px] h-9 max-h-9">
              <SelectValue placeholder="All Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Type</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>

          <Button variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <OrganizationList
        organizations={organizations}
        isLoading={isLoading}
        filter={filter}
        setFilter={setFilter}
        isComputing={isComputing}
        onMirror={handleMirrorOrganizations}
      />
    </div>
  );
}
