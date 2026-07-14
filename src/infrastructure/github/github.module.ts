import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GitHubCache } from './github.cache';
import { GitHubClient } from './github.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('github.timeoutMs') ?? 10000,
        maxRedirects: 3,
      }),
    }),
  ],
  providers: [GitHubCache, GitHubClient],
  exports: [GitHubClient, GitHubCache],
})
export class GitHubModule {}
