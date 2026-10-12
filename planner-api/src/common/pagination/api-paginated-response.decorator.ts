import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from './paginated.js';

// Documenta no Swagger a resposta `{ data: Item[], meta }`.
export function ApiPaginatedResponse(item: Type<unknown>) {
  return applyDecorators(
    ApiExtraModels(PaginationMetaDto, item),
    ApiOkResponse({
      schema: {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(item) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
        required: ['data', 'meta'],
      },
    }),
  );
}
