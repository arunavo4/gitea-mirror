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
  preserveOrgStructure: boolean;
  skipStarredIssues: boolean;
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
