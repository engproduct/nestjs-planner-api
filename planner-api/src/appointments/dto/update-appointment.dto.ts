import { PartialType, PickType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto.js';

// patientUuid fica de fora: é imutável e, no corpo, cai no forbidNonWhitelisted
// (400). skipNullProperties: false → `null` é validado (400) em vez de chegar
// ao banco, como em UpdatePatientDto.
export class UpdateAppointmentDto extends PartialType(
  PickType(CreateAppointmentDto, [
    'startTime',
    'endTime',
    'description',
    'doctorUuid',
  ] as const),
  { skipNullProperties: false },
) {}
