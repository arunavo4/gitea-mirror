import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { githubApi } from '@/lib/api';

interface GitHubConfigFormProps {
  initialValues?: {
    username: string;
    token: string;
    skipForks: boolean;
    privateRepositories: boolean;
    mirrorIssues: boolean;
    mirrorStarred: boolean;
    mirrorOrganizations: boolean;
    onlyMirrorOrgs: boolean;
    preserveOrgStructure: boolean;
    skipStarredIssues: boolean;
  };
  onSave: (values: any) => void;
}

export function GitHubConfigForm({ initialValues, onSave }: GitHubConfigFormProps) {
  const [values, setValues] = useState({
    username: initialValues?.username || '',
    token: initialValues?.token || '',
    skipForks: initialValues?.skipForks || false,
    privateRepositories: initialValues?.privateRepositories || false,
    mirrorIssues: initialValues?.mirrorIssues || false,
    mirrorStarred: initialValues?.mirrorStarred || false,
    mirrorOrganizations: initialValues?.mirrorOrganizations || false,
    onlyMirrorOrgs: initialValues?.onlyMirrorOrgs || false,
    preserveOrgStructure: initialValues?.preserveOrgStructure || false,
    skipStarredIssues: initialValues?.skipStarredIssues || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const testConnection = async () => {
    if (!values.token) {
      setTestResult({
        success: false,
        message: 'GitHub token is required to test the connection',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await githubApi.testConnection(values.token);
      setTestResult({
        success: result.success,
        message: result.success
          ? 'Successfully connected to GitHub!'
          : 'Failed to connect to GitHub. Please check your token.',
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
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                GitHub Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={values.username}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Your GitHub username"
                required
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium mb-1">
                GitHub Token
              </label>
              <input
                id="token"
                name="token"
                type="password"
                value={values.token}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Your GitHub personal access token"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for private repositories, organizations, and starred repositories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="skipForks"
                    name="skipForks"
                    type="checkbox"
                    checked={values.skipForks}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="skipForks" className="ml-2 block text-sm">
                    Skip Forks
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="privateRepositories"
                    name="privateRepositories"
                    type="checkbox"
                    checked={values.privateRepositories}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="privateRepositories" className="ml-2 block text-sm">
                    Mirror Private Repositories
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="mirrorIssues"
                    name="mirrorIssues"
                    type="checkbox"
                    checked={values.mirrorIssues}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="mirrorIssues" className="ml-2 block text-sm">
                    Mirror Issues
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="mirrorStarred"
                    name="mirrorStarred"
                    type="checkbox"
                    checked={values.mirrorStarred}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="mirrorStarred" className="ml-2 block text-sm">
                    Mirror Starred Repositories
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="mirrorOrganizations"
                    name="mirrorOrganizations"
                    type="checkbox"
                    checked={values.mirrorOrganizations}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="mirrorOrganizations" className="ml-2 block text-sm">
                    Mirror Organizations
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="onlyMirrorOrgs"
                    name="onlyMirrorOrgs"
                    type="checkbox"
                    checked={values.onlyMirrorOrgs}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="onlyMirrorOrgs" className="ml-2 block text-sm">
                    Only Mirror Organizations
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="preserveOrgStructure"
                    name="preserveOrgStructure"
                    type="checkbox"
                    checked={values.preserveOrgStructure}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="preserveOrgStructure" className="ml-2 block text-sm">
                    Preserve Organization Structure
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="skipStarredIssues"
                    name="skipStarredIssues"
                    type="checkbox"
                    checked={values.skipStarredIssues}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="skipStarredIssues" className="ml-2 block text-sm">
                    Skip Issues for Starred Repositories
                  </label>
                </div>
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
              disabled={isLoading || !values.token}
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
