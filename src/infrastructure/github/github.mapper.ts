import {
  GitHubCommitActivityWeekRaw,
  GitHubCommitRaw,
  GitHubContributorRaw,
  GitHubReleaseRaw,
  GitHubRepoRaw,
  GitHubSearchItemRaw,
  NormalizedRepository,
  NormalizedSearchItem,
} from './github.types';

const MAX_CONTRIBUTORS = 25;
const MAX_RELEASES = 10;
const MAX_COMMITS = 10;

export function mapSearchItem(raw: GitHubSearchItemRaw): NormalizedSearchItem {
  return {
    githubId: raw.id,
    fullName: raw.full_name,
    name: raw.name,
    description: raw.description,
    htmlUrl: raw.html_url,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    language: raw.language,
    owner: raw.owner.login,
    ownerAvatarUrl: raw.owner.avatar_url,
  };
}

export function mapRepository(input: {
  repo: GitHubRepoRaw;
  languages: Record<string, number>;
  contributors: GitHubContributorRaw[];
  releases: GitHubReleaseRaw[];
  commits: GitHubCommitRaw[];
  commitActivity: GitHubCommitActivityWeekRaw[] | null;
}): NormalizedRepository {
  const { repo } = input;

  return {
    githubId: repo.id,
    owner: repo.owner.login,
    ownerAvatarUrl: repo.owner.avatar_url,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    primaryLanguage: repo.language,
    languages: input.languages,
    topics: repo.topics ?? [],
    license: repo.license?.spdx_id ?? repo.license?.name ?? null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.subscribers_count ?? repo.watchers_count,
    openIssues: repo.open_issues_count,
    isFork: repo.fork,
    contributors: input.contributors.slice(0, MAX_CONTRIBUTORS).map((c) => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      contributions: c.contributions,
      htmlUrl: c.html_url,
    })),
    releases: input.releases.slice(0, MAX_RELEASES).map((r) => ({
      tagName: r.tag_name,
      name: r.name ?? r.tag_name,
      publishedAt: r.published_at,
      htmlUrl: r.html_url,
    })),
    recentCommits: input.commits.slice(0, MAX_COMMITS).map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0] ?? '',
      author: c.author?.login ?? c.commit.author?.name ?? null,
      date: c.commit.author?.date ?? null,
      htmlUrl: c.html_url,
    })),
    commitActivity: (input.commitActivity ?? []).map((week) => week.total),
  };
}
