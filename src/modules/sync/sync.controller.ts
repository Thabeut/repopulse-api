import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { SyncService } from './sync.service';

class RunSyncQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Limit sync to current x-user-id when true',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  mineOnly?: boolean;
}

@ApiTags('sync')
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'Temporary user id until Firebase Auth (Phase 8)',
})
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  status() {
    return this.syncService.getStatus();
  }

  @Post('run')
  run(@CurrentUserId() userId: string, @Query() query: RunSyncQueryDto) {
    return this.syncService.runAll({
      force: query.force ?? false,
      userId: query.mineOnly ? userId : undefined,
    });
  }
}
