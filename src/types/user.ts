import type { User } from "@/lib/db/schema";

export interface ExtendedUser extends User {
  syncEnabled: boolean;
  syncInterval: number;
  lastSync: Date | null;
  nextSync: Date | null;
}
