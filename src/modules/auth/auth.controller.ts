import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user-id.decorator';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('auth')
export class AuthController {
  @Get('me')
  me(
    @CurrentUser()
    user: {
      uid: string;
      email: string | null;
      name: string | null;
      picture: string | null;
    },
  ) {
    return user;
  }
}
