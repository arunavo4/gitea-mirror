import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { links } from "@/data/Sidebar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    // Hydration happens here
    const path = window.location.pathname;
    setCurrentPath(path);
    console.log("Hydrated path:", path); // Should log now
  }, []);

  return (
    <aside className={cn("w-64 border-r bg-background", className)}>
      <div className="flex flex-col h-full py-4">
        <nav className="flex flex-col gap-y-1 pl-2 pr-3">
          {links.map((link, index) => {
            const isActive = currentPath === link.href;
            const Icon = link.icon;

            return (
              <a
                key={index}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto px-4 py-4">
          <div className="rounded-md bg-muted p-3">
            <h4 className="text-sm font-medium mb-2">Need Help?</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Check out the documentation for help with setup and configuration.
            </p>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
