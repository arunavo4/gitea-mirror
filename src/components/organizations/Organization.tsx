import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, FlipHorizontal, Plus } from "lucide-react";
import type { MirrorJob, Organization } from "@/lib/db/schema";
import { OrganizationList } from "./OrganizationsList";
import { AddOrganizationDialog } from "./AddOrganizationDialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/utils";
import {
  membershipRoleEnum,
  type MembershipRole,
  type OrganizationsApiResponse,
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const { user } = useAuth();
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    membershipRole: "",
    status: "",
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

  const fetchOrganizations = useCallback(async () => {
    if (!user || !user.id) {
      return false;
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
        return true;
      } else {
        toast.error(response.error || "Error fetching organizations");
        return false;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error fetching organizations"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleRefresh = async () => {
    const success = await fetchOrganizations();
    if (success) {
      toast.success("Organizations refreshed successfully.");
    }
  };

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
      toast.error(
        error instanceof Error ? error.message : "Error starting mirror job"
      );
    } finally {
      setLoadingOrgIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orgId);
        return newSet;
      });
    }
  };

  const handleAddOrganization = async (name: string, membershipRole: "member" | "admin" | "billing_manager") => {
    try {
      if (!user || !user.id) {
        toast.error("You must be logged in to add an organization");
        return;
      }

      // Add loading state
      setIsLoading(true);

      // Create new organization object with required fields
      const newOrg: Partial<Organization> = {
        userId: user.id,
        name,
        membershipRole,
        avatarUrl: `https://github.com/${name}.png`, // Default GitHub org avatar URL
        status: "imported",
        isIncluded: false,
        repositoryCount: 0
      };

      // Make API request to add the organization
      const response = await apiRequest<{ success: boolean; organization?: Organization; error?: string }>(
        `/github/organizations`, 
        {
          method: "POST",
          data: { 
            userId: user.id, 
            organization: newOrg 
          }
        }
      );

      if (response.success && response.organization) {
        // Add the new organization to the list
        setOrganizations(prev => [...prev, response.organization as Organization]);
        toast.success(`Organization ${name} added successfully`);
      } else {
        toast.error(response.error || "Error adding organization");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error adding organization"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMirrorAllOrgs = async () => {
    try {
      if (!user || !user.id || organizations.length === 0) {
        return;
      }

      // Filter out organizations that are already mirrored to avoid duplicate operations
      const eligibleOrgs = organizations.filter(
        (org) =>
          org.status !== "mirroring" && org.status !== "mirrored" && org.id
      );

      if (eligibleOrgs.length === 0) {
        toast.info("No eligible organizations to mirror");
        return;
      }

      // Get all organization IDs
      const orgIds = eligibleOrgs.map((org) => org.id as string);

      // Set loading state for all organizations being mirrored
      setLoadingOrgIds((prev) => {
        const newSet = new Set(prev);
        orgIds.forEach((id) => newSet.add(id));
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
      toast.error(
        error instanceof Error ? error.message : "Error starting mirror jobs"
      );
    } finally {
      // Reset loading states - we'll let the SSE updates handle status changes
      setLoadingOrgIds(new Set());
    }
  };

  // Get unique organization names for combobox (since Organization has no owner field)
  const ownerOptions = Array.from(
    new Set(organizations.map((org) => org.name).filter((v): v is string => !!v))
  ).sort();

  return (
    <div className="flex flex-col gap-y-8">
      {/* Combine search and actions into a single flex row */}
      <div className="flex flex-row items-center gap-4 w-full flex-wrap">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Organizations..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filter.searchTerm}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
          />
        </div>

        {/* Membership Role Filter */}
        <Select
          value={filter.membershipRole || "all"}
          onValueChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              membershipRole: value === "all" ? "" : (value as MembershipRole),
            }))
          }
        >
          <SelectTrigger className="w-[140px] h-9 max-h-9">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            {["all", ...membershipRoleEnum.options].map((role) => (
              <SelectItem key={role} value={role}>
                {role === "all"
                  ? "All Roles"
                  : role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filter.status || "all"}
          onValueChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              status: value === "all" ? "" : (value as "" | "imported" | "mirroring" | "mirrored" | "failed" | "syncing" | "synced"),
            }))
          }
        >
          <SelectTrigger className="w-[140px] h-9 max-h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {["all", "imported", "mirroring", "mirrored", "failed", "syncing", "synced"].map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all"
                  ? "All Statuses"
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
          onClick={handleMirrorAllOrgs}
          disabled={isLoading || loadingOrgIds.size > 0}
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
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
        onAddOrganization={() => setIsAddDialogOpen(true)}
      />

      {/* Add Organization button */}
      <Button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Organization Dialog */}
      <AddOrganizationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddOrganization}
      />
    </div>
  );
}
