import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Env } from '../config/env.validation';

export interface InvitationEmail {
  to: string;
  workspaceName: string;
  inviterName: string;
  acceptUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', { infer: true }),
      port: this.config.get('SMTP_PORT', { infer: true }),
      secure: false,
    });
  }

  async sendInvitationEmail({
    to,
    workspaceName,
    inviterName,
    acceptUrl,
  }: InvitationEmail): Promise<void> {
    const from = this.config.get('SMTP_FROM', { infer: true });
    await this.transporter.sendMail({
      from,
      to,
      subject: `Запрошення до робочого простору «${workspaceName}» у TaskFlow`,
      text:
        `${inviterName} запрошує вас приєднатися до «${workspaceName}».\n` +
        `Прийняти запрошення: ${acceptUrl}`,
      html:
        `<p><b>${inviterName}</b> запрошує вас приєднатися до робочого простору ` +
        `<b>${workspaceName}</b> у TaskFlow.</p>` +
        `<p><a href="${acceptUrl}">Прийняти запрошення</a></p>`,
    });
    this.logger.log(`Запрошення надіслано на ${to}`);
  }
}
