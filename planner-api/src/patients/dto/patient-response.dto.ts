import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../generated/prisma/enums.js';

export class PatientResponseDto {
  @ApiProperty({ format: 'uuid' })
  uuid!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: '+5511987654321' })
  phone!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ example: '1990-05-20' })
  birthDate!: string;

  @ApiProperty({ enum: Gender })
  gender!: Gender;

  @ApiProperty({ description: 'cm' })
  height!: number;

  @ApiProperty({ description: 'kg' })
  weight!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
