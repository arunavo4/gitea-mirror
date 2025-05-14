import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Download, RefreshCw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { apiRequest, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { MirrorJob } from "@/lib/db/schema";
import type { ActivityApiResponse } from "@/types/activities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { repoStatusEnum, type RepoStatus } from "@/types/Repository";
import ActivityList from "./ActivityList";
import { ActivityNameCombobox } from "./ActivityNameCombobox";
import { useSSE } from "@/hooks/useSEE";
import { useFilterParams } from "@/hooks/useFilterParams";
import { toast } from "sonner";

export function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<MirrorJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { filter, setFilter } = useFilterParams({
    searchTerm: "",
    status: "",
    type: "",
    name: "",
  });

  const handleNewMessage = useCallback((data: MirrorJob) => {
    setActivities((prevActivities) => [data, ...prevActivities]);

    console.log("Received new log:", data);
  }, []);

  // Use the SSE hook
  const { connected } = useSSE({
    userId: user?.id,
    onMessage: handleNewMessage,
  });

  const fetchActivities = useCallback(async () => {
    if (!user) return false;

    try {
      setIsLoading(true);

      const response = await apiRequest<ActivityApiResponse>(
        `/activities?userId=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setActivities(response.activities);
        return true;
      } else {
        toast.error(response.message || "Failed to fetch activities.");
        return false;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch activities."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefreshActivities = async () => {
    const success = await fetchActivities();
    if (success) {
      toast.success("Activities refreshed successfully.");
    }
  };

  // Get the currently filtered activities
  const getFilteredActivities = () => {
    return activities.filter(activity => {
      let isIncluded = true;

      if (filter.status) {
        isIncluded = isIncluded && activity.status === filter.status;
      }

      if (filter.type) {
        if (filter.type === 'repository') {
          isIncluded = isIncluded && !!activity.repositoryId;
        } else if (filter.type === 'organization') {
          isIncluded = isIncluded && !!activity.organizationId;
        }
      }

      if (filter.name) {
        isIncluded = isIncluded && (
          activity.repositoryName === filter.name ||
          activity.organizationName === filter.name
        );
      }

      // Note: We're not applying the search term filter here as that would require
      // re-implementing the Fuse.js search logic

      return isIncluded;
    });
  };

  // Function to export activities as CSV
  const exportAsCSV = () => {
    const filteredActivities = getFilteredActivities();

    if (filteredActivities.length === 0) {
      toast.error("No activities to export.");
      return;
    }

    // Create CSV content
    const headers = ["Timestamp", "Message", "Status", "Repository", "Organization", "Details"];
    const csvRows = [
      headers.join(","),
      ...filteredActivities.map(activity => {
        const formattedDate = formatDate(activity.timestamp);
        // Escape fields that might contain commas or quotes
        const escapeCsvField = (field: string | null | undefined) => {
          if (!field) return '';
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        return [
          formattedDate,
          escapeCsvField(activity.message),
          activity.status,
          escapeCsvField(activity.repositoryName || ''),
          escapeCsvField(activity.organizationName || ''),
          escapeCsvField(activity.details || '')
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');

    // Download the CSV file
    downloadFile(csvContent, 'text/csv;charset=utf-8;', 'activity_log_export.csv');

    toast.success("Activity log exported as CSV successfully.");
  };

  // Function to export activities as JSON
  const exportAsJSON = () => {
    const filteredActivities = getFilteredActivities();

    if (filteredActivities.length === 0) {
      toast.error("No activities to export.");
      return;
    }

    // Format the activities for export (removing any sensitive or unnecessary fields if needed)
    const activitiesForExport = filteredActivities.map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp,
      formattedTime: formatDate(activity.timestamp),
      message: activity.message,
      status: activity.status,
      repositoryId: activity.repositoryId,
      repositoryName: activity.repositoryName,
      organizationId: activity.organizationId,
      organizationName: activity.organizationName,
      details: activity.details
    }));

    const jsonContent = JSON.stringify(activitiesForExport, null, 2);

    // Download the JSON file
    downloadFile(jsonContent, 'application/json', 'activity_log_export.json');

    toast.success("Activity log exported as JSON successfully.");
  };

  // Generic function to download a file
  const downloadFile = (content: string, mimeType: string, filename: string) => {
    // Add date to filename
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const filenameWithDate = filename.replace('.', `_${dateStr}.`);

    // Create a download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filenameWithDate);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-row items-center gap-4 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities..."
            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filter.searchTerm}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
          />
        </div>
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

        {/* Repository/Organization Name Combobox */}
        <ActivityNameCombobox
          activities={activities}
          value={filter.name || ""}
          onChange={(name: string) => setFilter((prev) => ({ ...prev, name }))}
        />
        {/* Filter by type: repository/org/all */}
        <Select
          value={filter.type || "all"}
          onValueChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              type: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger className="w-[140px] h-9 max-h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {['all', 'repository', 'organization'].map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Download className="h-4 w-4 mr-1" />
              Export
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportAsCSV}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsJSON}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleRefreshActivities}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="flex flex-col gap-y-6">
        <ActivityList
          activities={activities}
          isLoading={isLoading || !connected}
          filter={filter}
          setFilter={setFilter}
        />
      </div>
    </div>
  );
}
