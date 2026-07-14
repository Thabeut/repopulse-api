import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  @Get()
  list(@Query() query: PaginationQueryDto) {
    return {
      data: [],
      meta: buildPaginationMeta(query.page, query.limit, 0),
    };
  }
}
