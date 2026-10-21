import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Observation } from './domain/observation.js';
import { CreateObservationDto } from './dto/create-observation.dto.js';
import { ObservationResponseDto } from './dto/observation-response.dto.js';
import {
  observationInclude,
  toObservationResponse,
} from './observation.mapper.js';

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    appointmentUuid: string,
    dto: CreateObservationDto,
  ): Promise<ObservationResponseDto> {
    // Regras do próprio agregado (message) antes das referências.
    const observation = Observation.register({
      appointmentUuid,
      message: dto.message,
    });

    return this.prisma.$transaction(async (tx) => {
      // Trava a linha do agendamento até o fim da transação: o DELETE de
      // agendamento usa o mesmo lock, então ele não é excluído enquanto a
      // observação é criada (I4), nem o inverso.
      const locked = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM appointments
        WHERE uuid = ${appointmentUuid}::uuid AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('Appointment not found');
      }
      const appointment = await tx.appointment.findUniqueOrThrow({
        where: { id: locked[0].id },
        select: {
          id: true,
          uuid: true,
          patient: { select: { deletedAt: true } },
          user: { select: { deletedAt: true, role: true } },
        },
      });

      // Histórico de paciente ou médico inativo é só leitura (R10), como no
      // PATCH de agendamento (#47).
      if (
        appointment.patient.deletedAt !== null ||
        appointment.user.deletedAt !== null ||
        appointment.user.role !== Role.DOCTOR
      ) {
        throw new ConflictException(
          'Appointment of a deleted patient or inactive doctor is read-only',
        );
      }

      const created = await tx.observation.create({
        data: {
          uuid: observation.uuid,
          appointmentId: appointment.id,
          message: observation.message,
        },
        include: observationInclude,
      });
      return toObservationResponse(created);
    });
  }
}
