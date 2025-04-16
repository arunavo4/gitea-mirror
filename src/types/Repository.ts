export interface Filter {
  searchTerm: string;
  status: "pending" | "mirrored" | "failed" | "";
  name: string;
  organization: string;
  owner: string;
  lastMirrored: string;
}
