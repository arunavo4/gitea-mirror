import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitFork, ExternalLink } from 'lucide-react';
import type { Repository } from '@/lib/db/schema';

interface RepositoryListProps {
  repositories: Repository[];
  onMirrorNow: (repositoryId: string) => void;
}

export function RepositoryList({ repositories, onMirrorNow }: RepositoryListProps) {
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Repositories</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a href="/repositories">View All</a>
        </Button>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-4">
            {repositories.slice(0, 5).map((repo) => (
              <div key={repo.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{repo.name}</h4>
                    {repo.isPrivate && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Private</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{repo.owner}</span>
                    {repo.organization && (
                      <span className="text-xs text-muted-foreground">• {repo.organization}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(repo.status)}`} />
                  <span className="text-xs capitalize">{repo.status}</span>
                  <Button variant="ghost" size="icon" onClick={() => onMirrorNow(repo.id || '')}>
                    <GitFork className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
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

function getStatusColor(status: string): string {
  switch (status) {
    case 'mirrored':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
    default:
      return 'bg-yellow-500';
  }
}
