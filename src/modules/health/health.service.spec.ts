import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok status with timestamp', () => {
    const result = service.getStatus();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(result.timestamp).toEqual(expect.any(String));
  });
});
