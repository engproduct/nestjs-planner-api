import { Prisma } from '../generated/prisma/client.js';
import { AppointmentResponseDto } from './dto/appointment-response.dto.js';

// As referências saem como uuid: o include traz só o uuid de cada lado.
export const appointmentInclude = {
  patient: { select: { uuid: true } },
  user: { select: { uuid: true } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRefs = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

// Não expõe `id`, `patientId`, `userId` (internos) nem `deletedAt`.
export function toAppointmentResponse(
  appointment: AppointmentWithRefs,
): AppointmentResponseDto {
  return {
    uuid: appointment.uuid,
    patientUuid: appointment.patient.uuid,
    doctorUuid: appointment.user.uuid,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    description: appointment.description,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}
