import * as React from "react";

export type Paths =
  | "/"
  | "/repositories"
  | "/organizations"
  | "/config"
  | "/activity"
  | "/docs";

export interface SidebarItem {
  href: Paths;
  label: string;
  icon: React.ElementType;
}
