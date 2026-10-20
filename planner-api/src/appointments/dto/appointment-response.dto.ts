import { ApiProperty } from '@nestjs/swagger';

const utcDescription = 'Instante em UTC (ISO 8601 com Z)';

export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  uuid!: string;

  @ApiProperty({ format: 'uuid' })
  patientUuid!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'uuid do User com role DOCTOR',
  })
  doctorUuid!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-10-20T13:00:00.000Z',
    description: utcDescription,
  })
  startTime!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-10-20T13:30:00.000Z',
    description: utcDescription,
  })
  endTime!: string;

  @ApiProperty({ example: 'Consulta de rotina' })
  description!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
