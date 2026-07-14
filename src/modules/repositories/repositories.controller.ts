import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import {
  FavoriteRepositoryDto,
  ListRepositoriesQueryDto,
  SaveRepositoryDto,
} from './dto/repositories.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('repositories')
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'Temporary user id until Firebase Auth (Phase 8)',
})
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query() query: ListRepositoriesQueryDto,
  ) {
    return this.repositoriesService.list(userId, query);
  }

  @Get('by-full-name/:owner/:name')
  getByFullName(
    @CurrentUserId() userId: string,
    @Param('owner') owner: string,
    @Param('name') name: string,
  ) {
    return this.repositoriesService.getByFullName(userId, owner, name);
  }

  @Get(':id')
  getById(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.repositoriesService.getById(userId, id);
  }

  @Post()
  save(@CurrentUserId() userId: string, @Body() dto: SaveRepositoryDto) {
    return this.repositoriesService.save(userId, dto);
  }

  @Post(':id/refresh')
  refresh(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.repositoriesService.refresh(userId, id);
  }

  @Patch(':id/favorite')
  favorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: FavoriteRepositoryDto,
  ) {
    return this.repositoriesService.setFavorite(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.repositoriesService.remove(userId, id);
    return { deleted: true };
  }
}
