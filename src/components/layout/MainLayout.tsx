import * as React from "react";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ToastProvider } from "./ToastProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RepositoryTable } from "../repositories/RepositoryTable";
import Providers from "./Providers";
import type { Repository } from "@/lib/db/schema";
import type { RepositoryApiResponse } from "@/types/Repository";
import { apiRequest } from "@/lib/utils";
import { ConfigTabs } from "../config/ConfigTabs";
import type {
  ConfigApiResponse,
  GiteaConfig,
  GitHubConfig,
  ScheduleConfig,
} from "@/types/config";

interface MainLayoutProps {
  children: React.ReactNode;
}

type ConfigState = {
  githubConfig: GitHubConfig;
  giteaConfig: GiteaConfig;
  scheduleConfig: ScheduleConfig;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-[calc(100dvh-4.55rem)]">
              {/* 72.8px is the height of the header (header 72 + 0.8px border bottom) */}
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

interface AppProps {
  page:
    | "dashboard"
    | "repositories"
    | "organizations"
    | "configuration"
    | "activity-log";
}

export default function App({ page }: AppProps) {
  return (
    <Providers>
      <AppWithProviders page={page} />
    </Providers>
  );
}

function AppWithProviders({ page }: AppProps) {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        if (!user) {
          console.error("User not found");
          return;
        }

        setIsLoading(true);

        const response = await apiRequest<RepositoryApiResponse>(
          `/github/repositories?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        if (response.repositories) {
          setRepositories(response.repositories);
        } else {
          console.error("No repositories found");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching repositories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [user]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!user) {
          console.error("User not found");
          return;
        }

        setIsConfigLoading(true);

        const response = await apiRequest<ConfigApiResponse>(
          `/config?userId=${user.id}`,
          {
            method: "GET",
          }
        );

        if (!response.error) {
          setConfig({
            githubConfig: response.githubConfig,
            giteaConfig: response.giteaConfig,
            scheduleConfig: response.scheduleConfig,
          });
        }

        setIsConfigLoading(false);
      } catch (error) {
        console.error("Error fetching configuration:", error);
      } finally {
        setIsConfigLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <section className="flex-1 p-6 overflow-y-auto h-[calc(100dvh-4.55rem)]">
          {page === "dashboard" && (
            <Dashboard
              repositories={repositories}
              activities={[]}
              isLoading={isLoading} // Assuming you have activities data. will be replaced with actual data
            />
          )}
          {page === "repositories" && (
            <RepositoryTable
              repositories={repositories}
              isLoading={isLoading}
            />
          )}
          {page === "organizations" && <div>Organizations Content</div>}
          {page === "configuration" && config && (
            <ConfigTabs
              configPlaceholders={config}
              isLoading={isConfigLoading}
            />
          )}
          {page === "activity-log" && <div>Activity Log Content</div>}
        </section>
      </div>
    </main>
  );
}
