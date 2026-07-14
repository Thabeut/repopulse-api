export interface GitHubSearchItemRaw {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubSearchResponseRaw {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubSearchItemRaw[];
}

export interface GitHubRepoRaw {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  subscribers_count?: number;
  open_issues_count: number;
  fork: boolean;
  topics?: string[];
  license: { spdx_id: string | null; name: string } | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubContributorRaw {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface GitHubReleaseRaw {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  html_url: string;
}

export interface GitHubCommitRaw {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string } | null;
}

export interface GitHubCommitActivityWeekRaw {
  days: number[];
  total: number;
  week: number;
}

export interface NormalizedSearchItem {
  githubId: number;
  fullName: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  owner: string;
  ownerAvatarUrl: string;
}

export interface NormalizedRepository {
  githubId: number;
  owner: string;
  ownerAvatarUrl: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  topics: string[];
  license: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  isFork: boolean;
  contributors: Array<{
    login: string;
    avatarUrl: string;
    contributions: number;
    htmlUrl: string;
  }>;
  releases: Array<{
    tagName: string;
    name: string;
    publishedAt: string | null;
    htmlUrl: string;
  }>;
  recentCommits: Array<{
    sha: string;
    message: string;
    author: string | null;
    date: string | null;
    htmlUrl: string;
  }>;
  commitActivity: number[];
}

export interface GitHubRateLimitInfo {
  remaining: number | null;
  reset: number | null;
  limit: number | null;
}
