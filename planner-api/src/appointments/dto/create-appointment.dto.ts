import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsIsoDateTimeWithOffset } from '../../common/validation/is-iso-date-time-with-offset.js';
import { DESCRIPTION_MAX_LENGTH } from '../domain/appointment.js';

const dateTimeDescription = 'ISO 8601 com offset obrigatório (Z ou ±hh:mm)';

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientUuid!: string;

  @ApiProperty({
    format: 'uuid',
    example: '3f1c5a0e-8b7d-4c52-9a41-6d2e7f9b0a11',
    description: 'uuid de um User com role DOCTOR',
  })
  @IsUUID()
  doctorUuid!: string;

  @ApiProperty({
    example: '2026-10-20T10:00:00-03:00',
    description: dateTimeDescription,
  })
  @IsIsoDateTimeWithOffset()
  startTime!: string;

  @ApiProperty({
    example: '2026-10-20T10:30:00-03:00',
    description: `${dateTimeDescription}; posterior a startTime`,
  })
  @IsIsoDateTimeWithOffset()
  endTime!: string;

  @ApiProperty({
    example: 'Consulta de rotina',
    maxLength: DESCRIPTION_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description!: string;
}
