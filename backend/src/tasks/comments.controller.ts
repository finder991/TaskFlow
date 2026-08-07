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
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment-request.dto';

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Список коментарів задачі' })
  list(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.comments.list(userId, taskId, pagination);
  }

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Додати коментар' })
  create(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(userId, taskId, dto);
  }

  @Patch('comments/:id')
  @ApiOperation({ summary: 'Редагувати коментар (лише автор)' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.comments.update(userId, id, dto);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Видалити коментар (автор або власник простору)' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.comments.remove(userId, id);
  }
}
