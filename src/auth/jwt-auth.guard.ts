import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorMessageType } from '../enums/error.message.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: Error, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException(ErrorMessageType.INVALID_AUTH);
    }
    return user;
  }
}
