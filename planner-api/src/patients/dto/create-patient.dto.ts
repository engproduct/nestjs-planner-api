import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Gender } from '../../generated/prisma/enums.js';
import { normalizeEmail } from '../patient.rules.js';

export class CreatePatientDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+5511987654321', description: 'Formato E.164' })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1990-05-20', description: 'YYYY-MM-DD, não futura' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  birthDate!: string;

  @ApiProperty({ enum: Gender, example: Gender.FEMALE })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: 165, description: 'Altura em cm (30 a 300)' })
  @IsInt()
  @Min(30)
  @Max(300)
  height!: number;

  @ApiProperty({ example: 62.5, description: 'Peso em kg (0.5 a 700)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(700)
  weight!: number;
}
