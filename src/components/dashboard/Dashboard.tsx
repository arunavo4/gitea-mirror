import { StatusCard } from "./StatusCard";
import { RecentActivity } from "./RecentActivity";
import { RepositoryList } from "./RepositoryList";
import { Button } from "@/components/ui/button";
import { GitFork, Users, GitMerge, Clock } from "lucide-react";

interface DashboardProps {
  repositories: any[];
  activities: any[];
  isLoading: boolean;
}

export function Dashboard({
  repositories,
  activities,
  isLoading,
}: DashboardProps) {
  const handleMirrorNow = (repositoryId: string) => {
    console.log("Mirror now clicked for repository:", repositoryId);
    // In a real implementation, this would call the API to start mirroring
  };

  return isLoading ? (
    <div>loading...</div>
  ) : (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center justify-end">
        {/* <h1 className="text-3xl font-bold">Dashboard</h1> */}
        <Button>
          <GitMerge className="mr-2 h-4 w-4" />
          Start Mirroring
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Total Repositories"
          value={repositories.length}
          icon={<GitFork className="h-4 w-4" />}
          description="Repositories being mirrored"
        />
        <StatusCard
          title="Mirrored"
          value={repositories.filter((r) => r.status === "mirrored").length}
          icon={<GitMerge className="h-4 w-4" />}
          description="Successfully mirrored"
          trend={{ value: 20, isPositive: true }}
        />
        <StatusCard
          title="Organizations"
          value="2"
          icon={<Users className="h-4 w-4" />}
          description="GitHub organizations"
        />
        <StatusCard
          title="Last Sync"
          value="2 hours ago"
          icon={<Clock className="h-4 w-4" />}
          description="Last successful sync"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <RepositoryList
          repositories={repositories}
          onMirrorNow={handleMirrorNow}
        />
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
}
