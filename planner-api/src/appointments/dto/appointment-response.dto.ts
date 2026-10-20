import { ApiProperty } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  uuid!: string;

  @ApiProperty({ format: 'uuid' })
  patientUuid!: string;

  @ApiProperty({ format: 'uuid' })
  doctorUuid!: string;

  @ApiProperty({ example: '2026-10-20T13:00:00.000Z', description: 'UTC' })
  startTime!: string;

  @ApiProperty({ example: '2026-10-20T13:30:00.000Z', description: 'UTC' })
  endTime!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
