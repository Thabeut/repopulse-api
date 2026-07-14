import { Module } from '@nestjs/common';
import { GitHubModule } from '../../infrastructure/github/github.module';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { SearchController } from './search.controller';

@Module({
  imports: [GitHubModule],
  controllers: [RepositoriesController, SearchController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
