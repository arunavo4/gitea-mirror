import type { MembershipRole } from "./organizations";
import type { RepoStatus } from "./Repository";

export interface FilterParams {
  searchTerm?: string;
  status?: RepoStatus | "";
  membershipRole?: MembershipRole | "";
  owner?: string;
  organization?: string;
}
