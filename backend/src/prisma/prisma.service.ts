import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: new PrismaPg(process.env.DATABASE_URL ?? ''),
    });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      this.logger.warn('Пропущено підключення до БД (SKIP_DB_CONNECT=true)');
      return;
    }
    await this.$connect();
    this.logger.log('Prisma підключено до бази даних');
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase() заборонено у production');
    }
    await this.taskActivity.deleteMany();
    await this.comment.deleteMany();
    await this.task.deleteMany();
    await this.project.deleteMany();
    await this.invitation.deleteMany();
    await this.workspaceMember.deleteMany();
    await this.workspace.deleteMany();
    await this.refreshToken.deleteMany();
    await this.user.deleteMany();
  }
}
