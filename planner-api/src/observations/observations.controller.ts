import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/pagination/api-paginated-response.decorator.js';
import { Paginated } from '../common/pagination/paginated.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { CreateObservationDto } from './dto/create-observation.dto.js';
import { ObservationResponseDto } from './dto/observation-response.dto.js';
import { ObservationsService } from './observations.service.js';

@ApiTags('observations')
@Controller()
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post('appointments/:uuid/observations')
  @ApiCreatedResponse({ type: ObservationResponseDto })
  @ApiBadRequestResponse({ description: 'uuid ou message inválidos' })
  @ApiNotFoundResponse({ description: 'Agendamento inexistente ou excluído' })
  @ApiConflictResponse({
    description:
      'Paciente excluído ou médico excluído/sem role DOCTOR: histórico só leitura',
  })
  create(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CreateObservationDto,
  ): Promise<ObservationResponseDto> {
    return this.observationsService.create(uuid, dto);
  }

  @Get('appointments/:uuid/observations')
  @ApiPaginatedResponse(ObservationResponseDto)
  @ApiBadRequestResponse({ description: 'uuid, page ou limit inválidos' })
  @ApiNotFoundResponse({ description: 'Agendamento inexistente ou excluído' })
  listByAppointment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<ObservationResponseDto>> {
    return this.observationsService.listByAppointment(uuid, query);
  }

  @Get('observations/:uuid')
  @ApiOkResponse({ type: ObservationResponseDto })
  @ApiBadRequestResponse({ description: 'uuid inválido' })
  @ApiNotFoundResponse({ description: 'Observação inexistente ou excluída' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ObservationResponseDto> {
    return this.observationsService.findOne(uuid);
  }
}
