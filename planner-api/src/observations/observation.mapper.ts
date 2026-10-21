import { Prisma } from '../generated/prisma/client.js';
import { ObservationResponseDto } from './dto/observation-response.dto.js';

// A referência sai como uuid: o include traz só o uuid do agendamento.
export const observationInclude = {
  appointment: { select: { uuid: true } },
} satisfies Prisma.ObservationInclude;

export type ObservationWithRefs = Prisma.ObservationGetPayload<{
  include: typeof observationInclude;
}>;

// Não expõe `id`, `appointmentId` (internos) nem `deletedAt`.
export function toObservationResponse(
  observation: ObservationWithRefs,
): ObservationResponseDto {
  return {
    uuid: observation.uuid,
    appointmentUuid: observation.appointment.uuid,
    message: observation.message,
    createdAt: observation.createdAt,
    updatedAt: observation.updatedAt,
  };
}
