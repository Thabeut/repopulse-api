import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../infrastructure/firestore/firestore.service';

@Injectable()
export class HealthService {
  constructor(private readonly firestore: FirestoreService) {}

  async getStatus() {
    const firestore = await this.firestore.ping();
    return {
      status: firestore === 'down' ? ('degraded' as const) : ('ok' as const),
      uptime: process.uptime(),
      firestore,
      timestamp: new Date().toISOString(),
    };
  }
}
