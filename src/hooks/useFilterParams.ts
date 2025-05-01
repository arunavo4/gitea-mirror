import { useState, useEffect } from "react";
import type { MembershipRole } from "@/types/organizations";
import type { RepoStatus } from "@/types/Repository";
import type { FilterParams } from "@/types/filter";

const useFilterParams = (defaultFilters: FilterParams) => {
  // Helper function to get the initial filter state from URL parameters
  const getInitialFilter = (): FilterParams => {
    if (typeof window === "undefined") {
      return defaultFilters;
    }
    const params = new URLSearchParams(window.location.search);
    return {
      searchTerm: params.get("searchTerm") || defaultFilters.searchTerm,
      status: (params.get("status") || defaultFilters.status) as
        | RepoStatus
        | "",
      membershipRole: (params.get("membershipRole") ||
        defaultFilters.membershipRole) as MembershipRole | "",
    };
  };

  // State to hold filter values
  const [filter, setFilter] = useState<FilterParams>(getInitialFilter());

  // Function to update the URL with the current filter state
  const updateUrlParams = (newFilter: FilterParams) => {
    const params = new URLSearchParams();
    if (newFilter.searchTerm) {
      params.set("searchTerm", newFilter.searchTerm);
    }
    if (newFilter.status) {
      params.set("status", newFilter.status);
    }
    if (newFilter.membershipRole) {
      params.set("membershipRole", newFilter.membershipRole);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  // Update the URL whenever the filter changes
  useEffect(() => {
    updateUrlParams(filter);
  }, [filter]);

  return {
    filter,
    setFilter,
  };
};

export default useFilterParams;
