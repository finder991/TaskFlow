import { PrismaClient, TaskPriority, TaskStatus, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Демо-дані для швидкого старту.
 * Логіни: owner@taskflow.local / member@taskflow.local, пароль: Password123
 */
async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@taskflow.local' },
    update: {},
    create: { email: 'owner@taskflow.local', name: 'Demo Owner', passwordHash },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.local' },
    update: {},
    create: { email: 'member@taskflow.local', name: 'Demo Member', passwordHash },
  });

  const existing = await prisma.workspace.findFirst({
    where: { name: 'Demo Workspace', ownerId: owner.id },
  });
  if (existing) {
    console.log('Демо-дані вже існують — пропускаю.');
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Demo Workspace',
      ownerId: owner.id,
      members: {
        create: [
          { userId: owner.id, role: WorkspaceRole.OWNER },
          { userId: member.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Website Redesign',
      description: 'Демо-проєкт із набором задач',
    },
  });

  const seedTasks: Array<{
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
  }> = [
    { title: 'Зібрати вимоги', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: owner.id },
    { title: 'Дизайн головної', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: member.id },
    { title: 'Верстка компонентів', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    { title: 'Налаштувати CI', status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeId: owner.id },
    { title: 'Аудит безпеки', status: TaskStatus.TODO, priority: TaskPriority.URGENT },
  ];

  const positions: Record<TaskStatus, number> = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
  };

  for (const t of seedTasks) {
    await prisma.task.create({
      data: {
        projectId: project.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId ?? null,
        createdById: owner.id,
        position: positions[t.status]++,
      },
    });
  }

  console.log('✅ Seed завершено. Логін: owner@taskflow.local / Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
