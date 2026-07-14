import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const DEMO_USER_ID = 'demo-user';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.header('x-user-id')?.trim();
    if (header) {
      return header;
    }
    return process.env.DEMO_USER_ID?.trim() || DEMO_USER_ID;
  },
);
