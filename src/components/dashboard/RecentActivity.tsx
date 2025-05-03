import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MirrorJob } from "@/lib/db/schema";
import { formatDate, getStatusColor } from "@/lib/utils";

interface RecentActivityProps {
  activities: MirrorJob[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-border">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-x-4 py-4">
                <div className="relative mt-1">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      activity.status
                    )}`}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
