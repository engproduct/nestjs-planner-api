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
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Paginated } from '../common/pagination/paginated.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { PatientResponseDto } from './dto/patient-response.dto.js';
import { PatientsService } from './patients.service.js';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiCreatedResponse({ type: PatientResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Email já cadastrado' })
  create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientsService.create(dto);
  }

  @Get()
  @ApiPaginatedResponse(PatientResponseDto)
  @ApiBadRequestResponse({ description: 'page ou limit inválidos' })
  list(
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<PatientResponseDto>> {
    return this.patientsService.list(query);
  }

  @Get(':uuid')
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiBadRequestResponse({ description: 'uuid inválido' })
  @ApiNotFoundResponse({ description: 'Paciente inexistente ou excluído' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.findOne(uuid);
  }
}
