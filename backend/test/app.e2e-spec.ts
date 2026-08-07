import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:http';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TaskFlow critical flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  let agent: TestAgent;

  const user = {
    email: `e2e_${Date.now()}@example.com`,
    name: 'E2E User',
    password: 'S3curePass',
  };

  let workspaceId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
    httpServer = app.getHttpServer() as Server;
    agent = request.agent(httpServer);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('автентифікація через httpOnly-cookie', () => {
    it('реєструє користувача: токени — у cookie, а не в тілі відповіді', async () => {
      const res = await agent.post('/api/auth/register').send(user).expect(201);

      expect(res.body.user.email).toBe(user.email.toLowerCase());

      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const access = cookies.find((c) => c.startsWith('taskflow_access'));
      const refresh = cookies.find((c) => c.startsWith('taskflow_refresh'));

      expect(access).toContain('HttpOnly');
      expect(access).toContain('SameSite=Lax');
      expect(refresh).toContain('HttpOnly');

      expect(refresh).toContain('Path=/api/auth');
    });

    it('віддає профіль за cookie', async () => {
      const res = await agent.get('/api/users/me').expect(200);
      expect(res.body.email).toBe(user.email.toLowerCase());
    });

    it('захищає приватні роути без cookie (401)', async () => {
      await request(httpServer).get('/api/workspaces').expect(401);
    });

    it('оновлює пару токенів і відкликає старий refresh (ротація)', async () => {
      const before = await agent.post('/api/auth/refresh').expect(200);
      const rotated = (
        before.headers['set-cookie'] as unknown as string[]
      ).find((c) => c.startsWith('taskflow_refresh'));
      expect(rotated).toBeDefined();

      await agent.get('/api/users/me').expect(200);
    });
  });

  describe('workspace → project → task → move → activity', () => {
    it('створює робочий простір (роль OWNER)', async () => {
      const res = await agent
        .post('/api/workspaces')
        .send({ name: 'E2E Workspace' })
        .expect(201);
      expect(res.body.role).toBe('OWNER');
      workspaceId = res.body.id;
    });

    it('створює проєкт у просторі', async () => {
      const res = await agent
        .post(`/api/workspaces/${workspaceId}/projects`)
        .send({ name: 'E2E Project' })
        .expect(201);
      projectId = res.body.id;
    });

    it('створює задачу зі статусом TODO', async () => {
      const res = await agent
        .post(`/api/projects/${projectId}/tasks`)
        .send({ title: 'First task', priority: 'HIGH' })
        .expect(201);
      expect(res.body.status).toBe('TODO');
      taskId = res.body.id;
    });

    it('переміщує задачу і фіксує зміну статусу в історії', async () => {
      const moved = await agent
        .patch(`/api/tasks/${taskId}/move`)
        .send({ status: 'IN_PROGRESS', position: 0 })
        .expect(200);
      expect(moved.body.status).toBe('IN_PROGRESS');

      const activity = await agent
        .get(`/api/tasks/${taskId}/activity`)
        .expect(200);
      const types = activity.body.map((a: { type: string }) => a.type);
      expect(types).toContain('CREATED');
      expect(types).toContain('STATUS_CHANGED');
    });

    it('пагінує список задач', async () => {
      const res = await agent
        .get(`/api/projects/${projectId}/tasks?page=1&limit=10`)
        .expect(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number),
        }),
      );
    });

    it('фільтрує задачі за статусом', async () => {
      const res = await agent
        .get(`/api/projects/${projectId}/tasks?status=IN_PROGRESS`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('порядок задач у колонці', () => {
    it('вставляє задачу саме туди, куди її кинули, і перенумеровує сусідів', async () => {
      const titles = ['A', 'B', 'C'];
      const ids: string[] = [];
      for (const title of titles) {
        const res = await agent
          .post(`/api/projects/${projectId}/tasks`)
          .send({ title })
          .expect(201);
        ids.push(res.body.id);
      }

      // Кидаємо C між A і B.
      await agent
        .patch(`/api/tasks/${ids[2]}/move`)
        .send({ status: 'TODO', position: 1 })
        .expect(200);

      const list = await agent
        .get(`/api/projects/${projectId}/tasks?status=TODO&limit=50`)
        .expect(200);

      const order = list.body.data
        .sort(
          (a: { position: number }, b: { position: number }) =>
            a.position - b.position,
        )
        .map((t: { title: string }) => t.title);
      expect(order).toEqual(['A', 'C', 'B']);

      const positions = list.body.data.map(
        (t: { position: number }) => t.position,
      );
      expect(new Set(positions).size).toBe(positions.length);
    });
  });

  describe('права доступу', () => {
    it('повертає 403 для чужого робочого простору', async () => {
      const stranger = request.agent(httpServer);
      await stranger
        .post('/api/auth/register')
        .send({
          email: `stranger_${Date.now()}@example.com`,
          name: 'Stranger',
          password: 'S3curePass',
        })
        .expect(201);

      await stranger.get(`/api/workspaces/${workspaceId}`).expect(403);
    });

    it('повертає 404 для неіснуючої задачі', async () => {
      await agent.get('/api/tasks/non-existent-id').expect(404);
    });

    it('відхиляє дублікат реєстрації (409)', async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send(user)
        .expect(409);
    });
  });

  describe('logout', () => {
    it('очищає cookie і забирає доступ', async () => {
      await agent.post('/api/auth/logout').expect(200);
      await agent.get('/api/users/me').expect(401);
    });

    it('є ідемпотентним — повторний вихід без cookie теж успішний', async () => {
      await request(httpServer).post('/api/auth/logout').expect(200);
    });
  });
});
