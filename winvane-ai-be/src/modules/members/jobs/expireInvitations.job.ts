import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Invitation } from '../../invitations/entities/invitation.entity';
import { InvitationStatus } from '../../invitations/enums/invitationStatus.enum';

@Injectable()
export class ExpireInvitationsJob {
  private readonly logger = new Logger(ExpireInvitationsJob.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredInvitations(): Promise<void> {
    const now = new Date();
    try {
      const result = await this.invitationRepository.update(
        {
          status: InvitationStatus.PENDING,
          expiresAt: LessThan(now),
        },
        {
          status: InvitationStatus.EXPIRED,
        },
      );

      const affected = result.affected ?? 0;
      if (affected > 0) {
        this.logger.log(`Marked ${affected} expired invitations.`);
      }
    } catch (error) {
      this.logger.error('Failed to expire overdue invitations', error);
    }
  }
}
