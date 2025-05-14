import { useMemo, useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { MirrorJob } from "@/lib/db/schema";
import Fuse from "fuse.js";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { Card } from "../ui/card";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import type { FilterParams } from "@/types/filter";

interface ActivityListProps {
  activities: MirrorJob[];
  isLoading: boolean;
  filter: FilterParams;
  setFilter: (filter: FilterParams) => void;
}

export default function ActivityList({
  activities,
  isLoading,
  filter,
  setFilter,
}: ActivityListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const filteredActivities = useMemo(() => {
    let result = activities;

    if (filter.status) {
      result = result.filter((activity) => activity.status === filter.status);
    }

    if (filter.type) {
      if (filter.type === 'repository') {
        result = result.filter((activity) => !!activity.repositoryId);
      } else if (filter.type === 'organization') {
        result = result.filter((activity) => !!activity.organizationId);
      }
    }

    if (filter.name) {
      result = result.filter((activity) => 
        activity.repositoryName === filter.name || 
        activity.organizationName === filter.name
      );
    }

    if (filter.searchTerm) {
      const fuse = new Fuse(result, {
        keys: ["message", "details", "organizationName", "repositoryName"],
        threshold: 0.3,
      });
      result = fuse.search(filter.searchTerm).map((res) => res.item);
    }

    return result;
  }, [activities, filter]);

  const virtualizer = useVirtualizer({
    count: filteredActivities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const activity = filteredActivities[index];
      return expandedItems.has(activity.id || "") ? 217 : 120;
    },
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height + 8,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [expandedItems, virtualizer]);

  return isLoading ? (
    <div className="flex flex-col gap-y-4">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-md" />
      ))}
    </div>
  ) : filteredActivities.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No activities found</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
        {filter.searchTerm || filter.status || filter.type || filter.name
          ? "Try adjusting your search or filter criteria."
          : "No mirroring activities have been recorded yet."}
      </p>
      {filter.searchTerm || filter.status || filter.type || filter.name ? (
        <Button
          variant="outline"
          onClick={() => {
            setFilter({ searchTerm: "", status: "", type: "", name: "" });
          }}
        >
          Clear Filters
        </Button>
      ) : (
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      )}
    </div>
  ) : (
    <Card
      className="border rounded-md max-h-[calc(100dvh-191px)] overflow-y-auto relative"
      ref={parentRef}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const activity = filteredActivities[virtualRow.index];
          const isExpanded = expandedItems.has(activity.id || "");
          const key = activity.id || String(virtualRow.index);

          return (
            <div
              key={key}
              ref={(node) => {
                if (node) {
                  rowRefs.current.set(key, node);
                  virtualizer.measureElement(node);
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "8px",
              }}
              className="border-b px-4 pt-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative mt-2">
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

                  {activity.organizationName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Organization: {activity.organizationName}
                    </p>
                  )}

                  {activity.details && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const newSet = new Set(expandedItems);
                          const id = activity.id || "";
                          newSet.has(id) ? newSet.delete(id) : newSet.add(id);
                          setExpandedItems(newSet);
                        }}
                        className="text-xs h-7 px-2"
                      >
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </Button>

                      {isExpanded && (
                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto whitespace-pre-wrap min-h-[100px]">
                          {activity.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
