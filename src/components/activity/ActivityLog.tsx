import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { apiRequest, formatDate, getStatusColor } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { MirrorJob } from "@/lib/db/schema";
import type { ActivityApiResponse, ActivityFilter } from "@/types/activities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { RepoStatus } from "@/types/Repository";
import ActivityList from "./ActivityList";

export function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<MirrorJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<ActivityFilter>({
    searchTerm: "",
    status: "",
  });

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      setIsLoading(true);

      const response = await apiRequest<ActivityApiResponse>(
        `/activities?userId=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setActivities(response.activities);
      } else {
        console.error(response.message);
      }

      setIsLoading(false);
    };

    fetchActivities();
  }, [user]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-row items-center justify-end">
        <div className="flex gap-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-md">
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

          <div className="flex gap-x-4">
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
          </div>
        </div>

        <ActivityList
          activities={activities}
          isLoading={isLoading}
          filter={filter}
          setFilter={setFilter}
        />
      </div>
    </div>
  );
}
