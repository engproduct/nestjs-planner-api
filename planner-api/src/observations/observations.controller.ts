import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
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
}
