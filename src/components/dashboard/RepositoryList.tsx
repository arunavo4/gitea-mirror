import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitFork } from "lucide-react";
import { SiGithub } from "react-icons/si";
import type { Repository } from "@/lib/db/schema";
import { getStatusColor } from "@/lib/utils";

interface RepositoryListProps {
  repositories: Repository[];
}

export function RepositoryList({ repositories }: RepositoryListProps) {
  return (
    <Card className="w-full">
      {/* calculating the max height based non the other elements and sizing styles */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Repositories</CardTitle>
        <Button variant="outline" asChild>
          <a href="/repositories">View All</a>
        </Button>
      </CardHeader>
      <CardContent className="max-h-[calc(100dvh-22.5rem)] overflow-y-auto">
        {repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <GitFork className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No repositories found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Configure your GitHub connection to start mirroring repositories.
            </p>
            <Button asChild>
              <a href="/config">Configure GitHub</a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {repositories.map((repo, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-x-4 py-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{repo.name}</h4>
                    {repo.isPrivate && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {repo.owner}
                    </span>
                    {repo.organization && (
                      <span className="text-xs text-muted-foreground">
                        • {repo.organization}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      repo.status
                    )}`}
                  />
                  <span className="text-xs capitalize w-[3rem]">
                    {/* setting the minimum width to 3rem corresponding to the largest status (mirrored) so that all are left alligned */}
                    {repo.status}
                  </span>
                  <Button variant="ghost" size="icon">
                    <GitFork className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      >
                       <SiGithub className="h-4 w-4" />
                      </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
