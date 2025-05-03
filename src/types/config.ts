import { type Config as ConfigType } from "@/lib/db/schema";

export type GiteaOrgVisibility = "public" | "private" | "limited";

export interface GiteaConfig {
  url: string;
  username: string;
  token: string;
  organization: string;
  visibility: GiteaOrgVisibility;
  starredReposOrg: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  interval: number;
  lastRun?: Date;
  nextRun?: Date;
}

export interface GitHubConfig {
  username: string;
  token: string;
  skipForks: boolean;
  privateRepositories: boolean;
  mirrorIssues: boolean;
  mirrorStarred: boolean;
  mirrorOrganizations: boolean;
  onlyMirrorOrgs: boolean;
  preserveOrgStructure: boolean;
  skipStarredIssues: boolean;
}

export interface MockData {
  repositories: any[];
  activities: any[];
  organizations: any[];
  githubConfig: GitHubConfig;
  giteaConfig: GiteaConfig;
  scheduleConfig: ScheduleConfig;
}

export interface SaveConfigApiRequest {
  userId: string;
  githubConfig: GitHubConfig;
  giteaConfig: GiteaConfig;
  scheduleConfig: ScheduleConfig;
}

export interface SaveConfigApiResponse {
  success: boolean;
  message: string;
}

export interface Config extends ConfigType {}

export interface DbConfig {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  githubConfig: {
    username: string;
    token?: string;
    skipForks: boolean;
    privateRepositories: boolean;
    mirrorIssues: boolean;
    mirrorStarred: boolean;
    mirrorOrganizations: boolean;
    onlyMirrorOrgs: boolean;
    useSpecificUser: boolean;
    singleRepo?: string;
    includeOrgs: string[];
    excludeOrgs: string[];
    mirrorPublicOrgs: boolean;
    publicOrgs: string[];
    preserveOrgStructure: boolean;
    skipStarredIssues: boolean;
  };
  giteaConfig: {
    url: string;
    token: string;
    organization?: string;
    visibility: "public" | "private" | "limited";
    starredReposOrg: string;
  };
  include: string[];
  exclude: string[];
  scheduleConfig: {
    enabled: boolean;
    interval: number; // in seconds
    lastRun?: Date; // This can be a Date or number based on your storage strategy
    nextRun?: Date; // Same here, depends on your storage format
  };
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export interface ConfigApiRequest {
  userId: string;
}

export interface ConfigApiResponse {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  githubConfig: GitHubConfig;
  giteaConfig: GiteaConfig;
  scheduleConfig: ScheduleConfig;
  include: string[];
  exclude: string[];
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}
