import { Injectable } from '@nestjs/common';
import { Comment, Prisma, Task, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const AUTHOR_INCLUDE = {
  author: { select: { id: true, email: true, name: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'email' | 'name'> | null;
};
export type CommentWithTask = Comment & { task: Task };

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    taskId: string;
    authorId: string;
    body: string;
  }): Promise<CommentWithAuthor> {
    return this.prisma.comment.create({ data, include: AUTHOR_INCLUDE });
  }

  findByIdWithTask(id: string): Promise<CommentWithTask | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });
  }

  findManyWithTotal(
    taskId: string,
    page: number,
    limit: number,
  ): Promise<[number, CommentWithAuthor[]]> {
    return this.prisma.$transaction([
      this.prisma.comment.count({ where: { taskId } }),
      this.prisma.comment.findMany({
        where: { taskId },
        include: AUTHOR_INCLUDE,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
  }

  update(id: string, body: string): Promise<CommentWithAuthor> {
    return this.prisma.comment.update({
      where: { id },
      data: { body },
      include: AUTHOR_INCLUDE,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
