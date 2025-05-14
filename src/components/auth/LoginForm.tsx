'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SiGitea } from 'react-icons/si';
import { toast, Toaster } from 'sonner';
import { FlipHorizontal } from 'lucide-react';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    if (!username || !password) {
      toast.error('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    const loginData = { username, password };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!');
        // Small delay before redirecting to see the success message
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred while logging in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SiGitea className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Gitea Mirror</CardTitle>
          <CardDescription>
            Log in to manage your GitHub to Gitea mirroring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="login-form" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </CardFooter>
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </Card>
      <Toaster />
    </>
  );
}
