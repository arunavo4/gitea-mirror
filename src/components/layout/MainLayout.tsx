import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import Repository from "../repositories/Repository";
import Providers from "./Providers";
import { ConfigTabs } from "../config/ConfigTabs";
import { ActivityLog } from "../activity/ActivityLog";
import { Organization } from "../organizations/Organization";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRepoSync } from "@/hooks/useSyncRepo";

interface AppProps {
  page:
    | "dashboard"
    | "repositories"
    | "organizations"
    | "configuration"
    | "activity-log";
  "client:load"?: boolean;
  "client:idle"?: boolean;
  "client:visible"?: boolean;
  "client:media"?: string;
  "client:only"?: boolean | string;
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
  useRepoSync({
    userId: user?.id,
    enabled: user?.syncEnabled,
    interval: user?.syncInterval,
    lastSync: user?.lastSync,
    nextSync: user?.nextSync,
  });

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <section className="flex-1 p-6 overflow-y-auto h-[calc(100dvh-4.55rem)]">
          {page === "dashboard" && <Dashboard />}
          {page === "repositories" && <Repository />}
          {page === "organizations" && <Organization />}
          {page === "configuration" && <ConfigTabs />}
          {page === "activity-log" && <ActivityLog />}
        </section>
      </div>
      <Toaster />
    </main>
  );
}
