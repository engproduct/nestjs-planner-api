import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMetaDto;
}

export function paginated<T>(
  data: T[],
  total: number,
  query: { page: number; limit: number },
): Paginated<T> {
  return { data, meta: { page: query.page, limit: query.limit, total } };
}
