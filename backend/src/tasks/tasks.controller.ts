import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task-request.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Створити задачу в проєкті' })
  create(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(userId, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Список задач проєкту (фільтри + пагінація)' })
  list(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasks.list(userId, projectId, query);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Деталі задачі' })
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.getById(userId, id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Оновити задачу' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(userId, id, dto);
  }

  @Patch('tasks/:id/move')
  @ApiOperation({ summary: 'Перемістити задачу між колонками (drag & drop)' })
  move(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasks.move(userId, id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Видалити задачу' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.remove(userId, id);
  }

  @Get('tasks/:id/activity')
  @ApiOperation({ summary: 'Історія змін задачі (хто, коли, що змінив)' })
  activity(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.listActivity(userId, id);
  }
}
