import { ApiProperty } from '@nestjs/swagger';

export class ObservationResponseDto {
  @ApiProperty({ format: 'uuid' })
  uuid!: string;

  @ApiProperty({ format: 'uuid' })
  appointmentUuid!: string;

  @ApiProperty({ example: 'Paciente relata melhora após o ajuste da dose' })
  message!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
