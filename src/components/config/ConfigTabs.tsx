import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHubConfigForm } from "./GitHubConfigForm";
import { GiteaConfigForm } from "./GiteaConfigForm";
import { ScheduleConfigForm } from "./ScheduleConfigForm";
import type {
  ConfigApiResponse,
  GiteaConfig,
  GitHubConfig,
  SaveConfigApiRequest,
  SaveConfigApiResponse,
  ScheduleConfig,
} from "@/types/config";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/utils";
import { Copy, CopyCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type ConfigState = {
  githubConfig: GitHubConfig;
  giteaConfig: GiteaConfig;
  scheduleConfig: ScheduleConfig;
};

export function ConfigTabs() {
  const [config, setConfig] = useState<ConfigState>({
    githubConfig: {
      username: "",
      token: "",
      skipForks: false,
      privateRepositories: false,
      mirrorIssues: false,
      mirrorStarred: false,
      mirrorOrganizations: false,
      onlyMirrorOrgs: false,
      preserveOrgStructure: false,
      skipStarredIssues: false,
    },

    // Mock Gitea config
    giteaConfig: {
      url: "",
      username: "",
      token: "",
      organization: "github-mirrors",
      visibility: "public",
      starredReposOrg: "github",
    },

    // Mock schedule config
    scheduleConfig: {
      enabled: false,
      interval: 3600,
    },
  });
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dockerCode, setDockerCode] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncData = async () => {
    try {
      if (!user?.id) return;

      setIsSyncing(true);

      const result = await apiRequest<{ success: boolean; message?: string }>(
        `/sync?userId=${user.id}`,
        {
          method: "POST",
        }
      );

      if (result.success) {
        toast.success("Data synced successfully!");
      } else {
        toast.error(`Failed to sync data: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      toast.error(
        `Error syncing data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      if (!user || !user.id) {
        return;
      }

      const reqPyload: SaveConfigApiRequest = {
        userId: user.id,
        githubConfig: config.githubConfig,
        giteaConfig: config.giteaConfig,
        scheduleConfig: config.scheduleConfig,
      };
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqPyload),
      });

      const result: SaveConfigApiResponse = await response.json();
      if (result.success) {
        toast.success("Configuration saved successfully!");
      } else {
        toast.error(
          `Failed to save configuration: ${result.message || "Unknown error"}`
        );
      }
    } catch (error) {
      toast.error(
        `An error occurred while saving the configuration: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!user) {
          return;
        }

        setIsLoading(true);

        const response = await apiRequest<ConfigApiResponse>(
          `/config?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        // Check if we have a valid config response
        if (response && !response.error) {
          setConfig({
            githubConfig: response.githubConfig || config.githubConfig,
            giteaConfig: response.giteaConfig || config.giteaConfig,
            scheduleConfig: response.scheduleConfig || config.scheduleConfig,
          });
        }
        // If there's an error, we'll just use the default config defined in state

        setIsLoading(false);
      } catch (error) {
        // Don't show error for first-time users, just use the default config
        console.warn("Could not fetch configuration, using defaults:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  useEffect(() => {
    const generateDockerCode = () => {
      return `version: "3.3"
services:
  gitea-mirror:
    image: arunavo4/gitea-mirror:latest
    restart: unless-stopped
    container_name: gitea-mirror
    environment:
      - GITHUB_USERNAME=${config.githubConfig.username}
      - GITEA_URL=${config.giteaConfig.url}
      - GITEA_TOKEN=${config.giteaConfig.token}
      - GITHUB_TOKEN=${config.githubConfig.token}
      - MIRROR_ISSUES=${config.githubConfig.mirrorIssues}
      - MIRROR_STARRED=${config.githubConfig.mirrorStarred}
      - MIRROR_ORGANIZATIONS=${config.githubConfig.mirrorOrganizations}
      - PRESERVE_ORG_STRUCTURE=${config.githubConfig.preserveOrgStructure}
      - ONLY_MIRROR_ORGS=${config.githubConfig.onlyMirrorOrgs}
      - GITEA_ORGANIZATION=${config.giteaConfig.organization}
      - GITEA_ORG_VISIBILITY=${config.giteaConfig.visibility}
      - DELAY=${config.scheduleConfig.interval}`;
    };

    const code = generateDockerCode();
    setDockerCode(code);
  }, [config]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        toast.success("Docker configuration copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        toast.error("Could not copy text to clipboard.");
      }
    );
  };

  return isLoading ? (
    <div>loading...</div>
  ) : (
    <div className="flex flex-col gap-y-6">
      <Card>
        <CardHeader className="flex-row justify-between">
          <div className="flex flex-col gap-y-1.5 m-0">
            <CardTitle>Configuration Settings</CardTitle>
            <CardDescription>
              Configure your GitHub and Gitea connections, and set up automatic
              mirroring.
            </CardDescription>
          </div>

          <div className="flex gap-x-4">
            <Button onClick={handleSyncData} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  Sync Data
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync Data
                </>
              )}
            </Button>
            <Button onClick={handleSaveConfig}>Save Configuration</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-y-4">
            <div className="flex gap-x-4">
              <GitHubConfigForm
                config={config.githubConfig}
                setConfig={(update) =>
                  setConfig((prev) => ({
                    ...prev,
                    githubConfig:
                      typeof update === "function"
                        ? update(prev.githubConfig)
                        : update,
                  }))
                }
              />

              <GiteaConfigForm
                config={config?.giteaConfig ?? ({} as GiteaConfig)}
                setConfig={(update) =>
                  setConfig((prev) => ({
                    ...prev,
                    giteaConfig:
                      typeof update === "function"
                        ? update(prev.giteaConfig)
                        : update,
                    githubConfig: prev?.githubConfig ?? ({} as GitHubConfig),
                    scheduleConfig:
                      prev?.scheduleConfig ?? ({} as ScheduleConfig),
                  }))
                }
              />
            </div>

            <ScheduleConfigForm
              config={config?.scheduleConfig ?? ({} as ScheduleConfig)}
              setConfig={(update) =>
                setConfig((prev) => ({
                  ...prev,
                  scheduleConfig:
                    typeof update === "function"
                      ? update(prev.scheduleConfig)
                      : update,
                  githubConfig: prev?.githubConfig ?? ({} as GitHubConfig),
                  giteaConfig: prev?.giteaConfig ?? ({} as GiteaConfig),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Docker Configuration</CardTitle>
          <CardDescription>
            Equivalent Docker configuration for your current settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-10"
            onClick={() => handleCopyToClipboard(dockerCode)}
          >
            {isCopied ? (
              <CopyCheck className="text-green-500" />
            ) : (
              <Copy className="text-muted-foreground" />
            )}
          </Button>

          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            {dockerCode}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
