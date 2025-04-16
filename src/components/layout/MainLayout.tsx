import * as React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "./ToastProvider";

interface MainLayoutProps {
  children: React.ReactNode;
}

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
