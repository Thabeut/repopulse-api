import { HttpException, HttpStatus } from '@nestjs/common';

export class GitHubNotFoundError extends HttpException {
  constructor(message = 'GitHub resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class GitHubRateLimitError extends HttpException {
  constructor(resetAt?: number | null) {
    const resetHint = resetAt
      ? ` Reset at ${new Date(resetAt * 1000).toISOString()}.`
      : '';
    super(
      `GitHub API rate limit exceeded.${resetHint}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class GitHubUpstreamError extends HttpException {
  constructor(message = 'GitHub API request failed') {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}
