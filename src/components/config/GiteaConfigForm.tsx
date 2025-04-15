import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { giteaApi } from '@/lib/api';

interface GiteaConfigFormProps {
  initialValues?: {
    url: string;
    token: string;
    organization: string;
    visibility: string;
    starredReposOrg: string;
  };
  onSave: (values: any) => void;
}

export function GiteaConfigForm({ initialValues, onSave }: GiteaConfigFormProps) {
  const [values, setValues] = useState({
    url: initialValues?.url || '',
    token: initialValues?.token || '',
    organization: initialValues?.organization || '',
    visibility: initialValues?.visibility || 'public',
    starredReposOrg: initialValues?.starredReposOrg || 'github',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const testConnection = async () => {
    if (!values.url || !values.token) {
      setTestResult({
        success: false,
        message: 'Gitea URL and token are required to test the connection',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await giteaApi.testConnection(values.url, values.token);
      setTestResult({
        success: result.success,
        message: result.success
          ? 'Successfully connected to Gitea!'
          : 'Failed to connect to Gitea. Please check your URL and token.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-1">
                Gitea URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                value={values.url}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="https://your-gitea-instance.com"
                required
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium mb-1">
                Gitea Token
              </label>
              <input
                id="token"
                name="token"
                type="password"
                value={values.token}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Your Gitea access token"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Create a token in your Gitea instance under Settings &gt; Applications.
              </p>
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium mb-1">
                Default Organization (Optional)
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                value={values.organization}
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
                <label htmlFor="visibility" className="block text-sm font-medium mb-1">
                  Organization Visibility
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={values.visibility}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="limited">Limited</option>
                </select>
              </div>

              <div>
                <label htmlFor="starredReposOrg" className="block text-sm font-medium mb-1">
                  Starred Repositories Organization
                </label>
                <input
                  id="starredReposOrg"
                  name="starredReposOrg"
                  type="text"
                  value={values.starredReposOrg}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="github"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Organization for starred repositories (default: github)
                </p>
              </div>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-md ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isLoading || !values.url || !values.token}
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button type="submit">Save Configuration</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
