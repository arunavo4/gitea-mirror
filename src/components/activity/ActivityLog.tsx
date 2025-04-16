import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ActivityItem {
  id: string;
  message: string;
  timestamp: Date;
  status: "success" | "error" | "info" | "warning";
  details?: string;
  repositoryName?: string;
}

interface ActivityLogProps {
  activities: ActivityItem[];
  onRefresh: () => void;
}

export function ActivityLog({ activities, onRefresh }: ActivityLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter activities based on search term and status filter
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.repositoryName &&
        activity.repositoryName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter
      ? activity.status === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (expandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  const exportLog = () => {
    const csvContent = [
      ["Timestamp", "Status", "Message", "Repository", "Details"].join(","),
      ...filteredActivities.map((activity) =>
        [
          activity.timestamp.toISOString(),
          activity.status,
          `"${activity.message.replace(/"/g, '""')}"`,
          activity.repositoryName || "",
          activity.details ? `"${activity.details.replace(/"/g, '""')}"` : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `activity-log-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-row items-center justify-end">
        {/* <CardTitle className="text-xl">Activity Log</CardTitle> */}
        <div className="flex gap-x-4">
          <Button variant="outline" onClick={exportLog}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onRefresh}>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-x-4">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No activities found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
              {searchTerm || statusFilter
                ? "Try adjusting your search or filter criteria."
                : "No mirroring activities have been recorded yet."}
            </p>
            {searchTerm || statusFilter ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter(null);
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        ) : (
          <Card className="border rounded-md divide-y">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative mt-1">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        activity.status
                      )}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>

                    {activity.repositoryName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Repository: {activity.repositoryName}
                      </p>
                    )}

                    {activity.details && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => toggleExpand(activity.id)}
                          className="text-xs h-7 px-2"
                        >
                          {expandedItems.has(activity.id)
                            ? "Hide Details"
                            : "Show Details"}
                        </Button>

                        {expandedItems.has(activity.id) && (
                          <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                            {activity.details}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    case "info":
    default:
      return "bg-blue-500";
  }
}
