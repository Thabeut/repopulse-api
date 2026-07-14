import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreService } from '../../infrastructure/firestore/firestore.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const ping = jest.fn();

  beforeEach(async () => {
    ping.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: FirestoreService, useValue: { ping } },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when firestore is unconfigured', async () => {
    ping.mockResolvedValue('unconfigured');
    const result = await service.getStatus();
    expect(result.status).toBe('ok');
    expect(result.firestore).toBe('unconfigured');
  });

  it('returns degraded when firestore is down', async () => {
    ping.mockResolvedValue('down');
    const result = await service.getStatus();
    expect(result.status).toBe('degraded');
    expect(result.firestore).toBe('down');
  });
});
