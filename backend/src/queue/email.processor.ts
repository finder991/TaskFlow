import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InvitationEmail, MailService } from '../mail/mail.service';
import { EMAIL_JOB, EMAIL_QUEUE } from './email-queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EMAIL_JOB.INVITATION:
        await this.mail.sendInvitationEmail(job.data as InvitationEmail);
        break;
      default:
        this.logger.warn(`Невідомий тип задачі черги: ${job.name}`);
    }
  }
}
