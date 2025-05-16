import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { githubApi } from "@/lib/api";
import type { GitHubConfig } from "@/types/config";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface GitHubConfigFormProps {
  config: GitHubConfig;
  setConfig: React.Dispatch<React.SetStateAction<GitHubConfig>>;
}

export function GitHubConfigForm({ config, setConfig }: GitHubConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Special handling for preserveOrgStructure changes
    if (
      name === "preserveOrgStructure" &&
      config.preserveOrgStructure !== checked
    ) {
      toast.info(
        "Changing this setting may affect how repositories are accessed in Gitea. " +
          "Existing mirrored repositories will still be accessible during sync operations.",
        {
          duration: 6000,
          position: "top-center",
        }
      );
    }

    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const testConnection = async () => {
    if (!config.token) {
      toast.error("GitHub token is required to test the connection");
      return;
    }

    setIsLoading(true);

    try {
      const result = await githubApi.testConnection(config.token);
      if (result.success) {
        toast.success("Successfully connected to GitHub!");
      } else {
        toast.error("Failed to connect to GitHub. Please check your token.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg font-semibold">
          GitHub Configuration
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={isLoading || !config.token}
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-6">
        <div>
          <label
            htmlFor="github-username"
            className="block text-sm font-medium mb-1.5"
          >
            GitHub Username
          </label>
          <Input
            id="github-username"
            name="username"
            type="text"
            value={config.username}
            onChange={handleChange}
            placeholder="Your GitHub username"
            required
            className="bg-background"
          />
        </div>

        <div>
          <label
            htmlFor="github-token"
            className="block text-sm font-medium mb-1.5"
          >
            GitHub Token
          </label>
          <Input
            id="github-token"
            name="token"
            type="password"
            value={config.token}
            onChange={handleChange}
            className="bg-background"
            placeholder="Your GitHub personal access token"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required for private repositories, organizations, and starred
            repositories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <Checkbox
                id="skip-forks"
                name="skipForks"
                checked={config.skipForks}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "skipForks",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="skip-forks"
                className="ml-2 block text-sm select-none"
              >
                Skip Forks
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="private-repositories"
                name="privateRepositories"
                checked={config.privateRepositories}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "privateRepositories",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="private-repositories"
                className="ml-2 block text-sm select-none"
              >
                Mirror Private Repos
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="mirror-starred"
                name="mirrorStarred"
                checked={config.mirrorStarred}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "mirrorStarred",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="mirror-starred"
                className="ml-2 block text-sm select-none"
              >
                Mirror Starred Repos
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Checkbox
                id="mirror-issues"
                name="mirrorIssues"
                checked={config.mirrorIssues}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "mirrorIssues",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="mirror-issues"
                className="ml-2 block text-sm select-none"
              >
                Mirror Issues
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="preserve-org-structure"
                name="preserveOrgStructure"
                checked={config.preserveOrgStructure}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "preserveOrgStructure",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="preserve-org-structure"
                className="ml-2 text-sm select-none flex items-center"
              >
                Preserve Org Structure
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="ml-1 cursor-pointer align-middle text-muted-foreground"
                      role="button"
                      tabIndex={0}
                    >
                      <Info size={16} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    When enabled, organization repositories will be mirrored to
                    the same organization structure in Gitea. When disabled, all
                    repositories will be mirrored under your Gitea username.
                  </TooltipContent>
                </Tooltip>
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="skip-starred-issues"
                name="skipStarredIssues"
                checked={config.skipStarredIssues}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "skipStarredIssues",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="skip-starred-issues"
                className="ml-2 block text-sm select-none"
              >
                Skip Issues for Starred Repos
              </label>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start">
        <Alert variant="note" className="w-full">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
          <AlertDescription className="text-sm">
            <div className="font-semibold mb-1">Note:</div>
            <div className="mb-1">
              You need to create a{" "}
              <span className="font-semibold">Classic GitHub PAT Token</span>{" "}
              with following scopes:
            </div>
            <ul className="ml-4 mb-1 list-disc">
              <li>
                <code>repo</code>
              </li>
              <li>
                <code>admin:org</code>
              </li>
            </ul>
            <div className="mb-1">
              The organization access is required for mirroring organization
              repositories.
            </div>
            <div>
              You can generate tokens at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200"
              >
                github.com/settings/tokens
              </a>
              .
            </div>
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
}
