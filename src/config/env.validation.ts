import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsString()
  GITHUB_TOKEN?: string;

  @IsOptional()
  @IsString()
  GITHUB_API_BASE_URL?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  GITHUB_TIMEOUT_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  GITHUB_CACHE_TTL_SECONDS?: number;

  @IsOptional()
  @IsBooleanString()
  SYNC_ENABLED?: string;

  @IsOptional()
  @IsString()
  SYNC_CRON?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  SYNC_CONCURRENCY?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  SYNC_MIN_INTERVAL_MINUTES?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  SNAPSHOT_RETENTION?: number;

  @IsOptional()
  @IsString()
  FIREBASE_PROJECT_ID?: string;

  @IsOptional()
  @IsString()
  FIREBASE_CLIENT_EMAIL?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PRIVATE_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }

  return validated;
}
