import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { LoaderCircle, Plus } from "lucide-react";
import type { MembershipRole } from "@/types/organizations";
import { RadioGroup, RadioGroupItem } from "../ui/radio";
import { Label } from "../ui/label";

interface AddOrganizationDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  onAddOrganization: ({
    org,
    role,
  }: {
    org: string;
    role: MembershipRole;
  }) => Promise<void>;
}

export default function AddOrganizationDialog({
  isDialogOpen,
  setIsDialogOpen,
  onAddOrganization,
}: AddOrganizationDialogProps) {
  const [org, setOrg] = useState<string>("");
  const [role, setRole] = useState<MembershipRole>("member");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!org || org.trim() === "") {
      setError("Please enter a valid organization name.");
      return;
    }

    try {
      setIsLoading(true);

      await onAddOrganization({ org, role });

      setError("");
      setOrg("");
      setRole("member");
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to add repository.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg p-0">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] gap-0 gap-y-6">
        <DialogHeader>
          <DialogTitle>Add Organization</DialogTitle>
          <DialogDescription>
            You can add public organizations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
              >
                Organization Name
              </label>
              <input
                id="name"
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g., microsoft"
                autoComplete="off"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Membership Role
              </label>

              <RadioGroup
                value={role}
                onValueChange={(val) => setRole(val as MembershipRole)}
                className="flex flex-col gap-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="r1" />
                  <Label htmlFor="r1">Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="r2" />
                  <Label htmlFor="r2">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="billing_manager" id="r3" />
                  <Label htmlFor="r3">Billing Manager</Label>
                </div>
              </RadioGroup>
            </div>

            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Add Repository"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
