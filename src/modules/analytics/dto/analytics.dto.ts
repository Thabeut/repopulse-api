import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';

export const HISTORY_METRICS = [
  'stars',
  'forks',
  'openIssues',
  'watchers',
] as const;

export type HistoryMetric = (typeof HISTORY_METRICS)[number];

export class HistoryQueryDto {
  @ApiPropertyOptional({
    enum: HISTORY_METRICS,
    default: 'stars',
  })
  @IsOptional()
  @IsIn(HISTORY_METRICS)
  metric: HistoryMetric = 'stars';

  @ApiPropertyOptional({ description: 'ISO date-time lower bound' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date-time upper bound' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
