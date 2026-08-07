import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Номер сторінки (offset-режим)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Розмір сторінки',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Курсор (id останнього елемента попередньої сторінки)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface PaginationMeta {
  limit: number;
  hasNextPage: boolean;

  nextCursor?: string | null;

  total?: number;
  page?: number;
  totalPages?: number;
}

export class PaginatedResult<T> {
  data!: T[];
  meta!: PaginationMeta;
}
