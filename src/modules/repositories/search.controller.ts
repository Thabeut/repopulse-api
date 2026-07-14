import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
  LookupRepositoryQueryDto,
  SearchRepositoriesQueryDto,
} from './dto/repositories.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
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
