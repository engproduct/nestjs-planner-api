import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/pagination/api-paginated-response.decorator.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Paginated } from '../common/pagination/paginated.js';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentResponseDto } from './dto/appointment-response.dto.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiCreatedResponse({ type: AppointmentResponseDto })
  @ApiBadRequestResponse({ description: 'Dados ou intervalo inválidos' })
  @ApiNotFoundResponse({
    description: 'Paciente ou médico inexistente, excluído ou sem role DOCTOR',
  })
  create(@Body() dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiPaginatedResponse(AppointmentResponseDto)
  @ApiBadRequestResponse({ description: 'page ou limit inválidos' })
  list(
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<AppointmentResponseDto>> {
    return this.appointmentsService.list(query);
  }

  @Get(':uuid')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiBadRequestResponse({ description: 'uuid inválido' })
  @ApiNotFoundResponse({ description: 'Agendamento inexistente ou excluído' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiBadRequestResponse({
    description: 'uuid, dados ou intervalo combinado inválidos',
  })
  @ApiNotFoundResponse({
    description:
      'Agendamento inexistente ou excluído; ou médico inexistente, excluído ou sem role DOCTOR',
  })
  @ApiConflictResponse({
    description:
      'Paciente excluído ou médico atual excluído/sem role DOCTOR: histórico só leitura',
  })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(uuid, dto);
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Agendamento excluído (soft delete)' })
  @ApiBadRequestResponse({ description: 'uuid inválido' })
  @ApiNotFoundResponse({ description: 'Agendamento inexistente ou excluído' })
  @ApiConflictResponse({ description: 'Agendamento com observação ativa' })
  remove(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<void> {
    return this.appointmentsService.remove(uuid);
  }
}
