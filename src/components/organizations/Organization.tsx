import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Filter, Users } from "lucide-react";
import type { MirrorJob, Organization } from "@/lib/db/schema";
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
import { useSSE } from "@/hooks/useSEE";
import { useFilterParams } from "@/hooks/useFilterParams";
import { toast } from "sonner";

export function Organization() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    membershipRole: "",
  });
  const [loadingOrgIds, setLoadingOrgIds] = useState<Set<string>>(new Set()); // this is used when the api actions are performed

  // Create a stable callback using useCallback
  const handleNewMessage = useCallback((data: MirrorJob) => {
    if (data.organizationId) {
      setOrganizations((prevOrgs) =>
        prevOrgs.map((org) =>
          org.id === data.organizationId
            ? { ...org, status: data.status, details: data.details }
            : org
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
          setOrganizations(response.organizations);
        } else {
          toast.error(response.error || "Error fetching organizations");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error fetching organizations"
        );
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
        toast.success(`Mirroring started for organization ID: ${orgId}`);

        setOrganizations((prevOrgs) =>
          prevOrgs.map((org) => {
            const updated = response.organizations.find((o) => o.id === org.id);
            return updated ? updated : org;
          })
        );
      } else {
        toast.error(response.error || "Error starting mirror job");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error starting mirror job");
    } finally {
      setLoadingOrgIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orgId);
        return newSet;
      });
    }
  };
  
  const handleMirrorAllOrgs = async () => {
    try {
      if (!user || !user.id || organizations.length === 0) {
        return;
      }

      // Filter out organizations that are already mirrored to avoid duplicate operations
      const eligibleOrgs = organizations.filter(org => 
        org.status !== "mirroring" && 
        org.status !== "mirrored" && 
        org.id
      );
      
      if (eligibleOrgs.length === 0) {
        toast.info("No eligible organizations to mirror");
        return;
      }
      
      // Get all organization IDs
      const orgIds = eligibleOrgs.map(org => org.id as string);
      
      // Set loading state for all organizations being mirrored
      setLoadingOrgIds(prev => {
        const newSet = new Set(prev);
        orgIds.forEach(id => newSet.add(id));
        return newSet;
      });

      const reqPayload: MirrorOrgRequest = {
        userId: user.id,
        organizationIds: orgIds,
      };

      const response = await apiRequest<MirrorOrgResponse>("/job/mirror-org", {
        method: "POST",
        data: reqPayload,
      });

      if (response.success) {
        toast.success(`Mirroring started for ${orgIds.length} organizations`);
        setOrganizations((prevOrgs) =>
          prevOrgs.map((org) => {
            const updated = response.organizations.find((o) => o.id === org.id);
            return updated ? updated : org;
          })
        );
      } else {
        toast.error(response.error || "Error starting mirror jobs");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error starting mirror jobs");
    } finally {
      // Reset loading states - we'll let the SSE updates handle status changes
      setLoadingOrgIds(new Set());
    }
  };

  const handleRefresh = async () => {
    try {
      if (!user || !user.id) {
        return;
      }

      setIsLoading(true);

      const response = await apiRequest<OrganizationsApiResponse>(
        `/github/organizations?userId=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setOrganizations(response.organizations);
        toast.success("Organizations refreshed successfully.");
      } else {
        toast.error(response.error || "Error refreshing organizations");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error refreshing organizations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-8">
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

        <Button variant="default" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

        <Button variant="default" onClick={handleMirrorAllOrgs} disabled={isLoading || loadingOrgIds.size > 0}>
            <Users className="h-4 w-4 mr-2" />
            Mirror All
          </Button>
      </div>

      <OrganizationList
        organizations={organizations}
        isLoading={isLoading || !connected}
        filter={filter}
        setFilter={setFilter}
        loadingOrgIds={loadingOrgIds}
        onMirror={handleMirrorOrg}
      />
    </div>
  );
}
