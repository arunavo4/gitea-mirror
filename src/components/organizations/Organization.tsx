import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Filter } from "lucide-react";
import type { Organization } from "@/lib/db/schema";
import { OrganizationList } from "./OrganizationsList";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/utils";
import type {
  MembershipRole,
  OrganizationsApiResponse,
} from "@/types/organizations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { MirrorOrgRequest, MirrorOrgResponse } from "@/types/mirror";
import useFilterParams from "@/hooks/useFilterParams";

export function Organization() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    membershipRole: "",
  });
  const [loadingOrgIds, setLoadingOrgIds] = useState<Set<string>>(new Set()); // this is used when the api actions are performed

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
        } else {
          console.error("Error fetching organizations:", response.error);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  const handleMirrorOrg = async ({ orgId }: { orgId: string }) => {
    try {
      if (!user || !user.id) {
        return;
      }

      setLoadingOrgIds((prev) => new Set(prev).add(orgId));

      const reqPayload: MirrorOrgRequest = {
        userId: user.id,
        organizationIds: [orgId],
      };

      const response = await apiRequest<MirrorOrgResponse>("/job/mirror-org", {
        method: "POST",
        data: reqPayload,
      });

      if (response.success) {
        console.log("Mirror job started successfully:", response);

        setOrganizations((prevOrgs) =>
          prevOrgs.map((org) => {
            const updated = response.organizations.find((o) => o.id === org.id);
            return updated ? updated : org;
          })
        );
      } else {
        console.error("Error mirroring repository:", response.error);
      }
    } catch (error) {
      console.error("Error mirroring repository:", error);
    } finally {
      setLoadingOrgIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orgId);
        return newSet;
      });
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
            value={filter.membershipRole || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                membershipRole:
                  value === "all" ? "" : (value as MembershipRole),
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
              <SelectItem value="billing_manager">Billing Manager</SelectItem>
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
        loadingOrgIds={loadingOrgIds}
        onMirror={handleMirrorOrg}
      />
    </div>
  );
}
