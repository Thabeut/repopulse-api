import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { AnalyticsService } from './analytics.service';
import { HistoryQueryDto } from './dto/analytics.dto';

@ApiTags('analytics')
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'Temporary user id until Firebase Auth (Phase 8)',
})
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUserId() userId: string) {
    return this.analyticsService.getDashboard(userId);
  }

  @Get('repositories/:id/history')
  history(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.analyticsService.getHistory(userId, id, query);
  }

  @Get('repositories/:id/languages')
  languages(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.analyticsService.getLanguages(userId, id);
  }

  @Get('repositories/:id/commit-activity')
  commitActivity(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.analyticsService.getCommitActivity(userId, id);
  }
}
