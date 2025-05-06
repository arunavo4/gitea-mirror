import * as React from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import Repository from "../repositories/Repository";
import Providers from "./Providers";
import { ConfigTabs } from "../config/ConfigTabs";
import { ActivityLog } from "../activity/ActivityLog";
import { Organization } from "../organizations/Organization";
import { Toaster } from "@/components/ui/sonner";

interface MainLayoutProps {
  children: React.ReactNode;
}

// export function MainLayout({ children }: MainLayoutProps) {
//   return (
//     <AuthProvider>
//       <div className="flex min-h-screen flex-col">
//         <Header />
//         <div className="flex flex-1">
//           <Sidebar />
//           <main className="flex-1 p-6 overflow-y-auto h-[calc(100dvh-4.55rem)]">
//             {/* 72.8px is the height of the header (header 72 + 0.8px border bottom) */}
//             {children}
//           </main>
//         </div>
//         <Toaster />
//       </div>
//     </AuthProvider>
//   );
// }

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
