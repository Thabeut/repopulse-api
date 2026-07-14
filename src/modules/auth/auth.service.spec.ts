jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { UsersFirestoreRepository } from '../../infrastructure/firestore/users.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const upsertLogin = jest.fn();
  const users = { upsertLogin } as unknown as UsersFirestoreRepository;
  const verifyIdToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({ verifyIdToken });
  });

  it('throws when Firebase app is missing', async () => {
    const service = new AuthService(null, users);
    await expect(service.verifyIdToken('tok')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('verifies a token and upserts the user', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-1',
      email: 'a@b.com',
      name: 'Ada',
      picture: 'https://img',
    });
    upsertLogin.mockResolvedValue(undefined);
    const service = new AuthService({} as App, users);

    await expect(service.verifyIdToken('good')).resolves.toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
      name: 'Ada',
      picture: 'https://img',
    });
    expect(upsertLogin).toHaveBeenCalledWith({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: 'Ada',
      photoURL: 'https://img',
    });
  });

  it('returns the user when upsert fails', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-2',
      email: null,
      name: null,
      picture: null,
    });
    upsertLogin.mockRejectedValue(new Error('firestore down'));
    const service = new AuthService({} as App, users);

    await expect(service.verifyIdToken('good')).resolves.toEqual({
      uid: 'uid-2',
      email: null,
      name: null,
      picture: null,
    });
  });

  it('maps verify failures to UnauthorizedException', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    const service = new AuthService({} as App, users);
    await expect(service.verifyIdToken('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
