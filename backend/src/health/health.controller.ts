import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_QUEUE } from '../queue/email-queue.constants';

type ServiceStatus = 'up' | 'down';

interface HealthReport {
  status: 'ok' | 'error';
  info: {
    database: { status: ServiceStatus };
    redis: { status: ServiceStatus };
  };
  uptime: number;
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health-check (стан БД і Redis, uptime)' })
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthReport> {
    const [database, redis] = await Promise.all([
      this.probe(() => this.prisma.$queryRaw`SELECT 1`),
      this.probe(() => this.emailQueue.getJobCounts()),
    ]);

    const healthy = database === 'up';

    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: healthy ? 'ok' : 'error',
      info: { database: { status: database }, redis: { status: redis } },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async probe(run: () => Promise<unknown>): Promise<ServiceStatus> {
    try {
      await run();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
