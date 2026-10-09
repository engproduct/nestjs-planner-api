import { Patient } from '../generated/prisma/client.js';
import { PatientResponseDto } from './dto/patient-response.dto.js';

// Não expõe `id` (interno) nem `deletedAt`.
export function toPatientResponse(patient: Patient): PatientResponseDto {
  return {
    uuid: patient.uuid,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    birthDate: patient.birthDate.toISOString().slice(0, 10),
    gender: patient.gender,
    height: patient.height,
    weight: Number(patient.weight),
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}
