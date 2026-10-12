import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
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
