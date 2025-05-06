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

interface GitHubConfigFormProps {
  config: GitHubConfig;
  setConfig: React.Dispatch<React.SetStateAction<GitHubConfig>>;
}

export function GitHubConfigForm({ config, setConfig }: GitHubConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const testConnection = async () => {
    if (!config.token) {
      setTestResult({
        success: false,
        message: "GitHub token is required to test the connection",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await githubApi.testConnection(config.token);
      setTestResult({
        success: result.success,
        message: result.success
          ? "Successfully connected to GitHub!"
          : "Failed to connect to GitHub. Please check your token.",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("GitHub Config:", config);
  }, [config]);

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
                Mirror Private Repositories
              </label>
            </div>

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
                Mirror Starred Repositories
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Checkbox
                id="mirror-organizations"
                name="mirrorOrganizations"
                checked={config.mirrorOrganizations}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "mirrorOrganizations",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="mirror-organizations"
                className="ml-2 block text-sm select-none"
              >
                Mirror Organizations
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="only-mirror-orgs"
                name="onlyMirrorOrgs"
                checked={config.onlyMirrorOrgs}
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "onlyMirrorOrgs",
                      type: "checkbox",
                      checked: Boolean(checked),
                      value: "",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              <label
                htmlFor="only-mirror-orgs"
                className="ml-2 block text-sm select-none"
              >
                Only Mirror Organizations
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
                className="ml-2 block text-sm select-none"
              >
                Preserve Organization Structure
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
                Skip Issues for Starred Repositories
              </label>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {testResult && (
          <div
            className={
              testResult.success ? "text-green-500" : "text-red-500"
            }
          >
            {testResult.message}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
