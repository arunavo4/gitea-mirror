import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/utils";
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
import type { RepoStatus } from "@/types/Repository";
import ActivityList from "./ActivityList";
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
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
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
