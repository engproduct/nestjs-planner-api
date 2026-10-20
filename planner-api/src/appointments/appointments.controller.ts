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
  ApiCreatedResponse,
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
}
