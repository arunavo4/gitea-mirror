import { StatusCard } from "./StatusCard";
import { RecentActivity } from "./RecentActivity";
import { RepositoryList } from "./RepositoryList";
import { Button } from "@/components/ui/button";
import { GitFork, Users, GitMerge, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { MirrorJob, Organization, Repository } from "@/lib/db/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/utils";
import type { DashboardApiResponse } from "@/types/dashboard";

export function Dashboard() {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activities, setActivities] = useState<MirrorJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [repoCount, setRepoCount] = useState<number>(0);
  const [orgCount, setOrgCount] = useState<number>(0);
  const [mirroredCount, setMirroredCount] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!user || !user.id) return;

    const eventSource = new EventSource(`/api/sse?userId=${user.id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.repositoryId) {
          setRepositories((prevRepos) =>
            prevRepos.map((repo) =>
              repo.id === data.repositoryId
                ? { ...repo, status: data.status, details: data.details }
                : repo
            )
          );
        } else if (data.organizationId) {
          setOrganizations((prevOrgs) =>
            prevOrgs.map((org) =>
              org.id === data.organizationId
                ? { ...org, status: data.status, details: data.details }
                : org
            )
          );
        }

        setActivities((prevActivities) => [data, ...prevActivities]);

        console.log("Received new log:", data);
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user || !user.id) {
          return;
        }

        setIsLoading(false);

        const response = await apiRequest<DashboardApiResponse>(
          `/dashboard?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        if (response.success) {
          setRepositories(response.repositories);
          setOrganizations(response.organizations);
          setActivities(response.activities);
          setRepoCount(response.repoCount);
          setOrgCount(response.orgCount);
          setMirroredCount(response.mirroredCount);
          setLastSync(response.lastSync);
        } else {
          console.error("Error fetching dashboard data:", response.error);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
          value={repoCount}
          icon={<GitFork className="h-4 w-4" />}
          description="Repositories being mirrored"
        />
        <StatusCard
          title="Mirrored"
          value={mirroredCount}
          icon={<GitMerge className="h-4 w-4" />}
          description="Successfully mirrored"
          trend={{ value: 20, isPositive: true }}
        />
        <StatusCard
          title="Organizations"
          value={orgCount}
          icon={<Users className="h-4 w-4" />}
          description="GitHub organizations"
        />
        <StatusCard
          title="Last Sync"
          value={
            lastSync
              ? new Date(lastSync).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"
          }
          icon={<Clock className="h-4 w-4" />}
          description="Last successful sync"
        />
      </div>

      <div className="flex gap-x-6 items-start">
        <RepositoryList repositories={repositories} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
}
