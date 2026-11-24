import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLER_NAME_AUTH } from '../../../common/constants';
import { Public } from '../../auth-core/decorators/public.decorator';
import { AcceptInviteDto } from '../dto/acceptInvite.dto';
import type {
  IInvitationAcceptResponse,
  IInvitationValidateResponse,
} from '../interfaces/members.interface';
import { InvitationAcceptService } from '../services/invitationAccept.service';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationAcceptService: InvitationAcceptService,
  ) {}

  @Get('validate')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate an invitation token for the accept page' })
  @ApiOkResponse({ description: 'Invitation details for acceptance' })
  @ApiBadRequestResponse({ description: 'Invalid or revoked token' })
  async validate(
    @Query('token') token: string,
  ): Promise<IInvitationValidateResponse> {
    return this.invitationAcceptService.validateToken(token);
  }

  @Post('accept')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an invitation by setting password and activating account',
  })
  @ApiOkResponse({ description: 'Account activated successfully' })
  @ApiBadRequestResponse({
    description: 'Password policy violation or invalid token',
  })
  async accept(
    @Body() dto: AcceptInviteDto,
  ): Promise<IInvitationAcceptResponse> {
    return this.invitationAcceptService.accept(dto);
  }
}
