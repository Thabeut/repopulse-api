import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('wraps plain payload in success envelope', (done) => {
    interceptor.intercept({} as never, {
      handle: () => of({ status: 'ok' }),
    }).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { status: 'ok' },
      });
      done();
    });
  });

  it('preserves data and meta when already shaped', (done) => {
    interceptor.intercept({} as never, {
      handle: () =>
        of({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
    }).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
      done();
    });
  });
});
