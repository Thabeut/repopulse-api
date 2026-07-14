jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

describe('FirebaseAuthGuard', () => {
  const verifyIdToken = jest.fn();
  const authService = { verifyIdToken } as unknown as AuthService;
  const config = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const guard = new FirebaseAuthGuard(authService, config);

  function createContext(headers: Record<string, string | undefined>) {
    const request: {
      header: (name: string) => string | undefined;
      user?: unknown;
    } = {
      header: (name: string) => headers[name.toLowerCase()],
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (config.get as jest.Mock).mockReturnValue(false);
  });

  it('accepts a valid Bearer token', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-1',
      email: 'a@b.com',
      name: 'A',
      picture: null,
    });
    const ctx = createContext({ authorization: 'Bearer tok' });
    await expect(
      guard.canActivate(ctx as unknown as ExecutionContext),
    ).resolves.toBe(true);
    expect(ctx.request.user).toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
      name: 'A',
      picture: null,
    });
  });

  it('rejects missing auth', async () => {
    const ctx = createContext({});
    await expect(
      guard.canActivate(ctx as unknown as ExecutionContext),
    ).rejects.toThrow(/Bearer token is required/);
  });

  it('allows x-user-id when AUTH_ALLOW_DEV_HEADER is enabled', async () => {
    (config.get as jest.Mock).mockImplementation((key: string) =>
      key === 'auth.allowDevHeader' ? true : false,
    );
    const ctx = createContext({ 'x-user-id': 'dev-user' });
    await expect(
      guard.canActivate(ctx as unknown as ExecutionContext),
    ).resolves.toBe(true);
    expect(ctx.request.user).toEqual({
      uid: 'dev-user',
      email: null,
      name: null,
      picture: null,
    });
  });
});
