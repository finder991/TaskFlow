import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Прев’ю запрошення за токеном (публічно)' })
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Прийняти запрошення (потрібна автентифікація)' })
  accept(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @Param('token') token: string,
  ) {
    return this.invitations.accept(userId, email, token);
  }
}
