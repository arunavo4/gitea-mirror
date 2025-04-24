import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GitMerge } from "lucide-react";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="flex h-[4.5rem] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 py-1">
          {/* the line should be changed to the base domain url */}
          <GitMerge className="h-6 w-6" />
          <span className="text-xl font-bold">Gitea Mirror</span>
        </a>

        <div className="flex items-center gap-4">
          <ModeToggle />
          {user ? (
            <>
              <Avatar>
                <AvatarImage src="" alt="@shadcn" />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="lg" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" size="lg" asChild>
              <a href="/login">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
