import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function createHost(url = '/api/v1/repositories') {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  }

  it('formats HttpException into error envelope', () => {
    const { host, status, json } = createHost();
    filter.catch(
      new HttpException('Validation failed', HttpStatus.BAD_REQUEST),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        path: '/api/v1/repositories',
      }),
    );
  });

  it('maps unknown errors to 500', () => {
    const { host, status, json } = createHost();
    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'boom',
      }),
    );
  });
});
