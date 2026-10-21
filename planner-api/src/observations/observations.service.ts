import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Paginated, paginated } from '../common/pagination/paginated.js';
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
      // Trava a linha do agendamento até o fim da transação. O DELETE de
      // agendamento passará a usar o mesmo lock (fatia 3/4, #52); então ele
      // não exclui o agendamento enquanto a observação é criada (I4). O SQL
      // cru não leva schema: a conexão fixa o `search_path` em DB_SCHEMA.
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

  // Leitura (R7): vale mesmo com paciente ou médico inativo; só a escrita
  // recebe 409. Sem transação nem lock: é um retrato de leitura.
  async listByAppointment(
    appointmentUuid: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<ObservationResponseDto>> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { uuid: appointmentUuid, deletedAt: null },
      select: { id: true },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    const where = { appointmentId: appointment.id, deletedAt: null };
    const [observations, total] = await this.prisma.$transaction([
      this.prisma.observation.findMany({
        where,
        include: observationInclude,
        // id desempata createdAt iguais: a paginação não repete nem pula.
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.observation.count({ where }),
    ]);
    return paginated(observations.map(toObservationResponse), total, query);
  }

  // Filtra só a própria observação: o histórico segue legível (R10), e o
  // DELETE de agendamento com observação ativa dará 409 (fatia 3/4, #52).
  async findOne(uuid: string): Promise<ObservationResponseDto> {
    const observation = await this.prisma.observation.findFirst({
      where: { uuid, deletedAt: null },
      include: observationInclude,
    });
    if (!observation) {
      throw new NotFoundException('Observation not found');
    }
    return toObservationResponse(observation);
  }
}
