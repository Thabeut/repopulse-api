import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { SyncService } from './sync.service';

class RunSyncQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Limit sync to current authenticated user when true',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  mineOnly?: boolean;
}

@ApiTags('sync')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'Dev-only when AUTH_ALLOW_DEV_HEADER=true',
})
@UseGuards(FirebaseAuthGuard)
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
