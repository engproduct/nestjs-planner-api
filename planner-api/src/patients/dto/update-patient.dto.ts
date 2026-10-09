import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto.js';

// skipNullProperties: false → campos omitidos são opcionais, mas `null` é
// validado (e rejeitado com 400) em vez de chegar ao banco como NOT NULL.
export class UpdatePatientDto extends PartialType(CreatePatientDto, {
  skipNullProperties: false,
}) {}
