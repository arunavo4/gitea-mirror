import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { giteaApi } from "@/lib/api";
import type { GiteaConfig, GiteaOrgVisibility } from "@/types/config";

interface GiteaConfigFormProps {
  config: GiteaConfig;
  setConfig: React.Dispatch<React.SetStateAction<GiteaConfig>>;
}

export function GiteaConfigForm({ config, setConfig }: GiteaConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value,
    });
  };

  const testConnection = async () => {
    if (!config.url || !config.token) {
      setTestResult({
        success: false,
        message: "Gitea URL and token are required to test the connection",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await giteaApi.testConnection(config.url, config.token);
      setTestResult({
        success: result.success,
        message: result.success
          ? "Successfully connected to Gitea!"
          : "Failed to connect to Gitea. Please check your URL and token.",
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Gitea Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-6">
        <div>
          <label
            htmlFor="gitea-username"
            className="block text-sm font-medium mb-1.5"
          >
            Gitea Username
          </label>
          <input
            id="gitea-username"
            name="username"
            type="text"
            value={config.username}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="https://your-gitea-instance.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="gitea-url"
            className="block text-sm font-medium mb-1.5"
          >
            Gitea URL
          </label>
          <input
            id="gitea-url"
            name="url"
            type="url"
            value={config.url}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="https://your-gitea-instance.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="gitea-token"
            className="block text-sm font-medium mb-1.5"
          >
            Gitea Token
          </label>
          <input
            id="gitea-token"
            name="token"
            type="password"
            value={config.token}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Your Gitea access token"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Create a token in your Gitea instance under Settings &gt;
            Applications.
          </p>
        </div>

        <div>
          <label
            htmlFor="organization"
            className="block text-sm font-medium mb-1.5"
          >
            Default Organization (Optional)
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            value={config.organization}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Organization name"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If specified, repositories will be mirrored to this organization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium mb-1.5"
            >
              Organization Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={config.visibility}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {(["public", "private", "limited"] as GiteaOrgVisibility[]).map(
                (option, index) => (
                  <option key={index} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="starred-repos-org"
              className="block text-sm font-medium mb-1.5"
            >
              Starred Repositories Organization
            </label>
            <input
              id="starred-repos-org"
              name="starredReposOrg"
              type="text"
              value={config.starredReposOrg}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="github"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Organization for starred repositories (default: github)
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="">
        {testResult && (
          <div
            className={`${
              testResult.success ? "text-green-500" : "text-red-500"
            }`}
          >
            {testResult.message}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={isLoading || !config.url || !config.token}
          className="ml-auto"
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </CardFooter>
    </Card>
  );
}
