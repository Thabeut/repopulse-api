import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  LookupRepositoryQueryDto,
  SearchRepositoriesQueryDto,
} from './dto/repositories.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get('repositories')
  search(@Query() query: SearchRepositoriesQueryDto) {
    return this.repositoriesService.search(query);
  }

  @Get('repositories/by-name')
  preview(@Query() query: LookupRepositoryQueryDto) {
    return this.repositoriesService.preview(query);
  }
}
