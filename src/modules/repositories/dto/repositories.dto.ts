import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const OWNER_NAME = /^[a-zA-Z0-9._-]+$/;

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return undefined;
}

export class SearchRepositoriesQueryDto {
  @ApiProperty({ example: 'nestjs' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  q!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  perPage: number = 20;
}

export class LookupRepositoryQueryDto {
  @ApiProperty({ example: 'nestjs' })
  @IsString()
  @Matches(OWNER_NAME)
  owner!: string;

  @ApiProperty({ example: 'nest' })
  @IsString()
  @Matches(OWNER_NAME)
  name!: string;
}

export class SaveRepositoryDto {
  @ApiProperty({ example: 'nestjs' })
  @IsString()
  @Matches(OWNER_NAME)
  owner!: string;

  @ApiProperty({ example: 'nest' })
  @IsString()
  @Matches(OWNER_NAME)
  name!: string;
}

export class ListRepositoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  favorited?: boolean;

  @ApiPropertyOptional({
    enum: ['updatedAt', 'stars', 'forks', 'name', 'createdAt'],
  })
  @IsOptional()
  @IsIn(['updatedAt', 'stars', 'forks', 'name', 'createdAt'])
  sort?: 'updatedAt' | 'stars' | 'forks' | 'name' | 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class FavoriteRepositoryDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  favorited!: boolean;
}
