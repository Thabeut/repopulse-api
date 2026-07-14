import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthUser } from './auth.types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('authorization');

    if (header?.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        throw new UnauthorizedException('Missing Bearer token');
      }
      request.user = await this.authService.verifyIdToken(token);
      return true;
    }

    const allowDevHeader =
      this.config.get<boolean>('auth.allowDevHeader') === true;
    const devUserId = request.header('x-user-id')?.trim();
    if (allowDevHeader && devUserId) {
      const user: AuthUser = {
        uid: devUserId,
        email: null,
        name: null,
        picture: null,
      };
      request.user = user;
      return true;
    }

    throw new UnauthorizedException(
      'Authorization Bearer token is required',
    );
  }
}
