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
      console.log("Saving config:", reqPyload);
      // Save the Schedule config to the database
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqPyload),
      });

      const result: SaveConfigApiResponse = await response.json();
      if (result.success) {
        console.log("Config saved successfully:", result);
        document.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Schedule configuration saved successfully!",
              type: "success",
            },
          })
        );
        // Configuration saved; form state is preserved without reload
      } else {
        console.log("Config saved successfully:", result);
        document.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: `Failed to save Schedule configuration: ${result.message}`,
              type: "error",
            },
          })
        );
      }
    } catch (error) {
      console.error("Error saving Schedule config:", error);
      document.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message:
              "An error occurred while saving the Schedule configuration.",
            type: "error",
          },
        })
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

        if (!response.error) {
          console.log("Fetched configuration:", response);
          setConfig({
            githubConfig: response.githubConfig,
            giteaConfig: response.giteaConfig,
            scheduleConfig: response.scheduleConfig,
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

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
          <Button onClick={handleSaveConfig}>Save Configuration</Button>
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

      {/* <Card>
        <CardHeader>
          <CardTitle>Docker Configuration</CardTitle>
          <CardDescription>
            Equivalent Docker configuration for your current settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            {`version: "3.3"
services:
  gitea-mirror:
    image: arunavo4/gitea-mirror:latest
    restart: unless-stopped
    container_name: gitea-mirror
    environment:
      - GITHUB_USERNAME=${githubConfig.username}
      - GITEA_URL=${giteaConfig.url}
      - GITEA_TOKEN=your-gitea-token
      - GITHUB_TOKEN=your-github-token
      - MIRROR_ISSUES=${githubConfig.mirrorIssues}
      - MIRROR_STARRED=${githubConfig.mirrorStarred}
      - MIRROR_ORGANIZATIONS=${githubConfig.mirrorOrganizations}
      - PRESERVE_ORG_STRUCTURE=${githubConfig.preserveOrgStructure}
      - ONLY_MIRROR_ORGS=${githubConfig.onlyMirrorOrgs}
      - GITEA_ORGANIZATION=${giteaConfig.organization}
      - GITEA_ORG_VISIBILITY=${giteaConfig.visibility}
      - DELAY=${scheduleConfig.interval}`}
          </pre>
        </CardContent>
      </Card> */}
    </div>
  );
}
