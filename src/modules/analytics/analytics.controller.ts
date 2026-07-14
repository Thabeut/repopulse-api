import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HistoryQueryDto } from './dto/analytics.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'Dev-only when AUTH_ALLOW_DEV_HEADER=true',
})
@UseGuards(FirebaseAuthGuard)
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
