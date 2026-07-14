import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
