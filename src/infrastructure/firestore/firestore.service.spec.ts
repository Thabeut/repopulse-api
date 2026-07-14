import { ServiceUnavailableException } from '@nestjs/common';
import { FirestoreService } from './firestore.service';

describe('FirestoreService', () => {
  it('reports unconfigured when db is null', async () => {
    const service = new FirestoreService(null);
    expect(service.isConfigured()).toBe(false);
    expect(await service.ping()).toBe('unconfigured');
  });

  it('throws a clear error when getDb is called without config', () => {
    const service = new FirestoreService(null);
    expect(() => service.getDb()).toThrow(ServiceUnavailableException);
    expect(() => service.getDb()).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('pings up when a query succeeds', async () => {
    const db = {
      collection: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      }),
    };
    const service = new FirestoreService(db as never);
    expect(service.isConfigured()).toBe(true);
    expect(await service.ping()).toBe('up');
  });

  it('pings down when a query fails', async () => {
    const db = {
      collection: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('network')),
        }),
      }),
    };
    const service = new FirestoreService(db as never);
    expect(await service.ping()).toBe('down');
  });
});
